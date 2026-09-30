// Script para generar version.json después del build
const fs = require('fs');
const path = require('path');

const version = {
  version: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  buildDate: new Date().toISOString(),
  timestamp: Date.now()
};

const outputPath = path.join(__dirname, 'dist', 'version.json');

try {
  // Asegurarse de que el directorio dist existe
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('⚠️ Directorio dist no existe aún');
    process.exit(0);
  }

  fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));
  console.log('✅ version.json generado exitosamente');
  console.log('📦 Versión:', version.version);
  console.log('📅 Fecha:', version.buildDate);
} catch (error) {
  console.error('❌ Error generando version.json:', error);
  // No fallar el build si esto falla
  process.exit(0);
}
