console.log("1. Iniciando server.js...");

console.log("2. Cargando dotenv...");
require("dotenv").config();

console.log("3. Intentando cargar ./db...");
const { testConnection } = require("./db");

console.log("4. Intentando cargar ./app...");
const app = require("./app");

console.log("5. Todo cargado correctamente!");

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    console.log("6. Probando conexión DB...");
    await testConnection();

    console.log("7. Iniciando servidor...");
    app.listen(PORT, () => {
      console.log(`✅ Servidor funcionando en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};
startServer();
