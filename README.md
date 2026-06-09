# SistemaPsico

Plataforma multi-tenant de ayuda psicológica para instituciones educativas. Permite gestionar instituciones, usuarios (estudiantes, psicólogos, orientadores), aplicar quizzes de bienestar, agendar citas y dar seguimiento con roles, autenticación y notificaciones. Este repositorio es el punto de partida limpio ("clean slate") para la siguiente fase del sistema, con enfoque en escalabilidad, modularidad y evolución controlada.

## Visión general

Centralizar y facilitar el flujo de atención psicológica en múltiples instituciones educativas mediante una plataforma extensible que cubra desde la gestión de instituciones y usuarios hasta evaluaciones y citas, con seguimiento seguro y multi-tenant.

## Estructura del repositorio

Es un monorepo con dos partes principales:

1. Backend (en la carpeta `src/`)
   - Archivo `.env` con variables de entorno: conexión a base de datos, JWT, puerto, etc. No debe comitearse.
   - Carpeta `src/` que contiene:
     - `index.js` para arrancar Vite.
     - `routes/` con subdivisiones como `auth.routes.js`, `institucion.routes.js`, `usuario.routes.js`, `quiz.routes.js`, `cita.routes.js`.
     - `controllers/` para la lógica de negocio.
     - `services/` para integraciones externas (correo, WhatsApp, notificaciones).
     - `middlewares/` para autenticación, validaciones y manejo de errores.
   - `package.json` con scripts como dev, prisma:generate, prisma:migrate y seed si aplica.

2. Frontend (en la carpeta `client/`)
   - `vite.config.js` para proxy de desarrollo (redirigir /api al backend).
   - `src/` con:
     - `main.jsx` punto de entrada de React.
     - `App.jsx` layout y rutas.
     - `pages/` como Login, Dashboard, Quizzes y Citas.
     - `components/` reutilizables de UI.
     - `services/` para llamadas a la API.
     - `styles/` (Tailwind u otros).
   - `package.json` con scripts de desarrollo, build y preview.

3. Raíz
   - `package.json` configurado con workspaces para ejecutar backend y frontend en paralelo (scripts como dev:server, dev:client, dev).
   - `.gitignore` para excluir node_modules, .env, etc.

## Prerrequisitos

Tener instalado Node.js v18 o superior, npm, MySQL funcionando (local o remoto), Git y un editor de código (recomendado VS Code).

## Setup inicial (manual recomendado)

1. Clonar el repositorio y entrar a la carpeta: usar el URL del repo y validar que existen las carpetas `src` y `client`.
2. Ejecutar la instalación de dependencias desde la raíz para que se instalen los workspaces.
3. Backend: entrar a la carpeta `src`, correr instalación, crear el archivo .env con la URL de la base de datos, el secret de JWT, expiración y puerto. Crear la base de datos en MySQL si no existe. Generar el cliente de Prisma y aplicar migraciones para que se creen las tablas según el schema. Agregar y ejecutar el seed inicial para tener una institución y super admin si no está ya incluido. Levantar el backend y verificar que el endpoint de instituciones responde.
4. Frontend: entrar a la carpeta `client`, correr instalación. Configurar la forma de consumir la API: si no se usa proxy, definir la variable de entorno de base URL; si se usa proxy, validar que la configuración de Vite redirige /api correctamente. Levantar el frontend y validar en el navegador que puede consumir los endpoints (por ejemplo instituciones).

## Módulos iniciales prioritarios

1. Autenticación: registro, login, JWT, middleware para proteger rutas.  
2. Gestión de instituciones: CRUD completo.  
3. Gestión de usuarios: creación ligada a institución con roles (ESTUDIANTE, PSICOLOGO, ADMIN_INSTITUCION, SUPER_ADMIN_NACIONAL).  
4. Quizzes de bienestar: modelos Quiz y RespuestaQuiz, endpoints de obtención y respuesta, UI para lista y formulario.  
5. Citas: modelo, creación y listado, UI para agendamiento.

Cada módulo debe seguir el patrón: actualizar schema Prisma, correr migración y generar cliente, añadir ruta y controller en el backend, construir la UI correspondiente en el frontend, consumir la API desde React, y aplicar validaciones y notificaciones.

## Comandos clave

Desde la raíz se usa el script que levanta ambos servicios en paralelo. También existen comandos separados para backend y frontend. El backend debe tener un script de desarrollo que arranque con hot reload y los comandos de Prisma para generar cliente y migrar esquema. El frontend debe poder arrancarse y proveer la interfaz consumiendo /api.

## Flujo de contribución

Trabajar en branches por feature con nombres claros, hacer commits descriptivos en presente, abrir pull requests con descripción de qué se hizo y cómo probarlo, y no mergear sin revisión. Nunca subir archivos .env ni secretos.

## Troubleshooting

- Si aparece el error de que @prisma/client no se inicializó, se debe regenerar el cliente de Prisma.  
- Si import/export falla en el backend, validar que esté configurado como ES module en su package.json.  
- Si el frontend no alcanza al backend, revisar la configuración de proxy o la URL base.  
- Validar que MySQL esté corriendo y la cadena de conexión en el .env sea correcta.

## Seguridad

No subir variables sensibles. Validar roles y permisos en backend. Sanitizar entradas. Usar expiración de JWT y HTTPS en entornos de producción.

## Checklist de arranque

- Repo clonado  
- Dependencias instaladas en backend y frontend  
- .env creado con DATABASE_URL y JWT settings  
- Base de datos creada  
- Migraciones aplicadas y cliente Prisma generado  
- Seed inicial ejecutado  
- Backend levantado y responde  
- Frontend levantado y consume la API  
- Autenticación básica funcionando  
- CRUD de instituciones funcionando

## Nota

Se compartirán scripts de automatización como atajo, pero la primera instalación debe hacerse manual para que cada integrante entienda el flujo y pueda depurar más rápido si hay fallos.

