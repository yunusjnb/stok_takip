const BaseModel = require('./BaseModel');

class UserModel extends BaseModel {
    static async findByUsername(username) {
        return this.query("SELECT id, username, password, type FROM admin WHERE username = ?", [username]);
    }

    static async getUserInfo(username) {
        return this.query("SELECT id, username, type FROM admin WHERE username = ?", [username]);
    }
}

module.exports = UserModel;
