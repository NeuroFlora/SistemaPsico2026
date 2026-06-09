const mysql = require('mysql2/promise');
require('dotenv').config();

async function createBreaksTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'sistema_educativo'
    });

    console.log('🔗 Connected to database');

    // Create the breaks table
    const createTableSQL = `CREATE TABLE IF NOT EXISTS descansos_psicologo (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      psicologoId VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      diaSemana ENUM('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO') NOT NULL,
      horaInicio TIME NOT NULL,
      horaFin TIME NOT NULL,
      tipo ENUM('ALMUERZO','DESCANSO','CAFE','PERSONAL','OTRO') DEFAULT 'DESCANSO',
      descripcion VARCHAR(255) NULL,
      activo BOOLEAN DEFAULT 1,
      createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      FOREIGN KEY (psicologoId) REFERENCES usuarios(id) ON DELETE CASCADE,
      INDEX idx_psicologo_dia (psicologoId, diaSemana),
      INDEX idx_activo (activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

    await connection.execute(createTableSQL);
    console.log('✅ Table descansos_psicologo created successfully');

    // Insert sample data
    const insertSQL = `INSERT IGNORE INTO descansos_psicologo (psicologoId, diaSemana, horaInicio, horaFin, tipo, descripcion) VALUES
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'LUNES', '12:00:00', '13:00:00', 'ALMUERZO', 'Hora de almuerzo'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'MARTES', '12:00:00', '13:00:00', 'ALMUERZO', 'Hora de almuerzo'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'MIERCOLES', '12:00:00', '13:00:00', 'ALMUERZO', 'Hora de almuerzo'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'JUEVES', '12:00:00', '13:00:00', 'ALMUERZO', 'Hora de almuerzo'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'VIERNES', '12:00:00', '13:00:00', 'ALMUERZO', 'Hora de almuerzo'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'LUNES', '15:30:00', '15:45:00', 'CAFE', 'Descanso de tarde'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'MARTES', '15:30:00', '15:45:00', 'CAFE', 'Descanso de tarde'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'MIERCOLES', '15:30:00', '15:45:00', 'CAFE', 'Descanso de tarde'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'JUEVES', '15:30:00', '15:45:00', 'CAFE', 'Descanso de tarde'),
      ('45a9ac33-196b-4fee-908d-bd1aa5ac60a7', 'VIERNES', '15:30:00', '15:45:00', 'CAFE', 'Descanso de tarde')`;

    const [result] = await connection.execute(insertSQL);
    console.log(`✅ Sample break data inserted (${result.affectedRows} rows)`);

    await connection.end();
    console.log('🏁 Database setup completed successfully');

  } catch (error) {
    console.error('❌ Error creating breaks table:', error);
    process.exit(1);
  }
}

createBreaksTable();