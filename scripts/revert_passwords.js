const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kesis_cafe'
};

async function revertPasswords() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        console.log('Resetting all admin passwords to "12345" (plain text)...');

        // Reset all passwords to '12345'
        const [result] = await connection.execute('UPDATE admin SET password = ?', ['12345']);

        console.log(`Updated ${result.affectedRows} users. Passwords are now "12345".`);
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

revertPasswords();
