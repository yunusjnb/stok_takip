const EmployeeModel = require('../models/EmployeeModel');

class EmployeeController {

    static async getAllEmployees(req, res) {
        try {
            const [rows] = await EmployeeModel.findAll();

            // Calculate working type based on last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            const results = [];
            for (const emp of rows) {
                const [shifts] = await EmployeeModel.getShiftsByEmployee(emp.id, startDate, endDate);

                let totalMinutes = 0;
                shifts.forEach(s => {
                    const start = new Date(`1970-01-01T${s.start_time}`);
                    const end = new Date(`1970-01-01T${s.end_time}`);
                    let diff = end - start;
                    if (diff < 0) diff += 24 * 3600000;
                    totalMinutes += (diff / 60000);
                });

                const weeklyAvg = shifts.length > 0 ? (totalMinutes / 60) / (30 / 7) : 0;

                if (shifts.length > 0) {
                    emp.type = weeklyAvg >= 30 ? "tam zamanlı" : "yarı zamanlı";
                }
                results.push(emp);
            }

            res.json(results);
        } catch (error) {
            console.error("Get employees error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getEmployeeById(req, res) {
        try {
            const [rows] = await EmployeeModel.findById(req.params.id);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Çalışan bulunamadı" });
            }
            const emp = rows[0];

            // 30 days check logic
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];

            const [shifts] = await EmployeeModel.getShiftsByEmployee(emp.id, startDate, endDate);
            if (shifts.length > 0) {
                // Logic repeated for consistency
                let totalMinutes = 0;
                shifts.forEach(s => {
                    const start = new Date(`1970-01-01T${s.start_time}`);
                    const end = new Date(`1970-01-01T${s.end_time}`);
                    let diff = end - start;
                    if (diff < 0) diff += 24 * 3600000;
                    totalMinutes += (diff / 60000);
                });
                const weeklyAvg = (totalMinutes / 60) / (30 / 7);
                emp.type = weeklyAvg >= 30 ? "tam zamanlı" : "yarı zamanlı";
            }

            res.json(emp);
        } catch (error) {
            console.error("Get employee error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createEmployee(req, res) {
        try {
            const { name, surname, phone, salary, position_id, type, shift_id } = req.body;
            if (!name || !surname || !salary || !position_id) {
                return res.status(400).json({ error: "İsim, soyisim, maaş ve pozisyon gerekli" });
            }

            const [result] = await EmployeeModel.create({ name, surname, phone, salary, position_id, type, shift_id });
            res.json({ success: true, id: result.insertId, message: "Çalışan eklendi" });
        } catch (error) {
            console.error("Add employee error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateEmployee(req, res) {
        try {
            const { name, surname, phone, salary, position_id, type, shift_id } = req.body;
            const { id } = req.params;

            if (!name || !surname || !salary || !position_id) {
                return res.status(400).json({ error: "İsim, soyisim, maaş ve pozisyon gerekli" });
            }

            const [result] = await EmployeeModel.update(id, { name, surname, phone, salary, position_id, type, shift_id });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Çalışan bulunamadı" });
            }
            res.json({ success: true, message: "Çalışan güncellendi" });
        } catch (error) {
            console.error("Update employee error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteEmployee(req, res) {
        try {
            const [result] = await EmployeeModel.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Çalışan bulunamadı" });
            }
            res.json({ success: true, message: "Çalışan silindi" });
        } catch (error) {
            console.error("Delete employee error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getPositions(req, res) {
        try {
            const [rows] = await EmployeeModel.getPositions();
            res.json(rows);
        } catch (error) {
            console.error("Get positions error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    // Logs Logic
    static async getTodayLogs(req, res) {
        try {
            const { date } = req.query;
            const targetDate = date || new Date().toISOString().split("T")[0];
            const gracePeriodMinutes = 15;

            const [shifts] = await EmployeeModel.getShiftsByDate(targetDate);
            const shiftMap = {};
            shifts.forEach(s => shiftMap[s.employee_id] = s);

            const [allLogs] = await EmployeeModel.getLogsByDate(targetDate);
            const employeeData = {};

            allLogs.forEach((log) => {
                if (!employeeData[log.id]) {
                    employeeData[log.id] = {
                        id: log.id,
                        name: log.name,
                        surname: log.surname,
                        logs: [],
                        first_check_in: null,
                        last_check_out: null,
                    };
                }
                const emp = employeeData[log.id];
                emp.logs.push({ type: log.type, log_time: log.log_time, log_id: log.log_id });

                if (log.type === 1 && !emp.first_check_in) {
                    emp.first_check_in = log.log_time;
                    emp.first_check_in_log_id = log.log_id;
                }
                if (log.type === 2) {
                    emp.last_check_out = log.log_time;
                    emp.last_check_out_log_id = log.log_id;
                }
            });

            const [leaveRows] = await EmployeeModel.getLeavesByDate(targetDate);
            leaveRows.forEach((lv) => {
                if (!employeeData[lv.emp_id]) {
                    employeeData[lv.emp_id] = {
                        id: lv.emp_id,
                        name: lv.name,
                        surname: lv.surname,
                        logs: [],
                        first_check_in: null,
                        last_check_out: null,
                        leaves: []
                    };
                }
                employeeData[lv.emp_id].leaves = employeeData[lv.emp_id].leaves || [];
                employeeData[lv.emp_id].leaves.push({
                    start_date: lv.start_date,
                    end_date: lv.end_date,
                    total_days: lv.total_days,
                    note: lv.note
                });
            });

            const result = Object.values(employeeData).map((emp) => {
                let totalSeconds = 0;
                let currentCheckIn = null;
                let isWorking = false;

                emp.logs.forEach((log) => {
                    if (log.type === 1) {
                        currentCheckIn = new Date(log.log_time);
                    } else if (log.type === 2 && currentCheckIn) {
                        const checkOut = new Date(log.log_time);
                        totalSeconds += Math.floor((checkOut - currentCheckIn) / 1000);
                        currentCheckIn = null;
                    }
                });

                if (emp.logs.length > 0 && emp.logs[emp.logs.length - 1].type === 1) {
                    isWorking = true;
                    if (currentCheckIn) {
                        const now = new Date();
                        totalSeconds += Math.floor((now - currentCheckIn) / 1000);
                    }
                }

                let isLate = false;
                let shiftInfo = shiftMap[emp.id];
                if (shiftInfo && emp.first_check_in) {
                    const checkInTime = new Date(emp.first_check_in);
                    const shiftStartParts = shiftInfo.start_time.split(':');
                    const shiftStart = new Date(checkInTime);
                    shiftStart.setHours(parseInt(shiftStartParts[0]), parseInt(shiftStartParts[1]), 0, 0);
                    const lateThreshold = new Date(shiftStart.getTime() + gracePeriodMinutes * 60000);
                    if (checkInTime > lateThreshold) isLate = true;
                }

                return {
                    id: emp.id,
                    name: emp.name,
                    surname: emp.surname,
                    check_in: emp.first_check_in,
                    check_out: emp.last_check_out,
                    check_in_log_id: emp.first_check_in_log_id || null,
                    check_out_log_id: emp.last_check_out_log_id || null,
                    all_logs: emp.logs,
                    total_seconds: totalSeconds,
                    status: emp.leaves && emp.leaves.length ? "İzinli" : isWorking ? "Çalışıyor" : "Ayrıldı",
                    leave: emp.leaves && emp.leaves.length ? emp.leaves[0] : null,
                    is_late: isLate,
                    shift_name: shiftInfo ? shiftInfo.shift_name : null,
                    shift_start: shiftInfo ? shiftInfo.start_time : null
                };
            });

            res.json(result);
        } catch (error) {
            console.error("Get today logs error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createLog(req, res) {
        try {
            const { id } = req.params;
            const { type, date } = req.body;

            if (!type || (type !== 1 && type !== 2)) {
                return res.status(400).json({ error: "Geçerli bir log tipi gerekli (1 veya 2)" });
            }

            let logTime;
            if (date) {
                if (type === 2) logTime = `${date} 23:59:59`;
                else logTime = `${date} 00:00:00`;
            } else {
                logTime = null;
            }

            const [result] = await EmployeeModel.createLog(id, type, logTime);
            res.json({ success: true, message: type === 1 ? "Giriş yapıldı" : "Çıkış yapıldı" });
        } catch (error) {
            console.error("Create log error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateLog(req, res) {
        try {
            const { logId } = req.params;
            const { log_time } = req.body;

            if (!log_time) return res.status(400).json({ error: "Log zamanı gerekli" });

            const [logRows] = await EmployeeModel.findLogById(logId);
            if (logRows.length === 0) return res.status(404).json({ error: "Log kaydı bulunamadı" });

            const [result] = await EmployeeModel.updateLog(logId, log_time);
            if (result.affectedRows === 0) return res.status(404).json({ error: "Log kaydı güncellenemedi" });

            res.json({ success: true, message: "Log kaydı güncellendi" });
        } catch (error) {
            console.error("Update log error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    // Shifts
    static async getEmployeeShifts(req, res) {
        try {
            const { id } = req.params;
            const { start_date, end_date } = req.query;
            const [rows] = await EmployeeModel.getShiftsByEmployee(id, start_date, end_date);
            res.json(rows);
        } catch (error) {
            console.error("Get employee shifts error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async assignShift(req, res) {
        try {
            const { id } = req.params;
            const { shift_id, shift_date } = req.body;

            if (!shift_id || !shift_date) return res.status(400).json({ error: "Vardiya ID ve tarih gerekli" });

            const [existing] = await EmployeeModel.findShiftByDate(id, shift_date);

            if (existing.length > 0) {
                await EmployeeModel.updateShift(existing[0].id, shift_id, shift_date);
                res.json({ success: true, message: "Vardiya güncellendi" });
            } else {
                const [result] = await EmployeeModel.createShift(id, shift_id, shift_date);
                res.json({ success: true, id: result.insertId, message: "Vardiya atandı" });
            }
        } catch (error) {
            console.error("Assign shift error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteShiftAssignment(req, res) {
        try {
            const { id, shiftAssignmentId } = req.params;
            const [result] = await EmployeeModel.deleteShift(shiftAssignmentId, id);

            if (result.affectedRows === 0) return res.status(404).json({ error: "Vardiya ataması bulunamadı" });
            res.json({ success: true, message: "Vardiya ataması silindi" });
        } catch (error) {
            console.error("Delete shift error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getShiftTemplates(req, res) {
        try {
            const [rows] = await EmployeeModel.getShiftTemplates();
            res.json(rows);
        } catch (error) {
            console.error("Get shifts error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    // Leaves
    static async getEmployeeLeave(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await EmployeeModel.findById(id);
            if (rows.length === 0) return res.status(404).json({ error: "Çalışan bulunamadı" });

            const emp = rows[0];
            if (emp.annual_leave_remaining !== null) {
                return res.json({ remaining: emp.annual_leave_remaining, limit: emp.annual_leave_limit });
            }

            const year = new Date().getFullYear();
            const [usedRows] = await EmployeeModel.getUsedLeaves(id, year);
            const used = usedRows[0]?.used || 0;
            const remaining = (emp.annual_leave_limit || 0) - used;
            res.json({ remaining, limit: emp.annual_leave_limit, used });
        } catch (error) {
            console.error("Get leave error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createEmployeeLeave(req, res) {
        try {
            const { id } = req.params;
            const { days, start_date, end_date, note } = req.body;
            const daysNum = parseInt(days, 10);

            if (!daysNum || daysNum <= 0) return res.status(400).json({ error: "Geçerli gün sayısı gerekli" });

            const [rows] = await EmployeeModel.findById(id);
            if (rows.length === 0) return res.status(404).json({ error: "Çalışan bulunamadı" });
            const emp = rows[0];
            const remaining = emp.annual_leave_remaining !== null ? parseFloat(emp.annual_leave_remaining) : null;

            if (remaining !== null && remaining < daysNum) {
                return res.status(400).json({ error: "Yetersiz yıllık izin" });
            }

            const now = new Date();
            const todayStr = new Date().toISOString().split("T")[0];
            const sd = start_date || todayStr;
            const sdParts = sd.split("-").map((p) => parseInt(p, 10));
            const d = new Date(sdParts[0], (sdParts[1] || 1) - 1, sdParts[2] || 1);
            d.setDate(d.getDate() + daysNum - 1);
            const ed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            const connection = await EmployeeModel.getConnection();
            await connection.beginTransaction();

            try {
                await EmployeeModel.createLeave({ emp_id: id, start_date: sd, end_date: ed, total_days: daysNum, note }, connection);

                if (remaining !== null) {
                    await EmployeeModel.updateRemainingLeave(id, daysNum, connection);
                }

                await connection.commit();
                connection.release();

                if (remaining !== null) {
                    res.json({ success: true, remaining: remaining - daysNum });
                } else {
                    res.json({ success: true, message: "İzin kaydedildi" });
                }
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Create leave error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getActiveEmployees(req, res) {
        try {
            const { date } = req.query;
            const targetDate = date || new Date().toISOString().split("T")[0];
            const [rows] = await EmployeeModel.getActiveCount(targetDate);
            res.json(rows[0]);
        } catch (error) {
            console.error("Get active error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
    static async getTotalHours(req, res) {
        try {
            const { date } = req.query;
            const targetDate = date || new Date().toISOString().split("T")[0];
            const [rows] = await EmployeeModel.getTotalHours(targetDate);
            res.json({ total_hours: rows[0]?.total_hours || 0 });
        } catch (error) {
            console.error("Get total hours error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getLateStats(req, res) {
        try {
            const { date } = req.query;
            const targetDate = date || new Date().toISOString().split("T")[0];
            const gracePeriodMinutes = 15;
            const [rows] = await EmployeeModel.getLateEmployees(targetDate, gracePeriodMinutes);
            res.json({
                late_count: rows.length,
                late_employees: rows
            });
        } catch (error) {
            console.error("Get late stats error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = EmployeeController;
