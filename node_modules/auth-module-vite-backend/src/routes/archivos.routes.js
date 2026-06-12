const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Configure multer for file uploads
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

// Upload photo route
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const { usuarioId, descripcion, tags } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: 'usuarioId es requerido' });
    }

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

    res.json({
      success: true,
      message: 'Archivo subido exitosamente',
      archivo: {
        id: archivo.id,
        url: archivo.url,
        nombre: archivo.nombreOriginal,
        tipo: archivo.tipo
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get user files
router.get('/user/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [archivos] = await pool.execute(
      'SELECT * FROM archivos WHERE usuarioId = ? ORDER BY createdAt DESC',
      [usuarioId]
    );

    res.json(archivos);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;