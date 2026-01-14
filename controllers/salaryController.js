const SalaryModel = require('../models/SalaryModel');
const ExpenseModel = require('../models/ExpenseModel'); // For payment recording
const EmployeeModel = require('../models/EmployeeModel'); // Helper potentially

class SalaryController {

    static async calculate(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: "Başlangıç ve bitiş tarihi gerekli" });
            }

            const settings = await SalaryModel.getPayrollSettings(endDate);
            const sgkRate = (settings.SGK_EMPLOYEE_RATE || 14) / 100;
            const overtimeMultiplier = settings.OVERTIME_MULTIPLIER || 1.5;

            const [employees] = await SalaryModel.getAllEmployees();
            const results = [];

            for (const emp of employees) {
                // 1. Shift Calculation
                const [assignedShifts] = await SalaryModel.getEmployeeShifts(emp.id, startDate, endDate);
                let totalBaseMinutes = 0;
                assignedShifts.forEach(shift => {
                    const start = new Date(`1970-01-01T${shift.start_time}`);
                    const end = new Date(`1970-01-01T${shift.end_time}`);
                    let diffMs = end - start;
                    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                    let shiftMinutes = (diffMs / 60000) - (shift.break_minutes || 0);
                    totalBaseMinutes += Math.max(0, shiftMinutes);
                });

                // 2. Actual Log Calculation
                const [logs] = await SalaryModel.getEmployeeLogs(emp.id, startDate, endDate);
                let totalActualSeconds = 0;
                let currentCheckIn = null;

                logs.forEach(log => {
                    if (log.type === 1) {
                        currentCheckIn = new Date(log.log_time);
                    } else if (log.type === 2 && currentCheckIn) {
                        const checkOut = new Date(log.log_time);
                        totalActualSeconds += Math.floor((checkOut - currentCheckIn) / 1000);
                        currentCheckIn = null;
                    }
                });

                // Check active session
                const isLastLogToday = logs.length > 0 && new Date(logs[logs.length - 1].log_time).toISOString().split('T')[0] === endDate;
                if (logs.length > 0 && logs[logs.length - 1].type === 1 && currentCheckIn && isLastLogToday) {
                    const lastMoment = new Date(endDate + " 23:59:59");
                    totalActualSeconds += Math.floor((lastMoment - currentCheckIn) / 1000);
                }

                const totalActualMinutes = Math.floor(totalActualSeconds / 60);
                const totalActualHours = totalActualSeconds / 3600;

                // 3. Salary Formulas
                const monthlyBaseSalary = parseFloat(emp.salary) || 0;
                const baseHours = totalBaseMinutes / 60;
                const standardMonthlyHours = 225;
                const hourlyRate = monthlyBaseSalary / standardMonthlyHours;

                const normalMinutes = Math.min(totalActualMinutes, totalBaseMinutes);
                const overtimeMinutes = Math.max(0, totalActualMinutes - totalBaseMinutes);

                const normalPay = (normalMinutes / 60) * hourlyRate;
                const overtimePay = (overtimeMinutes / 60) * hourlyRate * overtimeMultiplier;

                const grossSalary = normalPay + overtimePay;
                const deductions = grossSalary * sgkRate;
                const netSalary = grossSalary - deductions;

                // 4. Payment status
                const [payments] = await SalaryModel.getLastPayment(emp.id, startDate, endDate);

                // Auto Type Classification
                let autoType = emp.type || "Tam Zamanlı";
                if (baseHours > 0) {
                    autoType = (baseHours >= 30 * (assignedShifts.length / 7 * 4)) ? "Tam Zamanlı" : "Yarı Zamanlı";
                }

                results.push({
                    id: emp.id,
                    name: emp.name,
                    surname: emp.surname,
                    fullName: `${emp.name} ${emp.surname}`,
                    position: emp.position_name || "Belirtilmemiş",
                    type: autoType,
                    positionDisplay: emp.position_name || "Belirtilmemiş",

                    baseHours: baseHours.toFixed(1),
                    actualHours: totalActualHours.toFixed(1),
                    actualMinutes: totalActualMinutes,
                    overtimeHours: (overtimeMinutes / 60).toFixed(1),
                    hoursDisplay: `${Math.floor(totalActualHours)}s ${totalActualMinutes % 60}dk`,

                    hourlyRate: hourlyRate.toFixed(2),
                    normalPay: normalPay.toFixed(2),
                    overtimePay: overtimePay.toFixed(2),
                    overtimeMultiplier: overtimeMultiplier,
                    grossSalary: grossSalary.toFixed(2),
                    sgkRate: sgkRate,
                    deductions: deductions.toFixed(2),
                    netSalary: netSalary.toFixed(2),

                    status: payments.length > 0 ? "Ödendi" : "Bekliyor",
                    paymentDate: payments.length > 0 ? payments[0].payment_date : null
                });
            }

            res.json(results);
        } catch (error) {
            console.error("Calculate salary error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) return res.status(400).json({ error: "Başlangıç ve bitiş tarihi gerekli" });

            const settings = await SalaryModel.getPayrollSettings(endDate);
            const sgkRate = (settings.SGK_EMPLOYEE_RATE || 14) / 100;
            const overtimeMultiplier = settings.OVERTIME_MULTIPLIER || 1.5;

            const [employees] = await SalaryModel.getAllEmployees();

            let totalNetSalary = 0;
            let totalGrossSalary = 0;
            let totalActualHours = 0;
            let totalBaseHours = 0;
            let activeEmployees = 0;

            for (const emp of employees) {
                // 1. Planned
                const [assignedShifts] = await SalaryModel.getEmployeeShifts(emp.id, startDate, endDate);
                let empBaseMinutes = 0;
                assignedShifts.forEach(shift => {
                    const start = new Date(`1970-01-01T${shift.start_time}`);
                    const end = new Date(`1970-01-01T${shift.end_time}`);
                    let diffMs = end - start;
                    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                    empBaseMinutes += Math.max(0, (diffMs / 60000));
                });

                // 2. Actual
                const [logs] = await SalaryModel.getEmployeeLogs(emp.id, startDate, endDate);
                if (logs.length === 0) continue;
                activeEmployees++;

                let empActualSeconds = 0;
                let currentCheckIn = null;
                logs.forEach(log => {
                    if (log.type === 1) currentCheckIn = new Date(log.log_time);
                    else if (log.type === 2 && currentCheckIn) {
                        empActualSeconds += Math.floor((new Date(log.log_time) - currentCheckIn) / 1000);
                        currentCheckIn = null;
                    }
                });

                const isLastLogToday = logs.length > 0 && new Date(logs[logs.length - 1].log_time).toISOString().split('T')[0] === endDate;
                if (logs.length > 0 && logs[logs.length - 1].type === 1 && currentCheckIn && isLastLogToday) {
                    empActualSeconds += Math.floor((new Date(endDate + " 23:59:59") - currentCheckIn) / 1000);
                }

                const empActualMinutes = Math.floor(empActualSeconds / 60);
                const hourlyRate = (parseFloat(emp.salary) || 0) / 225;

                const normalPay = (Math.min(empActualMinutes, empBaseMinutes) / 60) * hourlyRate;
                const overtimePay = (Math.max(0, empActualMinutes - empBaseMinutes) / 60) * hourlyRate * overtimeMultiplier;

                totalGrossSalary += (normalPay + overtimePay);
                totalNetSalary += (normalPay + overtimePay) * (1 - sgkRate);
                totalActualHours += (empActualSeconds / 3600);
                totalBaseHours += (empBaseMinutes / 60);
            }

            res.json({
                totalNetSalary: totalNetSalary.toFixed(2),
                totalGrossSalary: totalGrossSalary.toFixed(2),
                totalHours: Math.floor(totalActualHours),
                totalBaseHours: Math.floor(totalBaseHours),
                activeEmployees: activeEmployees
            });

        } catch (error) {
            console.error("Get salary summary error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async makePayment(req, res) {
        const connection = await SalaryModel.getConnection();
        try {
            const { empId, amount, paymentDate, empName } = req.body;
            if (!empId || !amount || !paymentDate) {
                connection.release();
                return res.status(400).json({ error: "Çalışan ID, tutar ve ödeme tarihi gerekli" });
            }

            await connection.beginTransaction();

            let employeeName = empName;
            if (!employeeName) {
                const [empRows] = await connection.execute("SELECT name, surname FROM employe WHERE id = ?", [empId]);
                employeeName = empRows.length > 0 ? `${empRows[0].name} ${empRows[0].surname}` : "Bilinmeyen Çalışan";
            }

            const [result] = await SalaryModel.createPayment({ emp_id: empId, amount: parseFloat(amount), payment_date: paymentDate }, connection);

            // Add Expense Record (Type 4 = Salary)
            await ExpenseModel.create({
                expense_type: 4,
                name: `${employeeName} Maaş Ödemesi`,
                price: parseFloat(amount),
                date: paymentDate
            }, connection);

            await connection.commit();
            connection.release();

            res.json({ success: true, id: result.insertId, message: "Ödeme başarıyla kaydedildi" });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error("Payment error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = SalaryController;
