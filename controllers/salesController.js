const SalesModel = require('../models/SalesModel');
const ProductModel = require('../models/ProductModel');
const StockModel = require('../models/StockModel');

class SalesController {
    static async createSale(req, res) {
        try {
            const { product_id, quantity, total_price, income, payment_type, sales_type } = req.body;

            if (!product_id || !quantity || !total_price) {
                return res.status(400).json({ error: "Ürün ID, miktar ve toplam fiyat gerekli" });
            }

            const defaultPaymentType = payment_type === 'Kart' ? 'Kart' : 'Nakit';
            const defaultSalesType = sales_type || 1;

            // Get Product Details
            const [productRows] = await ProductModel.findById(product_id);

            let calculatedIncome = 0;
            let totalCost = 0;

            if (productRows.length > 0) {
                const processType = productRows[0].process_type;

                if (processType === "üretilen") {
                    const [recipe] = await ProductModel.findRecipeByProductId(product_id);
                    for (const item of recipe) {
                        const ingredientCost = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                        totalCost += ingredientCost * quantity;
                    }
                    calculatedIncome = parseFloat(total_price) - totalCost;
                } else if (processType === "al-sat") {
                    const unitPrice = parseFloat(productRows[0].unit_price) || 0;
                    totalCost = unitPrice * quantity;
                    calculatedIncome = parseFloat(total_price) - totalCost;
                }

                if (calculatedIncome < 0) calculatedIncome = 0;
            } else {
                calculatedIncome = income || 0;
            }

            const connection = await SalesModel.getConnection();
            await connection.beginTransaction();

            try {
                const [result] = await SalesModel.create({
                    product_id, quantity, total_price,
                    income: calculatedIncome,
                    payment_type: defaultPaymentType,
                    sales_type: defaultSalesType
                }, connection);

                // Stock Reduction Logic
                if (productRows.length > 0) {
                    const processType = productRows[0].process_type;

                    if (processType === "üretilen") {
                        const [recipe] = await ProductModel.findRecipeByProductId(product_id);
                        for (const item of recipe) {
                            const usedQuantity = item.quantity * quantity;
                            await StockModel.updateIngredientStock(item.ingredient_id, usedQuantity, connection);
                        }
                    } else if (processType === "al-sat") {
                        await StockModel.decreaseProductStock(product_id, quantity, connection);
                    }
                }

                await connection.commit();
                connection.release();

                res.json({ success: true, id: result.insertId, message: "Satış eklendi" });

            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }

        } catch (error) {
            console.error("Add sale error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getDailySales(req, res) {
        try {
            const { date } = req.query;
            const targetDate = date || new Date().toISOString().split("T")[0];
            const [rows] = await SalesModel.getDailySales(targetDate);
            res.json(rows);
        } catch (error) {
            console.error("Get daily sales error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getWeeklySales(req, res) {
        try {
            const [rows] = await SalesModel.getWeeklySales();
            res.json(rows);
        } catch (error) {
            console.error("Get weekly sales error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getMonthlySales(req, res) {
        try {
            const [rows] = await SalesModel.getMonthlySales();
            res.json(rows);
        } catch (error) {
            console.error("Get monthly sales error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getTrend(req, res) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ error: "Başlangıç ve bitiş tarihi gereklidir." });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let grouping = diffDays > 60 ? 'month' : 'day';

            const [rows] = await SalesModel.getTrend(startDate, endDate, grouping);
            res.json(rows);
        } catch (error) {
            console.error("Get trend sales error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getStats(req, res) {
        try {
            const { period = "today", startDate, endDate } = req.query;
            let dateCondition = "";
            let queryParams = [];

            if (startDate && endDate) {
                dateCondition = "DATE(s.date) >= ? AND DATE(s.date) <= ?";
                queryParams.push(startDate, endDate);
            } else if (period === "today") {
                dateCondition = "DATE(s.date) = CURDATE()";
            } else if (period === "week") {
                dateCondition = "YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)";
            } else if (period === "month") {
                dateCondition = "YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE())";
            } else {
                dateCondition = "DATE(s.date) = CURDATE()";
            }

            const [stats] = await SalesModel.getStats(dateCondition, queryParams);

            res.json(stats[0] || { total_revenue: 0, total_quantity: 0, total_orders: 0, avg_order_value: 0 });
        } catch (error) {
            console.error("Get sales stats error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getTopProducts(req, res) {
        try {
            const { period = "today", limit = 10, startDate, endDate } = req.query;

            let dateCondition = "";
            let queryParams = [];

            if (startDate && endDate) {
                dateCondition = "DATE(s.date) >= ? AND DATE(s.date) <= ?";
                queryParams.push(startDate, endDate);
            } else if (period === "today") {
                dateCondition = "DATE(s.date) = CURDATE()";
            } else if (period === "week") {
                dateCondition = "YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)";
            } else if (period === "month") {
                dateCondition = "YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE())";
            } else {
                dateCondition = "DATE(s.date) = CURDATE()";
            }

            const limitValue = parseInt(limit) || 10;
            if (isNaN(limitValue) || limitValue <= 0) return res.status(400).json({ error: "Geçersiz limit değeri" });

            const [rows] = await SalesModel.getTopProducts(dateCondition, queryParams, limitValue);
            res.json(rows);
        } catch (error) {
            console.error("Get top products error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getCategoryBreakdown(req, res) {
        try {
            const { period = "today", startDate, endDate } = req.query;
            let dateCondition = "";
            let queryParams = [];

            if (startDate && endDate) {
                dateCondition = "DATE(s.date) >= ? AND DATE(s.date) <= ?";
                queryParams.push(startDate, endDate);
            } else if (period === "today") {
                dateCondition = "DATE(s.date) = CURDATE()";
            } else if (period === "week") {
                dateCondition = "YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)";
            } else if (period === "month") {
                dateCondition = "YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE())";
            } else {
                dateCondition = "DATE(s.date) = CURDATE()";
            }

            const [rows] = await SalesModel.getCategoryBreakdown(dateCondition, queryParams);
            res.json(rows);
        } catch (error) {
            console.error("Get sales by category error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getChangePercentages(req, res) {
        try {
            const { period = "today" } = req.query;
            let currentCondition = "";
            let previousCondition = "";

            if (period !== "today" && period !== "week" && period !== "month") {
                return res.json({ revenue_change: 0, quantity_change: 0, avg_order_change: 0 });
            }

            if (period === "today") {
                currentCondition = "DATE(s.date) = CURDATE()";
                previousCondition = "DATE(s.date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
            } else if (period === "week") {
                currentCondition = "YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)";
                previousCondition = "YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1) - 1";
            } else if (period === "month") {
                currentCondition = "YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE())";
                previousCondition = "YEAR(s.date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(s.date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))";
            }

            const [current] = await SalesModel.getChangeData(currentCondition);
            const [previous] = await SalesModel.getChangeData(previousCondition);

            const currentData = current[0] || { total_revenue: 0, total_quantity: 0, avg_order_value: 0 };
            const previousData = previous[0] || { total_revenue: 0, total_quantity: 0, avg_order_value: 0 };

            const calculateChange = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            res.json({
                revenue_change: calculateChange(parseFloat(currentData.total_revenue || 0), parseFloat(previousData.total_revenue || 0)),
                quantity_change: calculateChange(parseFloat(currentData.total_quantity || 0), parseFloat(previousData.total_quantity || 0)),
                avg_order_change: calculateChange(parseFloat(currentData.avg_order_value || 0), parseFloat(previousData.avg_order_value || 0))
            });
        } catch (error) {
            console.error("Get change percentages error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getWeeklyChange(req, res) {
        try {
            const [thisWeek] = await SalesModel.getWeeklyTotal("YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)");
            const [lastWeek] = await SalesModel.getWeeklyTotal("YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1) - 1");

            const thisWeekTotal = parseFloat(thisWeek[0]?.total || 0);
            const lastWeekTotal = parseFloat(lastWeek[0]?.total || 0);

            let changePercent = 0;
            if (lastWeekTotal > 0) {
                changePercent = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
            } else if (thisWeekTotal > 0) {
                changePercent = 100;
            }

            res.json({
                change_percent: parseFloat(changePercent.toFixed(2)),
                this_week: thisWeekTotal,
                last_week: lastWeekTotal
            });
        } catch (error) {
            console.error("Get weekly change error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getTypeBreakdown(req, res) {
        try {
            const { period = "today", startDate, endDate } = req.query;
            let dateCondition = "";
            let queryParams = [];

            if (startDate && endDate) {
                dateCondition = "DATE(s.date) BETWEEN ? AND ?";
                queryParams.push(startDate, endDate);
            } else if (period === "today") {
                dateCondition = "DATE(s.date) = CURDATE()";
            } else if (period === "week") {
                dateCondition = "YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)";
            } else if (period === "month") {
                dateCondition = "YEAR(s.date) = YEAR(CURDATE()) AND MONTH(s.date) = MONTH(CURDATE())";
            } else {
                dateCondition = "1=1";
            }

            const [rows] = await SalesModel.getTypeBreakdown(dateCondition, queryParams);

            const totalOrders = rows.reduce((sum, r) => sum + (parseInt(r.order_count, 10) || 0), 0);
            const totalRevenue = rows.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0);

            const types = rows.map((r) => {
                const orders = parseInt(r.order_count, 10) || 0;
                const revenue = parseFloat(r.total_revenue) || 0;
                return {
                    sales_type: r.sales_type,
                    name: r.name || "Diğer",
                    order_count: orders,
                    total_revenue: revenue,
                    order_percent: totalOrders ? (orders / totalOrders) * 100 : 0,
                    revenue_percent: totalRevenue ? (revenue / totalRevenue) * 100 : 0,
                };
            });

            res.json({ total_orders: totalOrders, total_revenue: totalRevenue, types });
        } catch (error) {
            console.error("Get sales type breakdown error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = SalesController;
