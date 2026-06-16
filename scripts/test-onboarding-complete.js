// test-onboarding-complete.js
const axios = require("axios");

// 🔴 CONFIGURACIÓN - CAMBIA ESTOS VALORES POR TUS CREDENCIALES REALES
const CONFIG = {
  SERVER_URL: "http://localhost:4000",
  EMAIL: "admin_institucion.1756854575024@demo.edu", // 🔴 CAMBIA ESTO
  PASSWORD: "Demo1234*", // 🔴 CAMBIA ESTO
};

// Función para hacer login y obtener el token
async function login() {
  try {
    console.log("🔐 Haciendo login...");
    console.log("📧 Email:", CONFIG.EMAIL);

    const response = await axios.post(
      `${CONFIG.SERVER_URL}/api/auth/login`,
      {
        email: CONFIG.EMAIL,
        password: CONFIG.PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data.success && (response.data.data.token || response.data.data.accessToken)) {
      console.log("✅ Login exitoso!");
      const token = response.data.data.token || response.data.data.accessToken;
      console.log(
        "🔑 Token obtenido:",
        token.substring(0, 30) + "..."
      );
      return token;
    } else {
      throw new Error("Login falló: " + JSON.stringify(response.data));
    }
  } catch (error) {
    console.log("❌ ERROR EN LOGIN:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log("📋 Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("🔌 Error de conexión:", error.message);
    }
    throw error;
  }
}

// Función para probar el endpoint de test-update
async function testOnboardingUpdate(token) {
  try {
    console.log("\n🚀 Probando endpoint test-update...");

    const response = await axios.post(
      `${CONFIG.SERVER_URL}/api/onboarding/test-update`,
      {}, // Body vacío
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    console.log("\n✅ RESPUESTA DEL TEST-UPDATE:");
    console.log("📊 Status:", response.status);
    console.log("📋 Data completa:", JSON.stringify(response.data, null, 2));

    // Analizar resultados detallados
    const { data } = response.data;
    if (data) {
      console.log("\n🔍 ANÁLISIS DETALLADO:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("👤 User ID:", data.before?.id || "N/A");
      console.log("📋 ANTES del UPDATE:");
      console.log("   perfilCompletado:", data.before?.perfilCompletado);
      console.log("   matricula:", data.before?.matricula);
      console.log("   telefono:", data.before?.telefono);

      console.log("📋 DESPUÉS del UPDATE:");
      console.log("   perfilCompletado:", data.after?.perfilCompletado);
      console.log("   matricula:", data.after?.matricula);
      console.log("   telefono:", data.after?.telefono);

      console.log("⚡ RESULTADO del UPDATE:");
      console.log("   Filas afectadas:", data.affectedRows);

      // Diagnóstico
      console.log("\n🩺 DIAGNÓSTICO:");
      if (data.affectedRows === 0) {
        console.log(
          "🔴 PROBLEMA: affectedRows = 0 significa que el UPDATE no encontró el usuario"
        );
        console.log("   Posibles causas:");
        console.log("   - El user ID no existe en la tabla usuarios");
        console.log("   - Hay un problema con el WHERE clause");
      } else if (
        data.before?.perfilCompletado === data.after?.perfilCompletado
      ) {
        console.log(
          "🟡 PROBLEMA: El UPDATE se ejecutó pero no cambió el valor"
        );
        console.log("   - perfilCompletado ya tenía el valor 1");
        console.log("   - O hay un problema con la transacción/commit");
      } else {
        console.log("🟢 ¡ÉXITO! El UPDATE funcionó correctamente");
        console.log(
          `   perfilCompletado cambió de ${data.before?.perfilCompletado} a ${data.after?.perfilCompletado}`
        );
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    return response.data;
  } catch (error) {
    console.log("\n❌ ERROR EN TEST-UPDATE:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log("📋 Response:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log("🔐 Error de autenticación - token inválido o expirado");
      } else if (error.response.status === 404) {
        console.log(
          "🔍 Endpoint no encontrado - verifica que la ruta esté bien"
        );
      }
    } else {
      console.log("🔌 Error de conexión:", error.message);
    }
    throw error;
  }
}

// Función principal que ejecuta todo el flujo
async function runCompleteTest() {
  console.log("🎯 INICIANDO TEST COMPLETO DE ONBOARDING");
  console.log("═══════════════════════════════════════");
  console.log("🌐 Servidor:", CONFIG.SERVER_URL);
  console.log("📧 Usuario:", CONFIG.EMAIL);
  console.log("");

  try {
    // Paso 1: Login
    const token = await login();

    // Paso 2: Test del endpoint
    await testOnboardingUpdate(token);

    console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
  } catch (error) {
    console.log("\n💥 TEST FALLÓ");
    console.log("Error final:", error.message);
  }
}

// Ejecutar el test
runCompleteTest();
