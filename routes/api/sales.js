const express = require("express");
const router = express.Router();
const SalesController = require("../../controllers/salesController");

// Satış ekle
router.post("/", SalesController.createSale);

// Günlük satışları getir (saatlik)
router.get("/daily", SalesController.getDailySales);

// Haftalık satışları getir
router.get("/weekly", SalesController.getWeeklySales);

// Aylık satışları getir
router.get("/monthly", SalesController.getMonthlySales);

// Dinamik Trend Grafiği
router.get("/trend", SalesController.getTrend);

// Satış istatistikleri
router.get("/stats", SalesController.getStats);

// En çok satan ürünler
router.get("/top-products", SalesController.getTopProducts);

// Kategoriye göre gelir dağılımı
router.get("/by-category", SalesController.getCategoryBreakdown);

// Dönem bazlı değişim yüzdeleri
router.get("/change-percentages", SalesController.getChangePercentages);

// Haftalık satış değişim yüzdesi
router.get("/weekly-change", SalesController.getWeeklyChange);

// Satış tipine göre dağılım
router.get("/type-breakdown", SalesController.getTypeBreakdown);

module.exports = router;
