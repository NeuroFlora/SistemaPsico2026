# Proyecto: Sistema Psicológico — MANIFEST

## 1) Monorepo/Estructura
- Frontend: localhost:5173 (Vite/Next/React versión: __)
- Backend: localhost:4000 (Express versión: __)
- DB: MySQL localhost

## 2) Scripts principales
Frontend:
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
Backend:
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },

## 3) Variables de entorno (solo nombres, sin secretos)
# Semilla
TEST_INSTITUCION_ID=1
SEED_PASSWORD=Demo1234*
ALLOW_CREATE_INSTITUTION=0   # Déjalo en 0 si ya existe la institución 1


# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASS=mon123
DB_NAME=sistema_educativo
DB_PORT=3306

# JWT Configuration
JWT_SECRET="ESTA_ES_UNA_CLAVE_SECRETA_MUY_DIFICIL_DE_ADIVINAR_CAMBIAME"
JWT_EXPIRES_IN="1d"


# Puerto del servidor backend
PORT=4000

# URL base del backend (para links de verificación)
BASE_URL=http://localhost:4000

# Frontend URL (para CORS con Vite)
FRONTEND_URL=http://localhost:5173

## 4) Rutas backend críticas
Auth:
- POST /auth/login (identifier|email + password)
- GET  /auth/profile
Quizzes:
- GET /api/quizzes/public
- GET /api/quizzes/:quizId
- POST /api/quizzes/:quizId/submit
- GET /api/quizzes/me/results
- GET /api/quizzes/resultados
- GET /api/quizzes/analytics
Citas:
- GET /api/citas/requests/open
- GET /api/citas/mine
- GET /api/citas/slots
- POST /api/citas/:id/{claim|release|schedule|status}
- POST /api/citas/slots
- POST /api/citas/slots/:id/book

## 5) Base de datos (resumen)
- Tablas principales: usuarios, usuario_institucion, instituciones, quizzes, preguntas, respuestas_quiz, citas, tutores_alumnos, notificaciones

## 6) Roles y reglas
- SUPER_ADMIN_NACIONAL: Todas las rutas
- SUPER_ADMIN_INSTITUCION / ADMIN_INSTITUCION: Puede hacer lo que quiera pero dentro de su institucion....
- PSICOLOGO / ORIENTADOR: Mas que nada para obetener analiticas y canalizar alumnos, enfasis en las rutas de citas....
- ESTUDIANTE: Perfil, tomas quizzes, agendar cita...
- Reglas especiales: matrícula única por institución, etc.

## 7) Qué funciona hoy
- [x] Login (y como que a medias)
- [x] Quizzes (listar/tomar/enviar) (enviar si)
- [ ] Resultados admin
- [ ] Citas (publicar/listar/reservar/claim/schedule)
- [ ] Altas (institución/admin/tutor/estudiante)

## 8) Errores y bloqueos actuales
- Backend: <mensaje exacto / stacktrace>
- Frontend: <pantalla, ruta, mensaje>

## 9) Prioridades de la semana (en orden)
1. …
2. …
3. …

## 10) Notas
- Navegadores usados, hosting (Railway/Vercel), etc.
