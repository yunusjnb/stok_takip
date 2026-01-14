const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' }); // Adjust path if running from scripts folder

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'kesis_cafe'
};

async function migratePasswords() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // Get all admins
        const [users] = await connection.execute('SELECT id, username, password FROM admin');

        console.log(`Found ${users.length} users. Starting migration...`);

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2b$ or similar and are 60 chars)
            if (user.password && user.password.length === 60 && user.password.startsWith('$2')) {
                console.log(`User ${user.username} already has a hashed password. Skipping.`);
                continue;
            }

            console.log(`Hashing password for user: ${user.username}`);
            const hashedPassword = await bcrypt.hash(user.password, 10);

            await connection.execute('UPDATE admin SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            console.log(`Updated password for ${user.username}`);
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migratePasswords();
