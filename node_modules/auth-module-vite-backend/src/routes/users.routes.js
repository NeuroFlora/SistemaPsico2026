const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { authenticateToken } = require("../middlewares/auth.middleware");
const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Middleware to ensure admin roles for institution
const ensureInstitucionAdmin = (req, res, next) => {
  const userRoles = (req.user?.instituciones || []).map(inst => inst.rol);
  const adminRoles = ['ADMIN_INSTITUCION', 'SUPER_ADMIN_INSTITUCION', 'SUPER_ADMIN_NACIONAL'];

  if (!userRoles.some(role => adminRoles.includes(role))) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Requiere permisos de administrador."
    });
  }
  next();
};

// Get current user's institution
const getCurrentInstitution = (req) => {
  const instituciones = req.user?.instituciones || [];
  // Try to find the first institution (for now, since users typically belong to one institution)
  return instituciones[0]?.institucionId || null;
};

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images/');
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// GET /users - Get all users for the institution
router.get("/", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  try {
    const institucionId = getCurrentInstitution(req);
    if (!institucionId) {
      return res.status(400).json({
        success: false,
        message: "No se pudo determinar la institución"
      });
    }

    const { role, status, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = ["ui.institucionId = ?"];
    let params = [institucionId];

    if (role) {
      whereConditions.push("ui.rolInstitucion = ?");
      params.push(role);
    }

    if (status) {
      whereConditions.push("u.status = ?");
      params.push(status);
    }

    if (search) {
      whereConditions.push("(u.nombreCompleto LIKE ? OR u.email LIKE ? OR u.matricula LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM usuario_institucion ui
       JOIN usuarios u ON ui.usuarioId = u.id
       WHERE ${whereClause}`,
      params
    );

    // Get users with pagination
    const [users] = await pool.execute(
      `SELECT
         u.id,
         u.nombre,
         u.apellidoPaterno,
         u.apellidoMaterno,
         u.nombreCompleto,
         u.email,
         u.matricula,
         u.numeroEmpleado,
         u.status,
         u.emailVerificado,
         u.createdAt,
         u.lastLogin,
         ui.rolInstitucion as rol,
         ui.activo as membershipActiva,
         c.nombre as carreraNombre
       FROM usuario_institucion ui
       JOIN usuarios u ON ui.usuarioId = u.id
       LEFT JOIN carreras c ON u.carreraId = c.id
       WHERE ${whereClause}
       ORDER BY u.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// GET /users/:id - Get specific user
router.get("/:id", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const institucionId = getCurrentInstitution(req);

    const [users] = await pool.execute(
      `SELECT
         u.*,
         ui.rolInstitucion as rol,
         ui.activo as membershipActiva,
         c.nombre as carreraNombre,
         i.nombre as institucionNombre
       FROM usuario_institucion ui
       JOIN usuarios u ON ui.usuarioId = u.id
       JOIN instituciones i ON ui.institucionId = i.id
       LEFT JOIN carreras c ON u.carreraId = c.id
       WHERE u.id = ? AND ui.institucionId = ?`,
      [id, institucionId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Remove sensitive data
    const user = users[0];
    delete user.passwordHash;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// POST /users - Create new user
router.post("/", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const institucionId = getCurrentInstitution(req);
    if (!institucionId) {
      return res.status(400).json({
        success: false,
        message: "No se pudo determinar la institución"
      });
    }

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      password,
      rol,
      matricula,
      numeroEmpleado,
      carreraId
    } = req.body;

    // Validate required fields
    if (!nombre || !apellidoPaterno || !email || !password || !rol) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios"
      });
    }

    // Check if email exists
    const [existingUser] = await conn.execute(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario con ese email"
      });
    }

    // Check if matricula exists (if provided)
    if (matricula) {
      const [existingMatricula] = await conn.execute(
        "SELECT id FROM usuarios WHERE matricula = ? AND id IN (SELECT usuarioId FROM usuario_institucion WHERE institucionId = ?)",
        [matricula, institucionId]
      );

      if (existingMatricula.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un usuario con esa matrícula"
        });
      }
    }

    const userId = require("crypto").randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const nombreCompleto = `${nombre} ${apellidoPaterno}${apellidoMaterno ? " " + apellidoMaterno : ""}`;

    // Create user
    await conn.execute(
      `INSERT INTO usuarios
       (id, carreraId, email, emailVerificado, passwordHash,
        nombre, apellidoPaterno, apellidoMaterno, nombreCompleto,
        matricula, numeroEmpleado, status, requiereCambioPassword,
        perfilCompletado, createdAt, updatedAt)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', 1, 0, NOW(), NOW())`,
      [
        userId,
        carreraId || null,
        email,
        passwordHash,
        nombre,
        apellidoPaterno,
        apellidoMaterno || null,
        nombreCompleto,
        matricula || null,
        numeroEmpleado || null
      ]
    );

    // Create institution membership
    await conn.execute(
      `INSERT INTO usuario_institucion (usuarioId, institucionId, rolInstitucion, activo)
       VALUES (?, ?, ?, 1)`,
      [userId, institucionId, rol]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: {
        id: userId,
        nombreCompleto,
        email,
        rol
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
});

// PUT /users/:id - Update user
router.put("/:id", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const institucionId = getCurrentInstitution(req);

    // Verify user belongs to institution
    const [userCheck] = await conn.execute(
      `SELECT u.id FROM usuarios u
       JOIN usuario_institucion ui ON u.id = ui.usuarioId
       WHERE u.id = ? AND ui.institucionId = ?`,
      [id, institucionId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      rol,
      matricula,
      numeroEmpleado,
      carreraId,
      status
    } = req.body;

    const updateFields = [];
    const updateParams = [];

    if (nombre) {
      updateFields.push("nombre = ?");
      updateParams.push(nombre);
    }
    if (apellidoPaterno) {
      updateFields.push("apellidoPaterno = ?");
      updateParams.push(apellidoPaterno);
    }
    if (apellidoMaterno !== undefined) {
      updateFields.push("apellidoMaterno = ?");
      updateParams.push(apellidoMaterno);
    }
    if (email) {
      updateFields.push("email = ?");
      updateParams.push(email);
    }
    if (matricula !== undefined) {
      updateFields.push("matricula = ?");
      updateParams.push(matricula);
    }
    if (numeroEmpleado !== undefined) {
      updateFields.push("numeroEmpleado = ?");
      updateParams.push(numeroEmpleado);
    }
    if (carreraId !== undefined) {
      updateFields.push("carreraId = ?");
      updateParams.push(carreraId);
    }
    if (status) {
      updateFields.push("status = ?");
      updateParams.push(status);
    }

    if (nombre && apellidoPaterno) {
      const nombreCompleto = `${nombre} ${apellidoPaterno}${apellidoMaterno ? " " + apellidoMaterno : ""}`;
      updateFields.push("nombreCompleto = ?");
      updateParams.push(nombreCompleto);
    }

    updateFields.push("updatedAt = NOW()");
    updateParams.push(id);

    if (updateFields.length > 1) { // More than just updatedAt
      await conn.execute(
        `UPDATE usuarios SET ${updateFields.join(", ")} WHERE id = ?`,
        updateParams
      );
    }

    // Update role if provided
    if (rol) {
      await conn.execute(
        `UPDATE usuario_institucion SET rolInstitucion = ?
         WHERE usuarioId = ? AND institucionId = ?`,
        [rol, id, institucionId]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente"
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
});

// DELETE /users/:id - Deactivate user (soft delete)
router.delete("/:id", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const institucionId = getCurrentInstitution(req);

    // Verify user belongs to institution and is not the current user
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "No puedes desactivar tu propia cuenta"
      });
    }

    const [userCheck] = await pool.execute(
      `SELECT u.id FROM usuarios u
       JOIN usuario_institucion ui ON u.id = ui.usuarioId
       WHERE u.id = ? AND ui.institucionId = ?`,
      [id, institucionId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Deactivate membership instead of deleting user
    await pool.execute(
      `UPDATE usuario_institucion SET activo = 0
       WHERE usuarioId = ? AND institucionId = ?`,
      [id, institucionId]
    );

    res.json({
      success: true,
      message: "Usuario desactivado exitosamente"
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// POST /users/:id/activate - Reactivate user
router.post("/:id/activate", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const institucionId = getCurrentInstitution(req);

    const [userCheck] = await pool.execute(
      `SELECT u.id FROM usuarios u
       JOIN usuario_institucion ui ON u.id = ui.usuarioId
       WHERE u.id = ? AND ui.institucionId = ?`,
      [id, institucionId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    await pool.execute(
      `UPDATE usuario_institucion SET activo = 1
       WHERE usuarioId = ? AND institucionId = ?`,
      [id, institucionId]
    );

    res.json({
      success: true,
      message: "Usuario reactivado exitosamente"
    });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

// POST /users/upload-photo - Upload user photo
router.post("/upload-photo", authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const usuarioId = req.user.id;
    const { descripcion, tags } = req.body;

    // Save file info to database
    const [result] = await pool.execute(
      `INSERT INTO archivos (id, usuarioId, nombre, nombreOriginal, tipo, mimeType, tamaño, url, descripcion, tags, esPublico, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        uuidv4(),
        usuarioId,
        req.file.filename,
        req.file.originalname,
        'IMAGEN',
        req.file.mimetype,
        req.file.size,
        `/uploads/images/${req.file.filename}`,
        descripcion || null,
        tags || null,
        false
      ]
    );

    const archivo = {
      id: result.insertId,
      url: `/uploads/images/${req.file.filename}`,
      nombre: req.file.originalname,
      tipo: 'IMAGEN'
    };

    console.log('✅ Photo uploaded successfully:', archivo);

    res.json({
      success: true,
      message: 'Foto subida exitosamente',
      archivo
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /users/stats - Get user statistics for the institution
router.get("/stats/overview", authenticateToken, ensureInstitucionAdmin, async (req, res) => {
  try {
    const institucionId = getCurrentInstitution(req);

    const [stats] = await pool.execute(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN ui.rolInstitucion = 'ESTUDIANTE' THEN 1 END) as estudiantes,
         COUNT(CASE WHEN ui.rolInstitucion = 'PSICOLOGO' THEN 1 END) as psicologos,
         COUNT(CASE WHEN ui.rolInstitucion = 'ORIENTADOR' THEN 1 END) as orientadores,
         COUNT(CASE WHEN ui.rolInstitucion = 'ADMIN_INSTITUCION' THEN 1 END) as admins,
         COUNT(CASE WHEN ui.activo = 1 THEN 1 END) as activos,
         COUNT(CASE WHEN ui.activo = 0 THEN 1 END) as inactivos,
         COUNT(CASE WHEN u.lastLogin >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as activosUltimos30Dias
       FROM usuario_institucion ui
       JOIN usuarios u ON ui.usuarioId = u.id
       WHERE ui.institucionId = ?`,
      [institucionId]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
});

module.exports = router;