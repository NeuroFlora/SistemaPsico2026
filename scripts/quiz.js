// node scripts/quiz-resultados.js
const axios = require("axios");
const jwt = require("jsonwebtoken");

const API_BASE = process.env.API_BASE || "http://localhost:4000";
const AUTH_LOGIN_PATH = process.env.AUTH_LOGIN_PATH || "/api/auth/login";
const QUIZZES_BASE = "/api/quizzes";
const STAFF_EMAIL = "admin_institucion.1756854575024@demo.edu";
const PASSWORD = "Demo1234*";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});
http.interceptors.request.use((c) => {
  console.log(
    `\n➡️  [${(c.method || "GET").toUpperCase()}] ${API_BASE}${c.url}`
  );
  if (c.headers?.Authorization)
    console.log("   🔑 Authorization: Bearer <token>");
  if (c.headers?.["x-institution-id"])
    console.log("   🏫 x-institution-id:", c.headers["x-institution-id"]);
  if (c.params) console.log("   🔎 Params:", JSON.stringify(c.params));
  return c;
});
http.interceptors.response.use(
  (r) => {
    console.log(
      `✅ Respuesta ${r.status}:`,
      JSON.stringify(r.data).slice(0, 900)
    );
    return r;
  },
  (e) => {
    console.error(
      `❌ Error ${e.response?.status || ""}:`,
      JSON.stringify(e.response?.data || e.message)
    );
    throw e;
  }
);

async function login(email, password) {
  const { data } = await http.post(AUTH_LOGIN_PATH, { email, password });
  const token = data?.data?.accessToken;
  const payload = jwt.decode(token);
  return { token, payload };
}
function pickInstitutionId(p, fb = "1") {
  const insts = p?.instituciones || [];
  return String(insts[0]?.institucionId || fb);
}

(async () => {
  try {
    console.log("🚀 Probar /api/quizzes/resultados ...");
    const { token, payload } = await login(STAFF_EMAIL, PASSWORD);
    const instId = pickInstitutionId(payload, "1");

    // 1) listado con debug
    const r1 = await http.get(`${QUIZZES_BASE}/resultados`, {
      headers: { Authorization: `Bearer ${token}`, "x-institution-id": instId },
      params: { page: 1, pageSize: 10, debug: 1 },
    });
    console.log("\n📄 Filas:", (r1.data?.data || []).length);
    console.log("🛠️  Debug:", r1.data?.debug || "(sin debug)");

    // 2) filtro ejemplo
    const r2 = await http.get(`${QUIZZES_BASE}/resultados`, {
      headers: { Authorization: `Bearer ${token}`, "x-institution-id": instId },
      params: { codigo: "BAI", severidad: "SEVERA", page: 1, pageSize: 5 },
    });
    console.log("\n🎯 Solo BAI/SEVERA:", (r2.data?.data || []).length, "filas");
    console.log("\n🎉 /resultados OK (si esto llegó aquí).");
  } catch (e) {
    console.error("🚨 Falla:", e.message);
  }
})();
