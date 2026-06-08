const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const tpmDir = __dirname;
  
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync(path.join(tpmDir, 'node_modules'))) {
    console.log('[TPM Wrapper] Installing TPM dependencies...');
    execSync('npm install', { cwd: tpmDir, stdio: 'inherit' });
  }
  
  console.log('[TPM Wrapper] Running TPM scan via ts-node...');
  execSync('npx ts-node src/index.ts', { cwd: tpmDir, stdio: 'inherit' });
} catch (err) {
  console.error('[TPM Wrapper] Error running TPM:', err);
  process.exit(1);
}
