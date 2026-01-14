const BaseModel = require('./BaseModel');

class ReportModel extends BaseModel {

    // Monthly Close Report
    static async getMonthlyIncome(year, month) {
        const sql = `
            SELECT COALESCE(SUM(total_price), 0) as total_income
            FROM sales
            WHERE YEAR(date) = ? AND MONTH(date) = ?
        `;
        return this.query(sql, [year, month]);
    }

    static async getMonthlyExpenses(year, month) {
        const sql = `
            SELECT COALESCE(SUM(price), 0) as total_expenses
            FROM expense
            WHERE YEAR(date) = ? AND MONTH(date) = ?
        `;
        return this.query(sql, [year, month]);
    }

    static async getMonthlyPoExpenses(year, month) {
        const sql = `
            SELECT COALESCE(SUM(total_amount), 0) as total_po
            FROM purchase_orders
            WHERE status = 3 AND YEAR(order_date) = ? AND MONTH(order_date) = ?
        `;
        return this.query(sql, [year, month]);
    }

    // Daily Flow
    static async getDailyIncome(year, month) {
        const sql = `
            SELECT DATE(date) as date, COALESCE(SUM(total_price), 0) as income
            FROM sales
            WHERE YEAR(date) = ? AND MONTH(date) = ?
            GROUP BY DATE(date)
            ORDER BY date ASC
        `;
        return this.query(sql, [year, month]);
    }

    static async getDailyExpenses(year, month) {
        const sql = `
            SELECT DATE(date) as date, COALESCE(SUM(price), 0) as expenses
            FROM expense
            WHERE YEAR(date) = ? AND MONTH(date) = ?
            GROUP BY DATE(date)
            ORDER BY date ASC
        `;
        return this.query(sql, [year, month]);
    }

    static async getDailyPoExpenses(year, month) {
        const sql = `
            SELECT DATE(order_date) as date, COALESCE(SUM(total_amount), 0) as expenses
            FROM purchase_orders
            WHERE status = 3 AND YEAR(order_date) = ? AND MONTH(order_date) = ?
            GROUP BY DATE(order_date)
            ORDER BY date ASC
        `;
        return this.query(sql, [year, month]);
    }

    // Expense Breakdown
    static async getExpenseBreakdown(year, month) {
        const sql = `
           SELECT 
            et.id,
            et.type_name,
            COALESCE(SUM(e.price), 0) as total
           FROM expense_types et
           LEFT JOIN expense e ON et.id = e.expense_type 
             AND YEAR(e.date) = ? AND MONTH(e.date) = ?
           GROUP BY et.id, et.type_name
           HAVING total > 0
           ORDER BY total DESC
        `;
        return this.query(sql, [year, month]);
    }

    // Details & Export
    static async getExpenseDetails(year, month, search, limit, offset) {
        let sql = `
          SELECT e.id, e.name, e.price, e.date, e.description, et.type_name
          FROM expense e
          JOIN expense_types et ON e.expense_type = et.id
          WHERE YEAR(e.date) = ? AND MONTH(e.date) = ?
        `;
        const params = [year, month];

        if (search) {
            sql += " AND (e.name LIKE ? OR et.type_name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        if (limit !== undefined && offset !== undefined) {
            // We can handle pagination in Controller or here. 
            // But since we are combining two lists (Expense + PO), pagination logic 
            // in SQL is tricky if we want to sort the combined result.
            // The original code does in-memory pagination after fetching both tables.
            // So here we just return the filtered list.
        }

        return this.query(sql, params);
    }

    static async getPoDetails(year, month, search) {
        let sql = `
          SELECT po.id, CONCAT(w.name, ' - Sipariş #', po.id) as name, po.total_amount as price, po.order_date as date, 'Tedarik Ödemesi' as type_name
          FROM purchase_orders po
          JOIN wholesaler w ON po.wholesaler_id = w.id
          WHERE po.status = 3 AND YEAR(po.order_date) = ? AND MONTH(po.order_date) = ?
        `;
        const params = [year, month];

        if (search) {
            sql += " AND (w.name LIKE ? OR 'Tedarik Ödemesi' LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
        return this.query(sql, params);
    }

    static async getPoItems(poIds) {
        if (!poIds || poIds.length === 0) return [[], []]; // Return empty result set structure

        // Dynamic placeholders
        const placeholders = poIds.map(() => '?').join(',');
        const sql = `
            SELECT poi.purchase_order_id, poi.quantity,
                    CASE 
                      WHEN poi.item_type = 1 THEN i.name 
                      WHEN poi.item_type = 2 THEN p.name 
                      ELSE 'Bilinmeyen' 
                    END as item_name,
                    CASE 
                      WHEN poi.item_type = 1 THEN i.unit 
                      WHEN poi.item_type = 2 THEN 'adet' 
                      ELSE '' 
                    END as unit
             FROM purchase_order_items poi
             LEFT JOIN ingredient i ON poi.item_type = 1 AND poi.item_id = i.id
             LEFT JOIN product p ON poi.item_type = 2 AND poi.item_id = p.id
             WHERE poi.purchase_order_id IN (${placeholders})
        `;
        return this.query(sql, poIds);
    }

    static async getAvailableMonths() {
        const sql = `
            SELECT DISTINCT YEAR(date) as year, MONTH(date) as month
            FROM (
                SELECT date FROM sales
                UNION
                SELECT date FROM expense
            ) as combined
            ORDER BY year DESC, month DESC
            LIMIT 12
        `;
        return this.query(sql);
    }

    static async getExpenseRowsForExport(year, month) {
        const sql = `
           SELECT e.id, e.name, e.price, e.date, et.type_name, e.description
           FROM expense e
           JOIN expense_types et ON e.expense_type = et.id
           WHERE YEAR(e.date) = ? AND MONTH(e.date) = ?
           ORDER BY e.date ASC
         `;
        return this.query(sql, [year, month]);
    }

    static async getPoRowsForExport(year, month) {
        const sql = `
           SELECT po.id, w.name as supplier_name, po.total_amount as price, po.order_date as date
           FROM purchase_orders po
           JOIN wholesaler w ON po.wholesaler_id = w.id
           WHERE po.status = 3 AND YEAR(po.order_date) = ? AND MONTH(po.order_date) = ?
           ORDER BY po.order_date ASC
         `;
        return this.query(sql, [year, month]);
    }
}

module.exports = ReportModel;
