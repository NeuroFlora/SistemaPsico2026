require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

const fixPasswords = async () => {
  try {
    console.log('🔧 Actualizando contraseñas de usuarios...');
    
    const password = 'Password123!';
    const correctHash = await bcrypt.hash(password, 12);
    
    console.log(`🔑 Nueva contraseña: ${password}`);
    console.log(`🔒 Nuevo hash: ${correctHash.substring(0, 30)}...`);
    
    // Obtener todos los usuarios de prueba
    const [users] = await pool.execute(
      'SELECT id, email, rol FROM usuarios WHERE email IN (?, ?, ?, ?)',
      [
        'superadmin@sistema.com',
        'admin@une.edu', 
        'psicologo@une.edu',
        'estudiante@une.edu'
      ]
    );
    
    console.log(`\n📋 Actualizando ${users.length} usuarios:`);
    
    // Actualizar contraseña para cada usuario
    for (const user of users) {
      await pool.execute(
        'UPDATE usuarios SET passwordHash = ?, updatedAt = NOW() WHERE id = ?',
        [correctHash, user.id]
      );
      
      console.log(`✅ ${user.email} [${user.rol}] - Contraseña actualizada`);
    }
    
    console.log('\n🎉 ¡Todas las contraseñas actualizadas correctamente!');
    console.log('\n📝 Credenciales actualizadas:');
    console.log(`Contraseña: ${password}`);
    console.log('- superadmin@sistema.com');
    console.log('- admin@une.edu'); 
    console.log('- psicologo@une.edu');
    console.log('- estudiante@une.edu');
    
    // Verificar que funcionan
    console.log('\n🧪 Verificando contraseñas...');
    
    for (const user of users) {
      const [updated] = await pool.execute(
        'SELECT passwordHash FROM usuarios WHERE id = ?',
        [user.id]
      );
      
      const isValid = await bcrypt.compare(password, updated[0].passwordHash);
      console.log(`${isValid ? '✅' : '❌'} ${user.email}: ${isValid ? 'OK' : 'FALLO'}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error actualizando contraseñas:', error);
    process.exit(1);
  }
};

fixPasswords();