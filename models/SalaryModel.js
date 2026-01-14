const BaseModel = require('./BaseModel');

class SalaryModel extends BaseModel {

    // Payroll Settings logic
    static async getPayrollSettings(targetDate) {
        // Fetch current settings as fallback
        const [currentSettings] = await this.query("SELECT code, value FROM payroll_settings");
        const settings = {};
        currentSettings.forEach(row => settings[row.code] = parseFloat(row.value));

        if (targetDate) {
            // Try fetch historical settings
            const sql = `
               SELECT code, value, value_string 
               FROM payroll_setting_history p1
               WHERE effective_date <= ?
               AND effective_date = (
                   SELECT MAX(effective_date) 
                   FROM payroll_setting_history p2 
                   WHERE p2.code = p1.code AND p2.effective_date <= ?
               )
            `;
            const [historyRows] = await this.query(sql, [targetDate, targetDate]);
            if (historyRows.length > 0) {
                // Update with historical values
                historyRows.forEach(row => settings[row.code] = parseFloat(row.value));
            }
        }
        return settings;
    }

    // Data gathering for calculation
    static async getAllEmployees() {
        const sql = `
          SELECT e.*, p.posit_name AS position_name
          FROM employe e
          LEFT JOIN positions p ON e.position_id = p.id
          ORDER BY e.name, e.surname
        `;
        return this.query(sql);
    }

    static async getEmployeeShifts(employeeId, startDate, endDate) {
        const sql = `
            SELECT es.*, s.start_time, s.end_time, s.break_minutes
            FROM employee_shifts es
            JOIN shift_templates s ON es.shift_template_id = s.id
            WHERE es.employee_id = ? AND es.shift_date BETWEEN ? AND ?
        `;
        return this.query(sql, [employeeId, startDate, endDate]);
    }

    static async getEmployeeLogs(employeeId, startDate, endDate) {
        const sql = `
            SELECT id, type, log_time
            FROM employe_logs
            WHERE emp_id = ? AND DATE(log_time) BETWEEN ? AND ?
            ORDER BY log_time ASC
        `;
        return this.query(sql, [employeeId, startDate, endDate]);
    }

    static async getLastPayment(employeeId, startDate, endDate) {
        const sql = `
            SELECT * FROM salary_payments
            WHERE emp_id = ? AND payment_date BETWEEN ? AND ?
            ORDER BY payment_date DESC LIMIT 1
        `;
        return this.query(sql, [employeeId, startDate, endDate]);
    }

    static async createPayment(data, connection) {
        const sql = "INSERT INTO salary_payments (emp_id, amount, payment_date) VALUES (?, ?, ?)";
        return (connection || this).execute(sql, [data.emp_id, data.amount, data.payment_date]);
    }
}

module.exports = SalaryModel;
