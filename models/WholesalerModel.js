const BaseModel = require('./BaseModel');

class WholesalerModel extends BaseModel {
    static async findAll() {
        const sql = `
            SELECT w.*, 
                   COUNT(DISTINCT i.id) as ingredient_count,
                   COUNT(DISTINCT ps.id) as product_count
            FROM wholesaler w
            LEFT JOIN ingredient i ON w.id = i.wholesaler_id
            LEFT JOIN product_stock ps ON w.id = ps.wholesaler_id
            GROUP BY w.id
            ORDER BY w.name
        `;
        return this.query(sql);
    }

    static async findById(id) {
        const sql = `
            SELECT w.*, 
                   COUNT(DISTINCT i.id) as ingredient_count,
                   COUNT(DISTINCT ps.id) as product_count
            FROM wholesaler w
            LEFT JOIN ingredient i ON w.id = i.wholesaler_id
            LEFT JOIN product_stock ps ON w.id = ps.wholesaler_id
            WHERE w.id = ?
            GROUP BY w.id
        `;
        return this.query(sql, [id]);
    }

    static async create(data) {
        const sql = "INSERT INTO wholesaler (name, phone, address, active) VALUES (?, ?, ?, ?)";
        return this.query(sql, [
            data.name,
            data.phone || null,
            data.address || null,
            data.active !== undefined ? (data.active ? 1 : 0) : 1
        ]);
    }

    static async update(id, data) {
        let sql = "UPDATE wholesaler SET name = ?, phone = ?, address = ?";
        let params = [data.name, data.phone || null, data.address || null];

        if (data.active !== undefined) {
            sql += ", active = ?";
            params.push(data.active ? 1 : 0);
        }

        sql += " WHERE id = ?";
        params.push(id);

        return this.query(sql, params);
    }

    static async delete(id) {
        return this.query("DELETE FROM wholesaler WHERE id = ?", [id]);
    }

    static async checkUsage(id) {
        const sqlIngredient = "SELECT COUNT(*) as count FROM ingredient WHERE wholesaler_id = ?";
        const sqlProduct = "SELECT COUNT(*) as count FROM product_stock WHERE wholesaler_id = ?";

        const [ingRows] = await this.query(sqlIngredient, [id]);
        const [prodRows] = await this.query(sqlProduct, [id]);

        return (ingRows[0].count > 0 || prodRows[0].count > 0);
    }
}

module.exports = WholesalerModel;
