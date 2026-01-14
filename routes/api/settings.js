const express = require("express");
const router = express.Router();
const SettingController = require("../../controllers/settingController");

// Tüm ayarları getir
router.get("/", SettingController.getAll);

// Ayarları güncelle
router.post("/", SettingController.update);

module.exports = router;
