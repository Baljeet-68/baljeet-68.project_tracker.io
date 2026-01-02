const { pool } = require('./db');

async function migrate() {
    try {
        console.log('Starting migration: Creating leaves table...');
        
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS leaves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('Full Day', 'Half Day', 'Early Leave', 'Short Leave', 'Compensation', 'Paid Leave') NOT NULL,
                status ENUM('Submitted', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Submitted',
                start_date DATE NOT NULL,
                end_date DATE NULL,
                half_day_period ENUM('Morning', 'Afternoon') NULL,
                short_leave_time TIME NULL,
                compensation_worked_date DATE NULL,
                compensation_worked_time VARCHAR(50) NULL,
                reason TEXT NOT NULL,
                approver_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await pool.query(createTableSql);
        console.log('SUCCESS: leaves table created or already exists.');
        
        process.exit(0);
    } catch (error) {
        console.error('ERROR during migration:', error);
        process.exit(1);
    }
}

migrate();
