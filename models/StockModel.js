const BaseModel = require('./BaseModel');

class StockModel extends BaseModel {
    // Ingredient Operations
    static async getAllIngredients() {
        const sql = `
            SELECT i.*, w.name as wholesaler_name 
            FROM ingredient i 
            LEFT JOIN wholesaler w ON i.wholesaler_id = w.id 
            ORDER BY i.name
        `;
        return this.query(sql);
    }

    static async getIngredientById(id) {
        const sql = `
            SELECT i.*, w.name as wholesaler_name 
            FROM ingredient i 
            LEFT JOIN wholesaler w ON i.wholesaler_id = w.id 
            WHERE i.id = ?
        `;
        return this.query(sql, [id]);
    }

    static async createIngredient(data) {
        const sql = "INSERT INTO ingredient (name, stock, unit, wholesaler_id, min_stock, unit_price, min_purch) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return this.query(sql, [
            data.name,
            data.stock || 0,
            data.unit,
            data.wholesaler_id || null,
            data.min_stock || 0,
            data.unit_price || 0,
            data.min_purch || 0
        ]);
    }

    static async updateIngredient(id, data) {
        const sql = "UPDATE ingredient SET name = ?, stock = ?, unit = ?, wholesaler_id = ?, min_stock = ?, unit_price = ?, min_purch = ? WHERE id = ?";
        return this.query(sql, [
            data.name,
            data.stock,
            data.unit,
            data.wholesaler_id || null,
            data.min_stock,
            data.unit_price,
            data.min_purch || 0,
            id
        ]);
    }

    static async deleteIngredient(id) {
        return this.query("DELETE FROM ingredient WHERE id = ?", [id]);
    }

    static async updateIngredientStock(id, quantity, connection) {
        const sql = "UPDATE ingredient SET stock = stock - ? WHERE id = ?";
        if (connection) return connection.execute(sql, [quantity, id]);
        return this.query(sql, [quantity, id]);
    }

    // Product Stock Operations
    static async getProductStocksForList() {
        const sql = `
            SELECT ps.*, p.name, p.process_type, w.name as wholesaler_name, 'ürün' as type
            FROM product_stock ps
            INNER JOIN product p ON ps.product_id = p.id
            LEFT JOIN wholesaler w ON ps.wholesaler_id = w.id
            WHERE p.process_type = 'al-sat'
            ORDER BY p.name
        `;
        return this.query(sql);
    }

    static async getProductStockById(id) {
        const sql = `
            SELECT ps.*, p.name, p.process_type, w.name as wholesaler_name
            FROM product_stock ps
            INNER JOIN product p ON ps.product_id = p.id
            LEFT JOIN wholesaler w ON ps.wholesaler_id = w.id
            WHERE ps.id = ?
        `;
        return this.query(sql, [id]);
    }

    static async updateProductStock(id, data) {
        const sql = "UPDATE product_stock SET stock = ?, min_stock = ?, wholesaler_id = ?, unit_price = ?, min_purch = ? WHERE id = ?";
        return this.query(sql, [
            data.stock || 0,
            data.min_stock || 0,
            data.wholesaler_id || null,
            data.unit_price || 0,
            data.min_purch || 0,
            id
        ]);
    }

    static async deleteProductStock(id) {
        return this.query("DELETE FROM product_stock WHERE id = ?", [id]);
    }

    static async decreaseProductStock(productId, quantity, connection) {
        const sql = "UPDATE product_stock SET stock = stock - ? WHERE product_id = ? AND stock >= ?";
        if (connection) return connection.execute(sql, [quantity, productId, quantity]);
        return this.query(sql, [quantity, productId, quantity]);
    }

    // Stats & Reports
    static async getLowStockIngredients() {
        const sql = `
           SELECT i.*, w.name as wholesaler_name, 'malzeme' as type
           FROM ingredient i 
           LEFT JOIN wholesaler w ON i.wholesaler_id = w.id 
           WHERE i.min_stock > 0
             AND i.stock <= i.min_stock
             AND i.stock > 0
             AND i.wholesaler_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1
               FROM purchase_order_items poi
               JOIN purchase_orders po ON poi.purchase_order_id = po.id
               WHERE poi.item_type = 1
                 AND poi.item_id = i.id
                 AND po.status IN (0,1,2)
             )
           ORDER BY (i.stock / NULLIF(i.min_stock, 0)) ASC
        `;
        return this.query(sql);
    }

    static async getLowStockProducts() {
        const sql = `
           SELECT ps.*, p.name, p.process_type, w.name as wholesaler_name, 'ürün' as type
           FROM product_stock ps
           INNER JOIN product p ON ps.product_id = p.id
           LEFT JOIN wholesaler w ON ps.wholesaler_id = w.id
           WHERE p.process_type = 'al-sat' 
             AND ps.min_stock > 0
             AND ps.stock <= ps.min_stock
             AND ps.stock > 0
             AND ps.wholesaler_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1
               FROM purchase_order_items poi
               JOIN purchase_orders po ON poi.purchase_order_id = po.id
               WHERE poi.item_type = 2
                 AND poi.item_id = ps.product_id
                 AND po.status IN (0,1,2)
             )
           ORDER BY (ps.stock / NULLIF(ps.min_stock, 0)) ASC
        `;
        return this.query(sql);
    }

    static async getIngredientStats() {
        const sql = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN stock > min_stock THEN 1 ELSE 0 END) as in_stock,
            SUM(CASE WHEN stock <= min_stock AND stock > 0 THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock
          FROM ingredient
        `;
        return this.query(sql);
    }

    static async getProductStockStats() {
        const sql = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN ps.stock > ps.min_stock THEN 1 ELSE 0 END) as in_stock,
            SUM(CASE WHEN ps.stock <= ps.min_stock AND ps.stock > 0 THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN ps.stock = 0 THEN 1 ELSE 0 END) as out_of_stock
          FROM product_stock ps
          INNER JOIN product p ON ps.product_id = p.id
          WHERE p.process_type = 'al-sat'
        `;
        return this.query(sql);
    }

    static async getTotalStockValue() {
        const ingValue = await this.query("SELECT SUM(stock * unit_price) as total_val FROM ingredient");
        const prodValue = await this.query("SELECT SUM(stock * unit_price) as total_val FROM product_stock");
        return (parseFloat(ingValue[0][0].total_val) || 0) + (parseFloat(prodValue[0][0].total_val) || 0);
    }

    static async getFastestSelling(dateFilter, params) {
        const sql = `
            SELECT p.name, SUM(s.quantity) as total_sold
            FROM sales s
            JOIN product p ON s.product_id = p.id
            WHERE 1=1 ${dateFilter}
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 1
        `;
        return this.query(sql, params);
    }

    static async getLastUpdate() {
        const sql = `
            SELECT GREATEST(
                 COALESCE((SELECT MAX(date) FROM sales), '2000-01-01'),
                 COALESCE((SELECT MAX(order_date) FROM purchase_orders), '2000-01-01'),
                 COALESCE((SELECT MAX(updated_at) FROM ingredient), '2000-01-01'),
                 COALESCE((SELECT MAX(updated_at) FROM product_stock), '2000-01-01')
            ) as last_update
        `;
        return this.query(sql);
    }

    static async getConsumption(dateFilter, params) {
        const sql = `
          SELECT 
            DATE(s.date) as date,
            SUM(
              CASE 
                WHEN p.process_type = 'al-sat' THEN 
                   s.quantity * COALESCE(ps.unit_price, 0)
                WHEN p.process_type = 'üretilen' THEN
                   s.quantity * (
                     SELECT COALESCE(SUM(r.quantity * i.unit_price), 0)
                     FROM receipt r
                     JOIN ingredient i ON r.ingredient_id = i.id
                     WHERE r.product_id = p.id
                   )
                ELSE 0 
              END
            ) as consumption_value
          FROM sales s
          JOIN product p ON s.product_id = p.id
          LEFT JOIN product_stock ps ON p.id = ps.product_id
          WHERE 1=1 ${dateFilter}
          GROUP BY DATE(s.date)
          ORDER BY date ASC
        `;
        return this.query(sql, params);
    }

    static async getCategoryValues() {
        const ingSql = "SELECT 'Hammaddeler' as category, SUM(stock * unit_price) as total_value FROM ingredient";
        const prodSql = `
            SELECT pt.type_name as category, SUM(ps.stock * ps.unit_price) as total_value
            FROM product_stock ps
            JOIN product p ON ps.product_id = p.id
            JOIN product_types pt ON p.product_type = pt.id
            WHERE p.process_type = 'al-sat'
            GROUP BY pt.type_name
         `;

        const [ingRows] = await this.query(ingSql);
        const [prodRows] = await this.query(prodSql);

        return [...ingRows, ...prodRows];
    }

    static async getIngredientDetails() {
        const sql = `
            SELECT 
               i.id, i.name, 
               'Hammaddeler' as category,
               i.stock, i.min_stock, i.unit,
               'ingredient' as type,
               (CASE 
                  WHEN i.stock <= 0 THEN 'danger'
                  WHEN i.stock <= i.min_stock THEN 'warning' 
                  ELSE 'success' 
                END) as status_code,
               (SELECT MAX(po.order_date) 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON poi.purchase_order_id = po.id 
                WHERE poi.item_type = 1 AND poi.item_id = i.id AND po.status = 3
               ) as last_entry_date,
               (SELECT MAX(s.date) 
                FROM sales s 
                JOIN receipt r ON s.product_id = r.product_id 
                WHERE r.ingredient_id = i.id
               ) as last_exit_date
            FROM ingredient i
         `;
        return this.query(sql);
    }

    static async getProductStockDetails() {
        const sql = `
            SELECT 
               p.id, p.name, 
               pt.type_name as category,
               ps.stock, ps.min_stock, 'adet' as unit,
               'product' as type,
               (CASE 
                  WHEN ps.stock <= 0 THEN 'danger'
                  WHEN ps.stock <= ps.min_stock THEN 'warning' 
                  ELSE 'success' 
                END) as status_code,
               (SELECT MAX(po.order_date) 
                FROM purchase_order_items poi 
                JOIN purchase_orders po ON poi.purchase_order_id = po.id 
                WHERE poi.item_type = 2 AND poi.item_id = ps.product_id AND po.status = 3
               ) as last_entry_date,
               (SELECT MAX(s.date) 
                FROM sales s 
                WHERE s.product_id = p.id
               ) as last_exit_date
            FROM product_stock ps
            JOIN product p ON ps.product_id = p.id
            JOIN product_types pt ON p.product_type = pt.id
            WHERE p.process_type = 'al-sat'
         `;
        return this.query(sql);
    }

    static async getWholesalers() {
        return this.query("SELECT * FROM wholesaler ORDER BY name");
    }

    static async getStockHistory(itemType, itemId) {
        const sql = `
           SELECT 
              po.order_date,
              po.id as order_id,
              po.status,
              w.name as wholesaler_name,
              poi.quantity,
              poi.unit_price,
              poi.total_price
           FROM purchase_order_items poi
           JOIN purchase_orders po ON poi.purchase_order_id = po.id
           LEFT JOIN wholesaler w ON po.wholesaler_id = w.id
           WHERE poi.item_type = ? AND poi.item_id = ?
           ORDER BY po.order_date DESC
        `;
        return this.query(sql, [itemType, itemId]);
    }

    static async getRecentShipments() {
        const sql = `
          SELECT 
            status,
            COUNT(*) as count
          FROM purchase_orders
          WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY status
        `;
        return this.query(sql);
    }
}

module.exports = StockModel;
