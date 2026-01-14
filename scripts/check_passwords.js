const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kesis_cafe'
};

async function checkPasswords() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const [users] = await connection.execute('SELECT id, username, password FROM admin');

        console.log('--- Current Admin Users ---');
        users.forEach(u => {
            console.log(`User: ${u.username}, Password: "${u.password}"`);
        });
        console.log('---------------------------');

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkPasswords();
