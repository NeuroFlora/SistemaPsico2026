require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../src/db");

const testPassword = async () => {
  try {
    console.log("🔍 Verificando contraseñas...");

    const testEmail = "psicologo@une.edu";
    const testPassword = "Password123!";

    // Obtener usuario de la BD
    const [users] = await pool.execute(
      "SELECT id, email, passwordHash, rol, status FROM usuarios WHERE email = ?",
      [testEmail]
    );

    if (users.length === 0) {
      console.log("❌ Usuario no encontrado en la BD");
      return;
    }

    const user = users[0];
    console.log("👤 Usuario encontrado:", {
      id: user.id,
      email: user.email,
      rol: user.rol,
      status: user.status,
      passwordHash: user.passwordHash.substring(0, 20) + "...",
    });

    // Verificar contraseña
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(
      `🔑 ¿Contraseña "${testPassword}" es válida?`,
      isValid ? "✅ SÍ" : "❌ NO"
    );

    // Generar nuevo hash para comparar
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log("🆕 Nuevo hash generado:", newHash.substring(0, 20) + "...");

    const isNewHashValid = await bcrypt.compare(testPassword, newHash);
    console.log("🧪 ¿Nuevo hash funciona?", isNewHashValid ? "✅ SÍ" : "❌ NO");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testPassword();
    