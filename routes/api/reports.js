const express = require("express");
const router = express.Router();
const ReportController = require("../../controllers/reportController");

// Aylık kapanış raporu
router.get("/monthly-close", ReportController.getMonthlyClose);

// Günlük gelir/gider akışı
router.get("/daily-flow", ReportController.getDailyFlow);

// Gider dağılımı
router.get("/expense-breakdown", ReportController.getExpenseBreakdown);

// Detaylı gider listesi (İşletme + Tedarik)
router.get("/expense-details", ReportController.getExpenseDetails);

// Mevcut ay ve yıl listesi
router.get("/available-months", ReportController.getAvailableMonths);

// Excel Raporu Dışa Aktar
router.get("/export-excel", ReportController.exportExcel);

module.exports = router;
