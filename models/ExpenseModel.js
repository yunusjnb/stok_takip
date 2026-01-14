const BaseModel = require('./BaseModel');

class ExpenseModel extends BaseModel {
    static async findAll(startDate, endDate, typeId) {
        let sql = `
            SELECT e.*, et.type_name 
            FROM expense e 
            LEFT JOIN expense_types et ON e.expense_type = et.id 
            WHERE 1=1
        `;
        const params = [];

        if (startDate && endDate) {
            sql += " AND e.date BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        if (typeId) {
            sql += " AND e.expense_type = ?";
            params.push(typeId);
        }

        sql += " ORDER BY e.date DESC, e.id DESC";

        return this.query(sql, params);
    }

    static async getTypes() {
        return this.query("SELECT * FROM expense_types ORDER BY type_name");
    }

    static async findById(id) {
        const sql = `
            SELECT e.*, et.type_name 
            FROM expense e 
            LEFT JOIN expense_types et ON e.expense_type = et.id 
            WHERE e.id = ?
        `;
        return this.query(sql, [id]);
    }

    static async getRecent(limit) {
        const sql = `
            SELECT e.*, et.type_name 
            FROM expense e 
            LEFT JOIN expense_types et ON e.expense_type = et.id 
            ORDER BY e.date DESC, e.id DESC 
            LIMIT ${limit}
        `;
        return this.query(sql);
    }

    static async create(data, connection) {
        const sql = "INSERT INTO expense (expense_type, name, price, date, description) VALUES (?, ?, ?, ?, ?)";
        return (connection || this).execute(sql, [
            data.expense_type,
            data.name,
            data.price,
            data.date,
            data.description || ""
        ]);
    }

    static async update(id, data) {
        const sql = "UPDATE expense SET expense_type = ?, name = ?, price = ?, date = ?, description = ? WHERE id = ?";
        return this.query(sql, [
            data.expense_type,
            data.name,
            data.price,
            data.date,
            data.description || "",
            id
        ]);
    }

    static async delete(id) {
        return this.query("DELETE FROM expense WHERE id = ?", [id]);
    }

    static async getMonthlyTotal(year, month) {
        const sql = `
            SELECT COALESCE(SUM(price), 0) as total 
            FROM expense 
            WHERE YEAR(date) = ? AND MONTH(date) = ?
        `;
        return this.query(sql, [year, month]);
    }
}

module.exports = ExpenseModel;
