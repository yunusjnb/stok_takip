const BaseModel = require('./BaseModel');

class EmployeeModel extends BaseModel {
    static async findAll() {
        const sql = `
            SELECT e.*, p.posit_name AS position_name
            FROM employe e
            LEFT JOIN positions p ON e.position_id = p.id
            ORDER BY e.created_at DESC
        `;
        return this.query(sql);
    }

    static async findById(id) {
        const sql = `
            SELECT e.*, p.posit_name AS position_name, s.name AS shift_name
            FROM employe e
            LEFT JOIN positions p ON e.position_id = p.id
            LEFT JOIN shift_templates s ON e.shift_id = s.id
            WHERE e.id = ?
        `;
        return this.query(sql, [id]);
    }

    static async create(data) {
        const sql = "INSERT INTO employe (name, surname, phone, salary, position_id, type, shift_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return this.query(sql, [
            data.name,
            data.surname,
            data.phone || null,
            data.salary,
            data.position_id || null,
            data.type || "tam zamanlı",
            data.shift_id || null,
        ]);
    }

    static async update(id, data) {
        const sql = "UPDATE employe SET name = ?, surname = ?, phone = ?, salary = ?, position_id = ?, type = COALESCE(?, type), shift_id = ? WHERE id = ?";
        return this.query(sql, [
            data.name,
            data.surname,
            data.phone || null,
            data.salary,
            data.position_id || null,
            data.type || null,
            data.shift_id || null,
            id,
        ]);
    }

    static async delete(id) {
        return this.query("DELETE FROM employe WHERE id = ?", [id]);
    }

    static async getPositions() {
        return this.query("SELECT id, posit_name FROM positions ORDER BY posit_name");
    }

    // Shift Operations
    static async getShiftsByEmployee(employeeId, startDate, endDate) {
        let sql = `
            SELECT es.id, es.employee_id, es.shift_template_id, DATE_FORMAT(es.shift_date, '%Y-%m-%d') as shift_date, s.name as shift_name, s.start_time, s.end_time
            FROM employee_shifts es
            JOIN shift_templates s ON es.shift_template_id = s.id
            WHERE es.employee_id = ?
        `;
        const params = [employeeId];

        if (startDate) {
            sql += " AND es.shift_date >= ?";
            params.push(startDate);
        }
        if (endDate) {
            sql += " AND es.shift_date <= ?";
            params.push(endDate);
        }

        sql += " ORDER BY es.shift_date ASC";
        return this.query(sql, params);
    }

    static async getShiftTemplates() {
        return this.query("SELECT * FROM shift_templates ORDER BY start_time");
    }

    static async findShiftByDate(employeeId, date) {
        return this.query("SELECT id FROM employee_shifts WHERE employee_id = ? AND DATE(shift_date) = DATE(?)", [employeeId, date]);
    }

    static async updateShift(id, shiftTemplateId, date) {
        return this.query("UPDATE employee_shifts SET shift_template_id = ?, shift_date = ? WHERE id = ?", [shiftTemplateId, date, id]);
    }

    static async createShift(employeeId, shiftTemplateId, date) {
        return this.query("INSERT INTO employee_shifts (employee_id, shift_template_id, shift_date) VALUES (?, ?, ?)", [employeeId, shiftTemplateId, date]);
    }

    static async deleteShift(id, employeeId) {
        return this.query("DELETE FROM employee_shifts WHERE id = ? AND employee_id = ?", [id, employeeId]);
    }

    // Logs Operations
    static async getLogsByDate(date) {
        const sql = `
          SELECT 
            e.id,
            e.name,
            e.surname,
            el.id as log_id,
            el.type,
            el.log_time
          FROM employe e
          INNER JOIN employe_logs el ON e.id = el.emp_id 
          WHERE DATE(el.log_time) = ?
          ORDER BY e.id, el.log_time ASC
        `;
        return this.query(sql, [date]);
    }

    static async getShiftsByDate(date) {
        const sql = `
          SELECT es.employee_id, s.start_time, s.name as shift_name
          FROM employee_shifts es
          JOIN shift_templates s ON es.shift_template_id = s.id
          WHERE es.shift_date = ?
        `;
        return this.query(sql, [date]);
    }

    static async createLog(employeeId, type, logTime) {
        let sql = "INSERT INTO employe_logs (emp_id, type) VALUES (?, ?)";
        let params = [employeeId, type];

        if (logTime) {
            sql = "INSERT INTO employe_logs (emp_id, type, log_time) VALUES (?, ?, ?)";
            params.push(logTime);
        }

        return this.query(sql, params);
    }

    static async updateLog(logId, logTime) {
        return this.query("UPDATE employe_logs SET log_time = ? WHERE id = ?", [logTime, logId]);
    }

    static async findLogById(logId) {
        return this.query("SELECT * FROM employe_logs WHERE id = ?", [logId]);
    }

    // Leave Operations
    static async getLeavesByDate(date) {
        const sql = `
          SELECT l.id, l.emp_id, DATE_FORMAT(l.start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(l.end_date, '%Y-%m-%d') AS end_date, l.total_days, l.note, e.name, e.surname
          FROM employee_leaves l
          JOIN employe e ON l.emp_id = e.id
          WHERE ? BETWEEN l.start_date AND l.end_date
        `;
        return this.query(sql, [date]);
    }

    static async getUsedLeaves(employeeId, year) {
        return this.query(
            "SELECT COALESCE(SUM(total_days),0) as used FROM employee_leaves WHERE emp_id = ? AND leave_type = 1 AND YEAR(start_date) = ?",
            [employeeId, year]
        );
    }

    static async createLeave(data, connection) {
        const sql = "INSERT INTO employee_leaves (emp_id, start_date, end_date, total_days, leave_type, note) VALUES (?, ?, ?, ?, 1, ?)";
        const params = [data.emp_id, data.start_date, data.end_date, data.total_days, data.note || null];

        if (connection) return connection.execute(sql, params);
        return this.query(sql, params);
    }

    static async updateRemainingLeave(employeeId, days, connection) {
        const sql = "UPDATE employe SET annual_leave_remaining = annual_leave_remaining - ? WHERE id = ?";
        if (connection) return connection.execute(sql, [days, employeeId]);
        return this.query(sql, [days, employeeId]);
    }

    // Stats
    static async getActiveCount(date) {
        const sql = `
          SELECT COUNT(DISTINCT e.id) as active_count
          FROM employe e
          INNER JOIN employe_logs el ON e.id = el.emp_id
          WHERE DATE(el.log_time) = ?
          AND el.type = 1
          AND NOT EXISTS (
            SELECT 1 FROM employe_logs el2 
            WHERE el2.emp_id = e.id 
            AND DATE(el2.log_time) = ? 
            AND el2.type = 2 
            AND el2.log_time > el.log_time
          )
        `;
        return this.query(sql, [date, date]);
    }
    static async getTotalHours(date) {
        const sql = `
          SELECT 
            COALESCE(SUM(
              TIMESTAMPDIFF(HOUR, 
                check_in.log_time,
                check_out.log_time
              )
            ), 0) as total_hours
          FROM (
            SELECT emp_id, MAX(log_time) as log_time
            FROM employe_logs
            WHERE DATE(log_time) = ? AND type = 1
            GROUP BY emp_id
          ) check_in
          INNER JOIN (
            SELECT emp_id, MAX(log_time) as log_time
            FROM employe_logs
            WHERE DATE(log_time) = ? AND type = 2
            GROUP BY emp_id
          ) check_out ON check_in.emp_id = check_out.emp_id
          WHERE check_out.log_time > check_in.log_time
        `;
        return this.query(sql, [date, date]);
    }

    static async getLateEmployees(date, gracePeriodMinutes) {
        const sql = `
          SELECT 
            e.id,
            e.name,
            e.surname,
            p.posit_name as position_name,
            s.name as shift_name,
            s.start_time as shift_start,
            s.end_time as shift_end,
            MIN(el.log_time) as check_in,
            TIMESTAMPDIFF(MINUTE, 
              ADDTIME(s.start_time, '00:${gracePeriodMinutes}:00'),
              TIME(MIN(el.log_time))
            ) as minutes_late
          FROM employe e
          LEFT JOIN positions p ON e.position_id = p.id
          INNER JOIN employee_shifts es ON e.id = es.employee_id
          INNER JOIN shift_templates s ON es.shift_template_id = s.id
          INNER JOIN employe_logs el ON e.id = el.emp_id
          WHERE es.shift_date = ?
          AND DATE(el.log_time) = ?
          AND el.type = 1
          GROUP BY e.id, s.start_time, s.end_time, s.name, p.posit_name
          HAVING TIME(MIN(el.log_time)) > ADDTIME(s.start_time, '00:${gracePeriodMinutes}:00')
        `;
        return this.query(sql, [date, date]);
    }
}

module.exports = EmployeeModel;
