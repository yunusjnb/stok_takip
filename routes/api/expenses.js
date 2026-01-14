const express = require("express");
const router = express.Router();
const ExpenseController = require("../../controllers/expenseController");

// Tüm giderleri getir
router.get("/", ExpenseController.getAllExpenses);

// Gider tiplerini getir
router.get("/types", ExpenseController.getTypes);

// Son eklenen giderleri getir
router.get("/recent", ExpenseController.getRecent);

// Bu ay toplam gider
router.get("/monthly-total", ExpenseController.getMonthlyTotal);

// Tek gider getir
router.get("/:id", ExpenseController.getById);

// Yeni gider ekle
router.post("/", ExpenseController.createExpense);

// Gider güncelle
router.put("/:id", ExpenseController.updateExpense);

// Gider sil
router.delete("/:id", ExpenseController.deleteExpense);

module.exports = router;
