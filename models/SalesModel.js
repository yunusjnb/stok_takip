const BaseModel = require('./BaseModel');

class SalesModel extends BaseModel {
    static async create(data, connection) {
        const sql = "INSERT INTO sales (product_id, quantity, total_price, income, date, payment_type, sales_type) VALUES (?, ?, ?, ?, NOW(), ?, ?)";
        const params = [
            data.product_id,
            data.quantity,
            data.total_price,
            data.income,
            data.payment_type,
            data.sales_type
        ];

        if (connection) return connection.execute(sql, params);
        return this.query(sql, params);
    }

    static async getDailySales(date) {
        const sql = `
            SELECT 
                HOUR(s.date) as hour,
                SUM(s.total_price) as daily_total,
                SUM(s.quantity) as daily_quantity,
                COUNT(*) as order_count
            FROM sales s
            WHERE DATE(s.date) = ?
            GROUP BY HOUR(s.date)
            ORDER BY hour ASC
        `;
        return this.query(sql, [date]);
    }

    static async getWeeklySales() {
        const sql = `
            SELECT 
                DATE(s.date) as sale_date,
                SUM(s.total_price) as daily_total,
                SUM(s.quantity) as daily_quantity,
                COUNT(*) as order_count
            FROM sales s
            WHERE YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)
            GROUP BY DATE(s.date)
            ORDER BY sale_date DESC
        `;
        return this.query(sql);
    }

    static async getMonthlySales() {
        const sql = `
            SELECT 
                DATE(s.date) as sale_date,
                SUM(s.total_price) as daily_total,
                SUM(s.quantity) as daily_quantity,
                COUNT(*) as order_count
            FROM sales s
            WHERE YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE())
            GROUP BY DATE(s.date)
            ORDER BY sale_date DESC
        `;
        return this.query(sql);
    }

    static async getTrend(startDate, endDate, grouping) {
        let sql = "";
        const params = [startDate, endDate];

        if (grouping === 'month') {
            sql = `SELECT 
                DATE_FORMAT(s.date, '%Y-%m-01') as sale_date,
                SUM(s.total_price) as daily_total,
                SUM(s.quantity) as daily_quantity,
                COUNT(*) as order_count,
                'month' as grouping
               FROM sales s
               WHERE DATE(s.date) BETWEEN ? AND ?
               GROUP BY YEAR(s.date), MONTH(s.date)
               ORDER BY sale_date ASC`;
        } else {
            sql = `SELECT 
                DATE(s.date) as sale_date,
                SUM(s.total_price) as daily_total,
                SUM(s.quantity) as daily_quantity,
                COUNT(*) as order_count,
                'day' as grouping
               FROM sales s
               WHERE DATE(s.date) BETWEEN ? AND ?
               GROUP BY DATE(s.date)
               ORDER BY sale_date ASC`;
        }
        return this.query(sql, params);
    }

    static async getStats(dateCondition, queryParams) {
        const sql = `
           SELECT 
            SUM(s.total_price) as total_revenue,
            SUM(s.quantity) as total_quantity,
            COUNT(*) as total_orders,
            AVG(s.total_price) as avg_order_value
           FROM sales s
           WHERE ${dateCondition}
        `;
        return this.query(sql, queryParams);
    }

    static async getTopProducts(dateCondition, queryParams, limit) {
        let sql = `
            SELECT 
                p.id,
                p.name,
                p.price,
                SUM(s.quantity) as total_sold,
                SUM(s.total_price) as total_revenue
            FROM sales s
            JOIN product p ON s.product_id = p.id
        `;

        if (dateCondition) {
            sql += ` WHERE ${dateCondition}`;
        }

        sql += ` GROUP BY p.id, p.name, p.price ORDER BY total_sold DESC LIMIT ${limit}`;

        return this.query(sql, queryParams);
    }

    static async getCategoryBreakdown(dateCondition, queryParams) {
        const sql = `
            SELECT 
                pt.id,
                pt.type_name as category,
                SUM(s.total_price) as revenue,
                SUM(s.quantity) as total_quantity,
                COUNT(*) as order_count
            FROM sales s
            JOIN product p ON s.product_id = p.id
            JOIN product_types pt ON p.product_type = pt.id
            WHERE ${dateCondition}
            GROUP BY pt.id, pt.type_name
            ORDER BY revenue DESC
        `;
        return this.query(sql, queryParams);
    }

    static async getChangeData(condition) {
        const sql = `
            SELECT 
                SUM(s.total_price) as total_revenue,
                SUM(s.quantity) as total_quantity,
                AVG(s.total_price) as avg_order_value
            FROM sales s
            WHERE ${condition}
        `;
        return this.query(sql);
    }

    static async getWeeklyTotal(condition) {
        const sql = `SELECT SUM(s.total_price) as total FROM sales s WHERE ${condition}`;
        return this.query(sql);
    }

    static async getTypeBreakdown(dateCondition, queryParams) {
        const sql = `
            SELECT 
                s.sales_type,
                st.sales_name as name,
                COUNT(*) as order_count,
                SUM(s.total_price) as total_revenue
            FROM sales s
            LEFT JOIN sales_type st ON s.sales_type = st.id
            WHERE ${dateCondition}
            GROUP BY s.sales_type, st.sales_name
        `;
        return this.query(sql, queryParams);
    }
}

module.exports = SalesModel;
