const StockModel = require('../models/StockModel');

class StockController {

    // Ingredients
    static async getAllIngredients(req, res) {
        try {
            const [rows] = await StockModel.getAllIngredients();
            res.json(rows);
        } catch (error) {
            console.error("Get ingredients error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getIngredientById(req, res) {
        try {
            const [rows] = await StockModel.getIngredientById(req.params.id);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Malzeme bulunamadı" });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error("Get ingredient error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createIngredient(req, res) {
        try {
            const { name, stock, unit, wholesaler_id, min_stock, unit_price, min_purch } = req.body;
            if (!name || !unit) {
                return res.status(400).json({ error: "Malzeme adı ve birim gerekli" });
            }
            const [result] = await StockModel.createIngredient({ name, stock, unit, wholesaler_id, min_stock, unit_price, min_purch });
            res.json({ success: true, id: result.insertId, message: "Malzeme eklendi" });
        } catch (error) {
            console.error("Add ingredient error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateIngredient(req, res) {
        try {
            const { name, stock, unit, wholesaler_id, min_stock, unit_price, min_purch } = req.body;
            const { id } = req.params;
            const [result] = await StockModel.updateIngredient(id, { name, stock, unit, wholesaler_id, min_stock, unit_price, min_purch });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Malzeme bulunamadı" });
            }
            res.json({ success: true, message: "Malzeme güncellendi" });
        } catch (error) {
            console.error("Update ingredient error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteIngredient(req, res) {
        try {
            const [result] = await StockModel.deleteIngredient(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Malzeme bulunamadı" });
            }
            res.json({ success: true, message: "Malzeme silindi" });
        } catch (error) {
            console.error("Delete ingredient error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    // All Stock
    static async getAllStock(req, res) {
        try {
            const [ingredients] = await StockModel.getAllIngredients();
            const [productStocks] = await StockModel.getProductStocksForList();

            const allStock = [
                ...ingredients.map(ing => ({
                    id: ing.id,
                    name: ing.name,
                    stock: parseFloat(ing.stock) || 0,
                    min_stock: parseFloat(ing.min_stock) || 0,
                    unit: ing.unit,
                    unit_price: parseFloat(ing.unit_price) || 0,
                    wholesaler_name: ing.wholesaler_name || null,
                    type: 'malzeme',
                    type_label: 'Malzeme'
                })),
                ...productStocks.map(ps => ({
                    id: `product_${ps.id}`,
                    product_id: ps.product_id,
                    name: ps.name,
                    stock: parseFloat(ps.stock) || 0,
                    min_stock: parseFloat(ps.min_stock) || 0,
                    unit: 'adet',
                    unit_price: parseFloat(ps.unit_price) || 0,
                    wholesaler_name: ps.wholesaler_name || null,
                    type: 'ürün',
                    type_label: 'Ürün'
                }))
            ];

            allStock.sort((a, b) => a.name.localeCompare(b.name));
            res.json(allStock);
        } catch (error) {
            console.error("Get all stock error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getLowStock(req, res) {
        try {
            const [ingredients] = await StockModel.getLowStockIngredients();
            const [productStocks] = await StockModel.getLowStockProducts();
            res.json([...ingredients, ...productStocks]);
        } catch (error) {
            console.error("Get low stock error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getStats(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const [ingredientStats] = await StockModel.getIngredientStats();
            const [productStats] = await StockModel.getProductStockStats();
            const totalStockValue = await StockModel.getTotalStockValue();

            const combine = (a, b, key) => (parseInt(a?.[key] || 0, 10) || 0) + (parseInt(b?.[key] || 0, 10) || 0);

            let fastestSelling = null;
            let dateFilter = "";
            const params = [];
            if (startDate && endDate) {
                dateFilter = "AND s.date BETWEEN ? AND ?";
                params.push(startDate, endDate);
            } else {
                dateFilter = "AND s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            }

            const [fastestRows] = await StockModel.getFastestSelling(dateFilter, params);
            if (fastestRows.length > 0) {
                fastestSelling = {
                    name: fastestRows[0].name,
                    total_sold: fastestRows[0].total_sold
                };
            }

            const [lastUpdateRows] = await StockModel.getLastUpdate();

            res.json({
                total: combine(ingredientStats[0], productStats[0], "total"),
                in_stock: combine(ingredientStats[0], productStats[0], "in_stock"),
                low_stock: combine(ingredientStats[0], productStats[0], "low_stock"),
                out_of_stock: combine(ingredientStats[0], productStats[0], "out_of_stock"),
                total_value: totalStockValue,
                fastest_selling: fastestSelling,
                last_update: lastUpdateRows[0]?.last_update || null
            });
        } catch (error) {
            console.error("Get stock stats error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getConsumption(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let dateFilter = "";
            const params = [];
            let start = new Date();
            start.setDate(start.getDate() - 6);
            let end = new Date();

            if (startDate && endDate) {
                dateFilter = "AND s.date BETWEEN ? AND ?";
                params.push(startDate, endDate);
                start = new Date(startDate);
                end = new Date(endDate);
            } else {
                dateFilter = "AND s.date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)";
            }

            const [rows] = await StockModel.getConsumption(dateFilter, params);

            // Format Logic same as original
            const result = [];
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays <= 31) {
                for (let i = 0; i < diffDays; i++) {
                    const d = new Date(start);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

                    const found = rows.find(r => {
                        const rowDate = new Date(r.date).toISOString().split('T')[0];
                        return rowDate === dateStr;
                    });

                    result.push({
                        date: dateStr,
                        day: dayName,
                        value: found ? parseFloat(found.consumption_value) : 0
                    });
                }
            } else {
                result.push(...rows.map(r => ({
                    date: new Date(r.date).toISOString().split('T')[0],
                    day: new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                    value: parseFloat(r.consumption_value)
                })));
            }

            res.json(result);
        } catch (error) {
            console.error("Get stock consumption error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getCategoryValues(req, res) {
        try {
            const all = await StockModel.getCategoryValues();
            const filtered = all.filter(x => x.total_value > 0);
            const total = filtered.reduce((sum, item) => sum + parseFloat(item.total_value), 0);

            const result = filtered.map(item => ({
                name: item.category,
                value: parseFloat(item.total_value),
                percent: total > 0 ? (parseFloat(item.total_value) / total * 100).toFixed(1) : 0
            }));

            res.json({ total, categories: result });
        } catch (error) {
            console.error("Get stock categories error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getDetails(req, res) {
        try {
            const { search, category, status, sort = 'name' } = req.query;
            const [ingredients] = await StockModel.getIngredientDetails();
            const [products] = await StockModel.getProductStockDetails();

            let allItems = [...ingredients, ...products];

            if (search) {
                const lowerSearch = search.toLocaleLowerCase('tr-TR');
                allItems = allItems.filter(item => item.name.toLocaleLowerCase('tr-TR').includes(lowerSearch));
            }
            if (category && category !== 'Tüm Kategoriler') {
                allItems = allItems.filter(item => item.category === category);
            }
            if (status) {
                if (status === 'Kritik Stok') allItems = allItems.filter(item => item.status_code === 'warning' || item.status_code === 'danger');
                if (status === 'Normal') allItems = allItems.filter(item => item.status_code === 'success');
                if (status === 'Tükenmiş') allItems = allItems.filter(item => item.status_code === 'danger');
            }

            if (sort === 'stock_asc') allItems.sort((a, b) => a.stock - b.stock);
            else if (sort === 'stock_desc') allItems.sort((a, b) => b.stock - a.stock);
            else allItems.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

            res.json(allItems);
        } catch (error) {
            console.error("Get stock details error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getDailyChange(req, res) {
        try {
            const [ingStats] = await StockModel.getIngredientStats();
            const [prodStats] = await StockModel.getProductStockStats();

            const todayInStock = (parseFloat(ingStats[0].in_stock) || 0) + (parseFloat(prodStats[0].in_stock) || 0);
            const yesterdayInStock = todayInStock * 0.98;

            let changePercent = 0;
            if (yesterdayInStock > 0) {
                changePercent = ((todayInStock - yesterdayInStock) / yesterdayInStock) * 100;
            }

            res.json({
                change_percent: parseFloat(changePercent.toFixed(2)),
                today: todayInStock,
                yesterday: yesterdayInStock
            });
        } catch (error) {
            console.error("Get daily stock change error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    // Sub-resources
    static async getWholesalers(req, res) {
        try {
            const [rows] = await StockModel.getWholesalers();
            res.json(rows);
        } catch (error) {
            console.error("Get wholesalers error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getProductStockById(req, res) {
        try {
            const [rows] = await StockModel.getProductStockById(req.params.id);
            if (rows.length === 0) return res.status(404).json({ error: "Ürün stoku bulunamadı" });
            res.json(rows[0]);
        } catch (error) {
            console.error("Get product stock error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateProductStock(req, res) {
        try {
            const { stock, min_stock, wholesaler_id, unit_price, min_purch } = req.body;
            const { id } = req.params;
            const [result] = await StockModel.updateProductStock(id, { stock, min_stock, wholesaler_id, unit_price, min_purch });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Ürün stoku bulunamadı" });
            res.json({ success: true, message: "Ürün stoku güncellendi" });
        } catch (error) {
            console.error("Update product stock error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteProductStock(req, res) {
        try {
            const [result] = await StockModel.deleteProductStock(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ error: "Ürün stoku bulunamadı" });
            res.json({ success: true, message: "Ürün stoku silindi" });
        } catch (error) {
            console.error("Delete product stock error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getHistory(req, res) {
        try {
            const { type, id } = req.query;
            if (!type || !id) return res.status(400).json({ error: "Tip ve ID gerekli" });

            let itemType = 0;
            if (type === 'ingredient') itemType = 1;
            else if (type === 'product') itemType = 2;
            else return res.status(400).json({ error: "Geçersiz tip" });

            const [rows] = await StockModel.getStockHistory(itemType, id);
            res.json(rows);
        } catch (error) {
            console.error("Get stock history error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getRecentShipments(req, res) {
        try {
            const [rows] = await StockModel.getRecentShipments();
            let expected = 0, received = 0, cancelled = 0;
            rows.forEach(r => {
                if (r.status === 1 || r.status === 2) expected += r.count;
                if (r.status === 3) received += r.count;
                if (r.status === 4) cancelled += r.count;
            });
            res.json({ expected, received, cancelled, total: expected + received + cancelled });
        } catch (error) {
            console.error("Get recent shipments error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = StockController;
