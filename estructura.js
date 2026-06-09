    // Script para generar la estructura de directorios excluyendo carpetas `node_modules`
// Uso: node generar_estructura_sin_node_modules.js [ruta_proyecto] [profundidad]
// Ejemplo: node generar_estructura_sin_node_modules.js . 2 > estructura.txt

const fs = require('fs');
const path = require('path');

/**
 * Recorre y muestra un árbol de directorios hasta cierta profundidad,
 * omitiendo carpetas llamadas 'node_modules'.
 *
 * @param {string} dir - Directorio a procesar
 * @param {string} prefix - Prefijo para formato de árbol
 * @param {number} depth - Profundidad restante
 */
function tree(dir, prefix = '', depth = 2) {
  if (depth < 0) return;
  let items;
  try {
    items = fs.readdirSync(dir).filter(item => item !== 'node_modules');
  } catch (err) {
    return;
  }

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    process.stdout.write(prefix + pointer + item + '\n');

    if (fs.statSync(fullPath).isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      tree(fullPath, newPrefix, depth - 1);
    }
  });
}

// --- Entry Point ---
const args = process.argv.slice(2);
const rootDir = args[0] || '.';
const maxDepth = parseInt(args[1], 10) || 2;

tree(rootDir, '', maxDepth);
