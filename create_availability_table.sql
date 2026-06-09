-- Crear tabla disponibilidad_psicologo si no existe
CREATE TABLE IF NOT EXISTS disponibilidad_psicologo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  psicologoId VARCHAR(255) NOT NULL,
  diaSemana ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO') NOT NULL,
  horaInicio TIME NOT NULL,
  horaFin TIME NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_psicologo (psicologoId),
  INDEX idx_dia (diaSemana),
  INDEX idx_activo (activo),
  FOREIGN KEY (psicologoId) REFERENCES usuarios(id) ON DELETE CASCADE
);