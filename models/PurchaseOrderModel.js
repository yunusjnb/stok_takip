const BaseModel = require('./BaseModel');

class PurchaseOrderModel extends BaseModel {
    static async findAll() {
        const sql = `
            SELECT po.*, w.name as wholesaler_name,
                   (SELECT COUNT(*) 
                    FROM purchase_order_items poi 
                    WHERE poi.purchase_order_id = po.id) as item_count
            FROM purchase_orders po
            LEFT JOIN wholesaler w ON po.wholesaler_id = w.id
            ORDER BY po.order_date DESC
        `;
        return this.query(sql);
    }

    static async findById(id) {
        const sql = `
            SELECT po.*, w.name as wholesaler_name, w.phone as wholesaler_phone, w.address as wholesaler_address
            FROM purchase_orders po
            LEFT JOIN wholesaler w ON po.wholesaler_id = w.id
            WHERE po.id = ?
        `;
        return this.query(sql, [id]);
    }

    static async getItems(orderId) {
        const sql = `
            SELECT poi.*,
                    CASE 
                      WHEN poi.item_type = 1 THEN i.name 
                      WHEN poi.item_type = 2 THEN p.name 
                      ELSE NULL 
                    END AS item_name,
                    CASE 
                      WHEN poi.item_type = 1 THEN i.unit 
                      WHEN poi.item_type = 2 THEN 'adet'
                      ELSE NULL 
                    END AS item_unit
             FROM purchase_order_items poi
             LEFT JOIN ingredient i ON poi.item_type = 1 AND poi.item_id = i.id
             LEFT JOIN product p ON poi.item_type = 2 AND poi.item_id = p.id
             WHERE poi.purchase_order_id = ?
             ORDER BY poi.id
        `;
        return this.query(sql, [orderId]);
    }

    static async getItemById(itemId, orderId, connection) {
        const sql = "SELECT unit_price FROM purchase_order_items WHERE id = ? AND purchase_order_id = ?";
        return (connection || this).execute(sql, [itemId, orderId]);
    }

    static async updateItem(id, orderId, quantity, totalPrice, connection) {
        const sql = "UPDATE purchase_order_items SET quantity = ?, total_price = ? WHERE id = ? AND purchase_order_id = ?";
        return (connection || this).execute(sql, [quantity, totalPrice, id, orderId]);
    }

    static async updateOrderTotal(id, totalAmount, connection) {
        const sql = "UPDATE purchase_orders SET total_amount = ? WHERE id = ?";
        return (connection || this).execute(sql, [totalAmount, id]);
    }

    static async calculateOrderTotal(id, connection) {
        const sql = "SELECT SUM(total_price) as total_amount FROM purchase_order_items WHERE purchase_order_id = ?";
        return (connection || this).execute(sql, [id]);
    }

    static async updateStatus(id, status, connection) {
        const sql = "UPDATE purchase_orders SET status = ? WHERE id = ?";
        return (connection || this).execute(sql, [status, id]);
    }

    // Auto-create logic helpers
    static async getLowStockIngredients(connection) {
        const sql = `
           SELECT i.id, i.name, i.stock, i.min_stock, i.min_purch, i.unit_price, 
                  i.wholesaler_id, w.name as wholesaler_name
           FROM ingredient i
           LEFT JOIN wholesaler w ON i.wholesaler_id = w.id
           WHERE i.min_stock > 0
             AND i.stock <= i.min_stock
             AND i.wholesaler_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1
               FROM purchase_order_items poi
               JOIN purchase_orders po ON poi.purchase_order_id = po.id
               WHERE poi.item_type = 1
                 AND poi.item_id = i.id
                 AND po.status IN (0,1,2)
             )
        `;
        return (connection || this).execute(sql);
    }

    static async getLowStockProductStocks(connection) {
        const sql = `
           SELECT ps.product_id, ps.stock, ps.min_stock, ps.min_purch, ps.unit_price, 
                  ps.wholesaler_id, w.name as wholesaler_name, p.name
           FROM product_stock ps
           INNER JOIN product p ON ps.product_id = p.id
           LEFT JOIN wholesaler w ON ps.wholesaler_id = w.id
           WHERE p.process_type = 'al-sat' 
             AND ps.min_stock > 0
             AND ps.stock <= ps.min_stock
             AND ps.wholesaler_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1
               FROM purchase_order_items poi
               JOIN purchase_orders po ON poi.purchase_order_id = po.id
               WHERE poi.item_type = 2
                 AND poi.item_id = ps.product_id
                 AND po.status IN (0,1,2)
             )
         `;
        return (connection || this).execute(sql);
    }

    static async createOrder(wholesalerId, status, totalAmount, connection) {
        const sql = "INSERT INTO purchase_orders (wholesaler_id, status, total_amount) VALUES (?, ?, ?)";
        return (connection || this).execute(sql, [wholesalerId, status, totalAmount]);
    }

    static async createOrderItem(orderId, itemType, itemId, quantity, unitPrice, totalPrice, connection) {
        const sql = "INSERT INTO purchase_order_items (purchase_order_id, item_type, item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)";
        return (connection || this).execute(sql, [orderId, itemType, itemId, quantity, unitPrice, totalPrice]);
    }
}

module.exports = PurchaseOrderModel;
