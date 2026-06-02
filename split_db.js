const fs = require('fs');

const file = fs.readFileSync('qualiti/backend/src/db.ts', 'utf8');
const lines = file.split('\n');

let dbLines = [];
let initDbLines = [];
let captureInit = false;

initDbLines.push("import pool from '../db';");

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('export async function initDb() {')) {
    captureInit = true;
    initDbLines.push("import { initOnaTables } from '../modules/ona/models';");
    initDbLines.push("import { seedOnaModule } from '../modules/ona/seeds';");
    initDbLines.push("import { initCoreTables } from '../modules/core/models';");
    initDbLines.push("import { seedCoreModule } from '../modules/core/seeds';");
    initDbLines.push("import { TODOS_DOCUMENTOS_69 } from '../modules/core/documentosData';");
    initDbLines.push("import bcrypt from 'bcryptjs';");
    initDbLines.push("");
    initDbLines.push(line);
    continue;
  }

  if (captureInit) {
    if (line === 'export default pool;') {
      captureInit = false;
      dbLines.push(line);
    } else {
      initDbLines.push(line);
    }
  } else {
    // Keep only imports related to pool creation for the lean db.ts
    if (!line.includes('import { initOnaTables') &&
        !line.includes('import { seedOnaModule') &&
        !line.includes('import { initCoreTables') &&
        !line.includes('import { seedCoreModule') &&
        !line.includes('import { TODOS_DOCUMENTOS_69') &&
        !line.includes('import bcrypt from')) {
      dbLines.push(line);
    }
  }
}

fs.writeFileSync('qualiti/backend/src/scripts/init_db.ts', initDbLines.join('\n'));
fs.writeFileSync('qualiti/backend/src/db.ts', dbLines.join('\n').trim() + '\n');
console.log('Split done!');
