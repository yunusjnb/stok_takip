const PurchaseOrderModel = require('../models/PurchaseOrderModel');
const StockModel = require('../models/StockModel');

class PurchaseOrderController {

    static mapStatus(row) {
        const statusMap = {
            0: { label: "Taslak", code: 0 },
            1: { label: "Sipariş Verildi", code: 1 },
            2: { label: "Sevkiyatta", code: 2 },
            3: { label: "Teslim Alındı", code: 3 },
            4: { label: "İptal", code: 4 },
        };
        const info = statusMap[row.status] || { label: "Bilinmiyor", code: row.status };
        return { ...row, status_label: info.label, status_code: info.code };
    }

    static async getAllOrders(req, res) {
        try {
            const [rows] = await PurchaseOrderModel.findAll();
            const mapped = rows.map(PurchaseOrderController.mapStatus);
            res.json(mapped);
        } catch (error) {
            console.error("Get purchase orders error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const [orderRows] = await PurchaseOrderModel.findById(id);

            if (orderRows.length === 0) {
                return res.status(404).json({ error: "Sipariş bulunamadı" });
            }

            const [itemRows] = await PurchaseOrderModel.getItems(id);
            const order = PurchaseOrderController.mapStatus(orderRows[0]);

            res.json({ order, items: itemRows });
        } catch (error) {
            console.error("Get purchase order detail error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateItems(req, res) {
        const connection = await PurchaseOrderModel.getConnection();
        try {
            const { id } = req.params;
            const { items } = req.body || {};

            if (!Array.isArray(items) || items.length === 0) {
                connection.release();
                return res.status(400).json({ error: "Güncellenecek kalem listesi bulunamadı" });
            }

            await connection.beginTransaction();

            for (const item of items) {
                const qty = parseFloat(item.quantity);
                if (!item.id || Number.isNaN(qty) || qty < 0) continue;

                const [rows] = await PurchaseOrderModel.getItemById(item.id, id, connection);
                if (!rows || rows.length === 0) continue;

                const unitPrice = parseFloat(rows[0].unit_price) || 0;
                const totalPrice = qty * unitPrice;

                await PurchaseOrderModel.updateItem(item.id, id, qty, totalPrice, connection);
            }

            const [sumRows] = await PurchaseOrderModel.calculateOrderTotal(id, connection);
            const totalAmount = parseFloat(sumRows[0]?.total_amount || 0);

            await PurchaseOrderModel.updateOrderTotal(id, totalAmount, connection);

            await connection.commit();
            connection.release();

            res.json({ success: true, total_amount: totalAmount });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error("Update purchase order items error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async approveOrder(req, res) {
        const connection = await PurchaseOrderModel.getConnection();
        try {
            const { id } = req.params;
            await connection.beginTransaction();

            const [orderRows] = await PurchaseOrderModel.findById(id);
            if (!orderRows || orderRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: "Sipariş bulunamadı" });
            }

            const order = orderRows[0];
            if (order.status === 3) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: "Bu sipariş zaten teslim alındı olarak işaretlenmiş" });
            }

            const [items] = await PurchaseOrderModel.getItems(id);

            for (const item of items) {
                const qty = parseFloat(item.quantity || 0);
                if (qty <= 0) continue;

                if (item.item_type === 1) { // Malzeme
                    await StockModel.updateIngredientStock(item.item_id, -qty, connection); // Negative qty to add stock (since updateIngredientStock does stock = stock - ?) No wait, typically 'updateIngredientStock' subtracts. I should add a method to ADD stock or pass negative to subtract.
                    // My previous StockModel.updateIngredientStock does: "UPDATE ingredient SET stock = stock - ?". So passing -qty ADDS stock. Correct.
                } else if (item.item_type === 2) { // Product
                    await StockModel.decreaseProductStock(item.item_id, -qty, connection); // Same logic
                }
            }

            await PurchaseOrderModel.updateStatus(id, 3, connection);

            await connection.commit();
            connection.release();

            res.json({ success: true, message: "Sipariş onaylandı ve stoklar güncellendi" });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error("Approve purchase order error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createAutoOrders(req, res) {
        const connection = await PurchaseOrderModel.getConnection();
        try {
            await connection.beginTransaction();

            const [lowIngredients] = await PurchaseOrderModel.getLowStockIngredients(connection);
            const [lowProductStocks] = await PurchaseOrderModel.getLowStockProductStocks(connection);

            const groups = new Map();

            function addItem(wholesaler_id, wholesaler_name, item) {
                if (!groups.has(wholesaler_id)) {
                    groups.set(wholesaler_id, {
                        wholesaler_id,
                        wholesaler_name,
                        items: [],
                    });
                }
                groups.get(wholesaler_id).items.push(item);
            }

            function calcQuantity(stock, minStock, minPurch) {
                const s = parseFloat(stock) || 0;
                const ms = parseFloat(minStock) || 0;
                const mp = parseFloat(minPurch) || 0;
                let deficit = ms - s;
                if (deficit < 0) deficit = 0;
                let qty = deficit || mp || 0;
                if (qty <= 0) return 0;
                if (mp > 0) qty = Math.max(mp, Math.ceil(qty / mp) * mp);
                return qty;
            }

            for (const ing of lowIngredients) {
                const qty = calcQuantity(ing.stock, ing.min_stock, ing.min_purch);
                if (qty <= 0) continue;
                const unitPrice = parseFloat(ing.unit_price) || 0;
                addItem(ing.wholesaler_id, ing.wholesaler_name, {
                    item_type: 1,
                    item_id: ing.id,
                    quantity: qty,
                    unit_price: unitPrice,
                    total_price: qty * unitPrice,
                    name: ing.name,
                });
            }

            for (const ps of lowProductStocks) {
                const qty = calcQuantity(ps.stock, ps.min_stock, ps.min_purch);
                if (qty <= 0) continue;
                const unitPrice = parseFloat(ps.unit_price) || 0;
                addItem(ps.wholesaler_id, ps.wholesaler_name, {
                    item_type: 2,
                    item_id: ps.product_id,
                    quantity: qty,
                    unit_price: unitPrice,
                    total_price: qty * unitPrice,
                    name: ps.name,
                });
            }

            if (groups.size === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: "Düşük stoklu ve tedarikçisi tanımlı ürün bulunamadı" });
            }

            const createdOrders = [];

            for (const group of groups.values()) {
                if (!group.items || group.items.length === 0) continue;

                const [poResult] = await PurchaseOrderModel.createOrder(group.wholesaler_id, 1, 0, connection);
                const orderId = poResult.insertId;

                let totalAmount = 0;
                for (const item of group.items) {
                    await PurchaseOrderModel.createOrderItem(orderId, item.item_type, item.item_id, item.quantity, item.unit_price, item.total_price, connection);
                    totalAmount += item.total_price;
                }

                await PurchaseOrderModel.updateOrderTotal(orderId, totalAmount, connection);

                createdOrders.push({
                    id: orderId,
                    wholesaler_id: group.wholesaler_id,
                    wholesaler_name: group.wholesaler_name,
                    total_amount: totalAmount,
                    item_count: group.items.length,
                });
            }

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                created_count: createdOrders.length,
                orders: createdOrders,
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error("Auto create purchase orders error:", error);
            res.status(500).json({ error: "Sevkiyat oluşturulurken sunucu hatası" });
        }
    }
}

module.exports = PurchaseOrderController;
