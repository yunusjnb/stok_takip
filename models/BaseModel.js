const db = require('../config/db');

class BaseModel {
    static async query(sql, params) {
        return db.execute(sql, params);
    }
    
    static async getConnection() {
        return db.getConnection();
    }
}

module.exports = BaseModel;
