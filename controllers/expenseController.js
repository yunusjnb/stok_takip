const ExpenseModel = require('../models/ExpenseModel');

class ExpenseController {

    static async getAllExpenses(req, res) {
        try {
            const { startDate, endDate, typeId } = req.query;
            const [rows] = await ExpenseModel.findAll(startDate, endDate, typeId);
            res.json(rows);
        } catch (error) {
            console.error("Get expenses error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getTypes(req, res) {
        try {
            const [rows] = await ExpenseModel.getTypes();
            res.json(rows);
        } catch (error) {
            console.error("Get expense types error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getRecent(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            if (isNaN(limit) || limit <= 0) {
                return res.status(400).json({ error: "Geçersiz limit değeri" });
            }
            const [rows] = await ExpenseModel.getRecent(limit);
            res.json(rows);
        } catch (error) {
            console.error("Get recent expenses error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await ExpenseModel.findById(id);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Gider bulunamadı" });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error("Get expense error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createExpense(req, res) {
        try {
            const { expense_type, name, price, date, description } = req.body;
            if (!expense_type || !name || !price || !date) {
                return res.status(400).json({ error: "Gider türü, ad, tutar ve tarih gerekli" });
            }
            const [result] = await ExpenseModel.create({
                expense_type: parseInt(expense_type),
                name: name.trim(),
                price: parseFloat(price),
                date,
                description
            });
            res.json({ success: true, id: result.insertId, message: "Gider başarıyla eklendi" });
        } catch (error) {
            console.error("Add expense error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateExpense(req, res) {
        try {
            const { id } = req.params;
            const { expense_type, name, price, date, description } = req.body;
            if (!expense_type || !name || !price || !date) {
                return res.status(400).json({ error: "Gider türü, ad, tutar ve tarih gerekli" });
            }
            await ExpenseModel.update(id, {
                expense_type: parseInt(expense_type),
                name: name.trim(),
                price: parseFloat(price),
                date,
                description
            });
            res.json({ success: true, message: "Gider başarıyla güncellendi" });
        } catch (error) {
            console.error("Update expense error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteExpense(req, res) {
        try {
            await ExpenseModel.delete(req.params.id);
            res.json({ success: true, message: "Gider başarıyla silindi" });
        } catch (error) {
            console.error("Delete expense error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getMonthlyTotal(req, res) {
        try {
            const { year, month } = req.query;
            const targetYear = year || new Date().getFullYear();
            const targetMonth = month || new Date().getMonth() + 1;

            const [currentMonth] = await ExpenseModel.getMonthlyTotal(targetYear, targetMonth);

            const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
            const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
            const [previousMonth] = await ExpenseModel.getMonthlyTotal(prevYear, prevMonth);

            const currentTotal = parseFloat(currentMonth[0]?.total || 0);
            const previousTotal = parseFloat(previousMonth[0]?.total || 0);

            let changePercent = 0;
            if (previousTotal > 0) {
                changePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
            } else if (currentTotal > 0) {
                changePercent = 100;
            }

            res.json({
                total: currentTotal,
                changePercent: parseFloat(changePercent.toFixed(2)),
                isIncrease: changePercent > 0
            });
        } catch (error) {
            console.error("Get monthly total error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = ExpenseController;
