#!/usr/bin/env node
/**
 * Smoke por roles (API-only):
 *  - Registra 1 usuario por rol
 *  - Verifica login de cada uno
 *
 * Requiere: npm i axios dotenv
 * Variables .env usadas:
 *   BASE_URL (http://localhost:4000)
 *   TEST_INSTITUCION_ID (1)
 *   SEED_PASSWORD (Demo1234*)
 */

const path = require("path");
const dotenv = require("dotenv");

// Cargar .env de raíz y fallback a /scripts
let loaded = dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!loaded.parsed)
  loaded = dotenv.config({ path: path.resolve(__dirname, "./.env") });

const axiosBase = require("axios");

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const INSTITUCION_ID = String(process.env.TEST_INSTITUCION_ID || "1");
const PASSWORD = process.env.SEED_PASSWORD || "Demo1234*";

const axios = axiosBase.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Roles a probar
const ROLES = [
  "ESTUDIANTE",
  "PSICOLOGO",
  "ORIENTADOR",
  "ADMIN_INSTITUCION",
  "SUPER_ADMIN_NACIONAL",
];

const makeUserPayload = (rol, ts) => {
  const email = `${rol.toLowerCase()}.${ts}@demo.edu`;
  const nombre = rol[0] + rol.slice(1).toLowerCase(); // “Estudiante”, “Psicologo”, etc.
  return {
    email,
    register: {
      nombre,
      apellidoPaterno: "Smoke",
      email,
      password: PASSWORD,
      rol,
      institucionId: INSTITUCION_ID,
      carreraId: null,
    },
    login: {
      email,
      password: PASSWORD,
      institucionId: INSTITUCION_ID,
    },
  };
};

async function registerUser(payload) {
  try {
    const { data } = await axios.post("/api/auth/register", payload);
    return { ok: true, data: data?.data };
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    if (status === 409 && body?.code === "DUPLICATE_EMAIL") {
      console.log(`ℹ️  Ya existía: ${payload.email}`);
      return { ok: true, data: null, duplicate: true };
    }
    console.error("❌ Registro falló:", status, body || err.message);
    return { ok: false, err };
  }
}

async function loginUser(payload) {
  try {
    const { data } = await axios.post("/api/auth/login", payload);
    return { ok: true, data: data?.data };
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error("❌ Login falló:", status, body || err.message);
    return { ok: false, err };
  }
}

(async () => {
  const ts = Date.now();
  console.log("=== Smoke por roles (API-only) ===");
  console.log({ BASE_URL, TEST_INSTITUCION_ID: INSTITUCION_ID, PASSWORD });

  const results = [];

  for (const rol of ROLES) {
    console.log("\n────────────────────────────────────────");
    console.log(`🎭 Rol: ${rol}`);
    const u = makeUserPayload(rol, ts);

    // 1) Register
    console.log("→ Registrando...");
    const reg = await registerUser(u.register);
    if (!reg.ok) {
      results.push({ rol, email: u.email, registered: false, logged: false });
      continue;
    }

    // 2) Login
    console.log("→ Login...");
    const lg = await loginUser(u.login);
    if (!lg.ok) {
      results.push({ rol, email: u.email, registered: true, logged: false });
      continue;
    }

    const user = lg.data?.user;
    console.log(`✅ OK ${rol} → ${u.email}`);
    results.push({ rol, email: u.email, registered: true, logged: true, user });
  }

  console.log("\n=== Resumen ===");
  results.forEach((r) => {
    console.log(
      `- ${r.rol.padEnd(22)} ${String(r.registered).padEnd(5)} / ${String(
        r.logged
      ).padEnd(5)}  ${r.email}`
    );
  });

  console.log(
    "\n🎯 Listo. Usa cualquiera de esos correos en tu UI. Contraseña:",
    PASSWORD
  );
})().catch((e) => {
  console.error("❌ Error general:", e?.message || e);
  process.exit(1);
});
