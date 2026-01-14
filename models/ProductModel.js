const BaseModel = require('./BaseModel');

class ProductModel extends BaseModel {
    static async findAll() {
        const sql = `
            SELECT p.*, pt.type_name, 
                   ps.stock, ps.min_stock, ps.wholesaler_id, ps.unit_price as stock_unit_price, ps.min_purch,
                   (
                     SELECT MIN(FLOOR(i.stock / r.quantity))
                     FROM receipt r
                     JOIN ingredient i ON r.ingredient_id = i.id
                     WHERE r.product_id = p.id
                   ) as recipe_stock
            FROM product p 
            LEFT JOIN product_types pt ON p.product_type = pt.id 
            LEFT JOIN product_stock ps ON p.id = ps.product_id
            ORDER BY p.name
        `;
        return this.query(sql);
    }

    static async findById(id) {
        const sql = `
            SELECT p.*, pt.type_name, 
                   ps.stock, ps.min_stock, ps.wholesaler_id, ps.unit_price as stock_unit_price, ps.min_purch
            FROM product p 
            LEFT JOIN product_types pt ON p.product_type = pt.id 
            LEFT JOIN product_stock ps ON p.id = ps.product_id
            WHERE p.id = ?
        `;
        return this.query(sql, [id]);
    }

    static async findRecipeByProductId(productId) {
        const sql = `
            SELECT r.*, i.name as ingredient_name, i.unit, i.stock, i.unit_price 
            FROM receipt r 
            JOIN ingredient i ON r.ingredient_id = i.id 
            WHERE r.product_id = ?
        `;
        return this.query(sql, [productId]);
    }

    static async create(productData, connection) {
        const sql = "INSERT INTO product (name, price, process_type, product_type, image) VALUES (?, ?, ?, ?, ?)";
        const params = [
            productData.name,
            productData.price,
            productData.process_type,
            productData.product_type,
            productData.image
        ];

        if (connection) {
            return connection.execute(sql, params);
        }
        return this.query(sql, params);
    }

    static async update(id, productData, connection) {
        let sql = "UPDATE product SET name = ?, price = ?, process_type = ?, product_type = ?";
        let params = [
            productData.name,
            productData.price,
            productData.process_type,
            productData.product_type
        ];

        if (productData.image !== undefined) {
            sql += ", image = ?";
            params.push(productData.image);
        }

        sql += " WHERE id = ?";
        params.push(id);

        if (connection) {
            return connection.execute(sql, params);
        }
        return this.query(sql, params);
    }

    static async delete(id) {
        return this.query("DELETE FROM product WHERE id = ?", [id]);
    }

    // Receipt Operations
    static async addReceiptItem(connection, productId, ingredientId, quantity) {
        const sql = "INSERT INTO receipt (product_id, ingredient_id, quantity) VALUES (?, ?, ?)";
        return connection.execute(sql, [productId, ingredientId, quantity]);
    }

    static async deleteReceipt(connection, productId) {
        return connection.execute("DELETE FROM receipt WHERE product_id = ?", [productId]);
    }

    // Product Stock Operations (Al-Sat)
    static async addProductStock(connection, data) {
        const sql = "INSERT INTO product_stock (product_id, stock, min_stock, wholesaler_id, unit_price, min_purch) VALUES (?, ?, ?, ?, ?, ?)";
        return connection.execute(sql, [
            data.product_id,
            data.stock,
            data.min_stock,
            data.wholesaler_id,
            data.unit_price,
            data.min_purch
        ]);
    }

    static async updateProductStock(connection, data) {
        const sql = "UPDATE product_stock SET stock = ?, min_stock = ?, wholesaler_id = ?, unit_price = ?, min_purch = ? WHERE product_id = ?";
        return connection.execute(sql, [
            data.stock,
            data.min_stock,
            data.wholesaler_id,
            data.unit_price,
            data.min_purch,
            data.product_id
        ]);
    }

    static async deleteProductStock(connection, productId) {
        return connection.execute("DELETE FROM product_stock WHERE product_id = ?", [productId]);
    }

    static async findProductStock(connection, productId) {
        return connection.execute("SELECT id FROM product_stock WHERE product_id = ?", [productId]);
    }

    static async getTypes() {
        return this.query("SELECT id, type_name FROM product_types ORDER BY type_name");
    }
}

module.exports = ProductModel;
