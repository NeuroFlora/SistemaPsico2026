const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ✅ SIN acquireTimeout y timeout
});

const promisePool = pool.promise();

const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log("✅ Conexión a MySQL establecida correctamente");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar con MySQL:", error.message);
    process.exit(1);
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
};
