const express = require("express");
const router = express.Router();
const SalaryController = require("../../controllers/salaryController");

// Maaş hesaplama
router.get("/calculate", SalaryController.calculate);

// Maaş özeti
router.get("/summary", SalaryController.getSummary);

// Maaş ödemesi yap
router.post("/payment", SalaryController.makePayment);

module.exports = router;
