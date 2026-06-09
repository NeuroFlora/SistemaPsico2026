-- SQL script to add onboarding functionality to existing database
-- Run this script to add the missing table and column for onboarding

-- 1. Add perfilCompletado column to usuarios table if it doesn't exist
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS perfilCompletado BOOLEAN DEFAULT FALSE;

-- 2. Create usuario_onboarding table for storing onboarding data
CREATE TABLE IF NOT EXISTS usuario_onboarding (
    id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
    usuarioId VARCHAR(255) NOT NULL,
    objetivos TEXT,
    experienciaPrevia ENUM('nunca', 'poco', 'moderada', 'mucha'),
    expectativas VARCHAR(500),
    notificaciones BOOLEAN DEFAULT TRUE,
    tutorialesAdicionales BOOLEAN DEFAULT FALSE,
    completedAt TIMESTAMP(3) NULL,
    createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    -- Foreign key constraint
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Unique constraint - one onboarding record per user
    UNIQUE KEY unique_user_onboarding (usuarioId)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuario_onboarding_user ON usuario_onboarding(usuarioId);
CREATE INDEX IF NOT EXISTS idx_usuario_onboarding_completed ON usuario_onboarding(completedAt);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_completado ON usuarios(perfilCompletado);

-- 4. Update existing users to mark profile as completed (optional - adjust as needed)
-- Uncomment the next line if you want existing users to skip onboarding
-- UPDATE usuarios SET perfilCompletado = TRUE WHERE createdAt < NOW();

SELECT 'Onboarding database setup completed successfully!' as message;