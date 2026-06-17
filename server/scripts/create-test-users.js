require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../src/db");

const createTestUsers = async () => {
  try {
    console.log("🔄 Generando usuarios de prueba...");

    // Contraseña común para todos los usuarios de prueba
    const password = "Demo1234*";
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`🔑 Contraseña para todos los usuarios: ${password}`);

    // Verificar/crear instituciones
    await pool.execute(`
      INSERT INTO instituciones (nombre, codigo, email, status) VALUES 
      ('Universidad Nacional de Ejemplo', 'UNE', 'admin@une.edu', 'ACTIVO'),
      ('Instituto Tecnológico Superior', 'ITS', 'info@its.edu', 'ACTIVO')
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
    `);

    // Crear usuarios de prueba
    const users = [
      {
        institucionId: null,
        carreraId: null,
        nombre: "Super",
        apellidoPaterno: "Admin",
        apellidoMaterno: "Nacional",
        email: "superadmin@sistema.com",
        rol: "SUPER_ADMIN_NACIONAL",
      },
      {
        institucionId: 1,
        carreraId: null,
        nombre: "Admin",
        apellidoPaterno: "Universidad",
        apellidoMaterno: "Ejemplo",
        email: "admin@une.edu",
        rol: "SUPER_ADMIN_INSTITUCION",
      },
      {
        institucionId: 1,
        carreraId: null,
        nombre: "María",
        apellidoPaterno: "González",
        apellidoMaterno: "López",
        email: "psicologo@une.edu",
        rol: "PSICOLOGO",
      },
      {
        institucionId: 1,
        carreraId: 1,
        nombre: "Juan",
        apellidoPaterno: "Pérez",
        apellidoMaterno: "García",
        email: "estudiante@une.edu",
        rol: "ESTUDIANTE",
      },
    ];

    for (const user of users) {
      const nombreCompleto = `${user.nombre} ${user.apellidoPaterno} ${
        user.apellidoMaterno || ""
      }`.trim();

      // Verificar si el usuario ya existe
      const [existing] = await pool.execute(
        "SELECT id FROM usuarios WHERE email = ?",
        [user.email]
      );

      if (existing.length > 0) {
        console.log(`⚠️  Usuario ya existe: ${user.email}`);
        continue;
      }

      // Crear usuario
      await pool.execute(
        `
        INSERT INTO usuarios (
          institucionId, carreraId, nombre, apellidoPaterno, apellidoMaterno, 
          nombreCompleto, email, passwordHash, rol, status, emailVerificado, 
          requiereCambioPassword, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', true, false, NOW(), NOW())
      `,
        [
          user.institucionId,
          user.carreraId,
          user.nombre,
          user.apellidoPaterno,
          user.apellidoMaterno,
          nombreCompleto,
          user.email,
          hashedPassword,
          user.rol,
        ]
      );

      console.log(`✅ Usuario creado: ${user.email} [${user.rol}]`);
    }

    console.log("\n🎉 ¡Usuarios de prueba creados exitosamente!");
    console.log("\n📋 Credenciales de prueba:");
    console.log("Contraseña para todos: Demo1234*");
    console.log("- superadmin@sistema.com (SUPER_ADMIN_NACIONAL)");
    console.log("- admin@une.edu (SUPER_ADMIN_INSTITUCION)");
    console.log("- psicologo@une.edu (PSICOLOGO)");
    console.log("- estudiante@une.edu (ESTUDIANTE)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creando usuarios:", error);
    process.exit(1);
  }
};

createTestUsers();
