// test-complete-profile.js
const axios = require("axios");

// 🔴 CONFIGURACIÓN
const CONFIG = {
  SERVER_URL: "http://localhost:4000",
  EMAIL: "estudiante.1756854575024@demo.edu", // Usuario estudiante
  PASSWORD: "Demo1234*",
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

// Función para resetear el onboarding
async function resetOnboarding(token) {
  try {
    console.log("\n🔄 Reseteando onboarding...");

    const response = await axios.post(
      `${CONFIG.SERVER_URL}/api/onboarding/reset`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    console.log("✅ Onboarding reseteado!");
    return response.data;
  } catch (error) {
    console.log("❌ Error reseteando onboarding:", error.message);
    throw error;
  }
}

// Función para obtener perfil actual
async function getProfile(token) {
  try {
    console.log("\n👤 Obteniendo perfil actual...");

    const response = await axios.get(
      `${CONFIG.SERVER_URL}/api/onboarding/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    console.log("📋 Perfil actual:", JSON.stringify(response.data.data, null, 2));
    return response.data;
  } catch (error) {
    console.log("❌ Error obteniendo perfil:", error.message);
    throw error;
  }
}

// Función para completar el perfil con datos de estudiante
async function completeProfile(token) {
  try {
    console.log("\n📝 Completando perfil con datos de estudiante...");

    // Datos de prueba para estudiante
    const profileData = {
      // Campos básicos
      telefono: "5551234567",
      fechaNacimiento: "2000-05-15",
      genero: "MASCULINO",
      ciudad: "Ciudad de México",
      estado: "CDMX",

      // Campos específicos para estudiantes
      matricula: "EST2024001",
      semestre: 5,
      grupo: "A",
      turno: "MATUTINO",
      carreraId: 1,
      trabajaActualmente: false,
      // lugarTrabajo se omite porque es null
      nombrePadre: "Juan Pérez",
      telefonoPadre: "5559876543",
      nombreMadre: "María García",
      telefonoMadre: "5555555555",
      contactoEmergenciaNombre: "Ana Pérez",
      contactoEmergenciaTelefono: "5551111111",
      contactoEmergenciaRelacion: "Hermana",
      tieneComputadora: true,
      tieneInternet: true,
      medioTransporte: "Transporte público",
      nivelSocioeconomico: "MEDIO",
      pasatiempos: "Leer, videojuegos",
      deportesPractica: "Fútbol",
      idiomasHabla: "Español, Inglés",
      tieneBeca: true,
      tipoBeca: "Académica",
      participaActividades: true
    };

    console.log("📤 Datos a enviar:", JSON.stringify(profileData, null, 2));

    const response = await axios.post(
      `${CONFIG.SERVER_URL}/api/onboarding/complete-profile`,
      profileData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    console.log("\n✅ RESPUESTA DEL COMPLETE-PROFILE:");
    console.log("📊 Status:", response.status);
    console.log("📋 Data completa:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.log("\n❌ ERROR EN COMPLETE-PROFILE:");
    if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log("📋 Response:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 400) {
        console.log("🔍 Error de validación - revisa los datos enviados");
      } else if (error.response.status === 401) {
        console.log("🔐 Error de autenticación - token inválido o expirado");
      }
    } else {
      console.log("🔌 Error de conexión:", error.message);
    }
    throw error;
  }
}

// Función principal que ejecuta todo el flujo
async function runCompleteTest() {
  console.log("🎯 INICIANDO TEST COMPLETO DE COMPLETE-PROFILE");
  console.log("═══════════════════════════════════════════════");
  console.log("🌐 Servidor:", CONFIG.SERVER_URL);
  console.log("📧 Usuario:", CONFIG.EMAIL);
  console.log("");

  try {
    // Paso 1: Login
    const token = await login();

    // Paso 2: Ver perfil actual
    await getProfile(token);

    // Paso 3: Resetear onboarding
    await resetOnboarding(token);

    // Paso 4: Ver perfil después de reset
    await getProfile(token);

    // Paso 5: Completar perfil con datos
    await completeProfile(token);

    // Paso 6: Ver perfil final
    await getProfile(token);

    console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("🔍 Revisa los logs del servidor para ver los detalles del procesamiento");
  } catch (error) {
    console.log("\n💥 TEST FALLÓ");
    console.log("Error final:", error.message);
  }
}

// Ejecutar el test
runCompleteTest();