const { spawn } = require('child_process');

console.log('===================================================');
console.log(' Iniciando QualitaOS App (Backend + Frontend)...   ');
console.log('===================================================');

const backend = spawn('node', ['backend/dist/index.js'], { 
  env: { ...process.env, PORT: '3001' },
  stdio: 'inherit' 
});
const frontend = spawn('npm', ['start', '--prefix', 'frontend'], { 
  env: { ...process.env, PORT: '3000' },
  stdio: 'inherit' 
});

backend.on('close', (code) => {
  console.log(`Backend encerrou com código ${code}`);
});

frontend.on('close', (code) => {
  console.log(`Frontend encerrou com código ${code}`);
});

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit();
});
