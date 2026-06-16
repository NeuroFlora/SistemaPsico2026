//server/scripts/test-auth.js
require("dotenv").config();
const axios = require("axios");

// Configuración
const BASE_URL = "http://localhost:4000";
const API_URL = `${BASE_URL}/api/auth`;

// Colores para console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

const log = (color, message) =>
  console.log(`${colors[color]}${message}${colors.reset}`);

// Usuarios de prueba
const testUsers = [
  {
    name: "Super Admin Nacional",
    email: "superadmin@sistema.com",
    password: "Password123!",
    expectedRole: "ORIENTADOR", // Ajusta según lo que tengas en BD
    color: "magenta",
  },
  {
    name: "Admin Institución",
    email: "admin@une.edu",
    password: "Password123!",
    expectedRole: "ORIENTADOR", // Ajusta según lo que tengas en BD
    color: "blue",
  },
  {
    name: "Psicólogo",
    email: "psicologo@une.edu",
    password: "Password123!",
    expectedRole: "PSICOLOGO",
    color: "green",
  },
  {
    name: "Estudiante",
    email: "estudiante@une.edu",
    password: "Password123!",
    expectedRole: "ESTUDIANTE",
    color: "cyan",
  },
];

// Función para hacer peticiones HTTP
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
    };
  }
};

// Test individual
const runTest = async (testName, testFunction) => {
  try {
    log("yellow", `\n🧪 ${testName}`);
    log("yellow", "─".repeat(50));

    const result = await testFunction();

    if (result.success) {
      log("green", `✅ ${testName} - ÉXITO`);
    } else {
      log("red", `❌ ${testName} - FALLO`);
      console.log("   Error:", result.error);
    }

    return result;
  } catch (error) {
    log("red", `💥 ${testName} - ERROR CRÍTICO`);
    console.log("   Error:", error.message);
    return { success: false, error: error.message };
  }
};

// Tests específicos
const tests = {
  // Test 1: Health Check
  healthCheck: async () => {
    log("white", "📡 Probando health check...");
    const result = await makeRequest("GET", `${BASE_URL}/health`);

    if (result.success) {
      log("green", `   Status: ${result.status}`);
      log("green", `   Message: ${result.data.message}`);
    }

    return result;
  },

  // Test 2: Login inválido
  invalidLogin: async () => {
    log("white", "🚫 Probando login con credenciales inválidas...");
    const result = await makeRequest("POST", `${API_URL}/login`, {
      email: "noexiste@test.com",
      password: "wrongpassword",
    });

    // Para este test, esperamos que FALLE
    if (!result.success && result.status === 401) {
      log("green", "   ✅ Correctamente rechazó credenciales inválidas");
      return { success: true };
    } else {
      log("red", "   ❌ Debería haber rechazado las credenciales");
      return { success: false, error: "Login inválido no fue rechazado" };
    }
  },

  // Test 3: Login válido para cada usuario
  validLogins: async () => {
    log("white", "🔐 Probando login válido para cada usuario...");
    const results = {};

    for (const user of testUsers) {
      log(user.color, `\n   👤 ${user.name} (${user.email})`);

      const loginResult = await makeRequest("POST", `${API_URL}/login`, {
        email: user.email,
        password: user.password,
      });

      if (loginResult.success) {
        const userData = loginResult.data.data;
        log("green", `      ✅ Login exitoso`);
        log("white", `      📧 Email: ${userData.user.email}`);
        log("white", `      👑 Rol: ${userData.user.rol}`);
        log(
          "white",
          `      🏛️  Institución: ${userData.user.institucionId || "N/A"}`
        );
        log(
          "white",
          `      🎫 Token: ${userData.accessToken.substring(0, 20)}...`
        );

        results[user.email] = {
          success: true,
          token: userData.accessToken,
          user: userData.user,
        };
      } else {
        log(
          "red",
          `      ❌ Login falló: ${
            loginResult.error.message || loginResult.error
          }`
        );
        results[user.email] = { success: false, error: loginResult.error };
      }
    }

    // Verificar si al menos un login fue exitoso
    const successfulLogins = Object.values(results).filter((r) => r.success);
    if (successfulLogins.length > 0) {
      return { success: true, results };
    } else {
      return { success: false, error: "Ningún login fue exitoso", results };
    }
  },

  // Test 4: Acceso a perfil
  profileAccess: async () => {
    log("white", "👤 Probando acceso a perfil...");

    // Primero hacer login
    const loginResult = await makeRequest("POST", `${API_URL}/login`, {
      email: "psicologo@une.edu",
      password: "Password123!",
    });

    if (!loginResult.success) {
      return {
        success: false,
        error: "No se pudo hacer login para probar perfil",
      };
    }

    const token = loginResult.data.data.accessToken;

    // Probar acceso a perfil
    const profileResult = await makeRequest("GET", `${API_URL}/profile`, null, {
      Authorization: `Bearer ${token}`,
    });

    if (profileResult.success) {
      const profile = profileResult.data.data;
      log("green", "   ✅ Perfil obtenido correctamente");
      log("white", `      📧 Email: ${profile.email}`);
      log("white", `      👑 Rol: ${profile.rol}`);
      log("white", `      📛 Nombre: ${profile.nombreCompleto}`);
    }

    return profileResult;
  },

  // Test 5: Verificación de token
  tokenVerification: async () => {
    log("white", "🎫 Probando verificación de token...");

    // Login para obtener token
    const loginResult = await makeRequest("POST", `${API_URL}/login`, {
      email: "psicologo@une.edu",
      password: "Password123!",
    });

    if (!loginResult.success) {
      return {
        success: false,
        error: "No se pudo hacer login para probar token",
      };
    }

    const token = loginResult.data.data.accessToken;

    // Verificar token
    const verifyResult = await makeRequest("GET", `${API_URL}/verify`, null, {
      Authorization: `Bearer ${token}`,
    });

    if (verifyResult.success) {
      log("green", "   ✅ Token verificado correctamente");
      log("white", `      👤 Usuario: ${verifyResult.data.data.user.email}`);
    }

    return verifyResult;
  },

  // Test 6: Acceso sin token (debe fallar)
  unauthorizedAccess: async () => {
    log("white", "🚫 Probando acceso sin token (debe fallar)...");

    const result = await makeRequest("GET", `${API_URL}/profile`);

    // Esperamos que falle
    if (!result.success && result.status === 401) {
      log("green", "   ✅ Correctamente bloqueó acceso sin token");
      return { success: true };
    } else {
      log("red", "   ❌ Debería haber bloqueado el acceso");
      return { success: false, error: "Acceso sin token no fue bloqueado" };
    }
  },

  // Test 7: Token inválido (debe fallar)
  invalidToken: async () => {
    log("white", "🎭 Probando token inválido (debe fallar)...");

    const result = await makeRequest("GET", `${API_URL}/profile`, null, {
      Authorization: "Bearer token_falso_123",
    });

    // Esperamos que falle
    if (!result.success && result.status === 401) {
      log("green", "   ✅ Correctamente rechazó token inválido");
      return { success: true };
    } else {
      log("red", "   ❌ Debería haber rechazado el token inválido");
      return { success: false, error: "Token inválido no fue rechazado" };
    }
  },

  // Test 8: Logout
  logout: async () => {
    log("white", "👋 Probando logout...");

    // Login primero
    const loginResult = await makeRequest("POST", `${API_URL}/login`, {
      email: "estudiante@une.edu",
      password: "Password123!",
    });

    if (!loginResult.success) {
      return {
        success: false,
        error: "No se pudo hacer login para probar logout",
      };
    }

    const token = loginResult.data.data.accessToken;

    // Logout
    const logoutResult = await makeRequest("POST", `${API_URL}/logout`, null, {
      Authorization: `Bearer ${token}`,
    });

    if (logoutResult.success) {
      log("green", "   ✅ Logout exitoso");
      log("white", `      📝 Mensaje: ${logoutResult.data.message}`);
    }

    return logoutResult;
  },
};

// Función principal
const runAllTests = async () => {
  console.clear();
  log("magenta", "🚀 INICIANDO TESTS DE AUTENTICACIÓN");
  log("magenta", "═".repeat(60));
  log("white", `📍 URL Base: ${BASE_URL}`);
  log("white", `🎯 API: ${API_URL}`);
  log("white", `⏰ Fecha: ${new Date().toLocaleString()}`);

  const results = {};

  // Ejecutar todos los tests
  for (const [testName, testFunction] of Object.entries(tests)) {
    results[testName] = await runTest(testName, testFunction);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Pausa entre tests
  }

  // Resumen final
  log("magenta", "\n🏁 RESUMEN DE RESULTADOS");
  log("magenta", "═".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const [testName, result] of Object.entries(results)) {
    if (result.success) {
      log("green", `✅ ${testName}`);
      passed++;
    } else {
      log("red", `❌ ${testName}`);
      failed++;
    }
  }

  log("white", "\n📊 ESTADÍSTICAS:");
  log("green", `   ✅ Tests exitosos: ${passed}`);
  log("red", `   ❌ Tests fallidos: ${failed}`);
  log("white", `   📝 Total: ${passed + failed}`);

  if (failed === 0) {
    log("green", "\n🎉 ¡TODOS LOS TESTS PASARON! 🎉");
    log("green", "🔒 Sistema de autenticación funcionando perfectamente");
  } else {
    log("yellow", "\n⚠️  Algunos tests fallaron. Revisa los errores arriba.");
  }

  process.exit(failed === 0 ? 0 : 1);
};

// Verificar que el servidor esté corriendo
const checkServer = async () => {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    log("red", "❌ El servidor no está corriendo o no responde");
    log(
      "yellow",
      `📡 Asegúrate de que el servidor esté corriendo en ${BASE_URL}`
    );
    log("white", "   Ejecuta: npm run dev");
    return false;
  }
};

// Iniciar tests
const main = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runAllTests();
  } else {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("💥 Error crítico:", error);
  process.exit(1);
});
