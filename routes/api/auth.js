const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/authController");

// Giriş Yap
router.post("/login", AuthController.login);

// Kullanıcı bilgilerini getir
router.get("/user", AuthController.getUser);

module.exports = router;
