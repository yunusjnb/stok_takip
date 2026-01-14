const UserModel = require('../models/UserModel');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli" });

            const [rows] = await UserModel.findByUsername(username);

            if (rows.length === 0) return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı" });

            const admin = rows[0];

            // Plain text comparison
            if (admin.password !== password) return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı" });

            res.json({
                success: true,
                message: "Giriş başarılı",
                admin: { id: admin.id, username: admin.username, type: admin.type }
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getUser(req, res) {
        try {
            const { username } = req.query;
            if (!username) return res.status(400).json({ error: "Kullanıcı adı gerekli" });

            const [rows] = await UserModel.getUserInfo(username);

            if (rows.length === 0) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

            res.json(rows[0]);
        } catch (error) {
            console.error("Get user error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = AuthController;
