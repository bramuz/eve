// Script para generar version.json automáticamente
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = {
  version: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  buildDate: new Date().toISOString(),
  timestamp: Date.now()
};

const outputPath = join(__dirname, 'dist', 'version.json');

try {
  writeFileSync(outputPath, JSON.stringify(version, null, 2));
  console.log('✅ version.json generado exitosamente');
  console.log('📦 Versión:', version.version);
} catch (error) {
  console.error('❌ Error generando version.json:', error);
  process.exit(1);
}
