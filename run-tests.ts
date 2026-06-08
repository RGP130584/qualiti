import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

try {
  console.log('Running test suite in app/backend...');
  
  // Read root .env and parse env vars
  const env: Record<string, string> = { ...process.env };
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = match[2] ? match[2].trim() : '';
          // Remove quotes if any
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          env[key] = val;
        }
      }
    }
  }

  // Check if running inside Docker container
  const isDocker = fs.existsSync('/.dockerenv');

  // If DATABASE_URL points to shared-postgres, map it to 127.0.0.1 ONLY if we are NOT running inside docker
  if (env.DATABASE_URL && env.DATABASE_URL.includes('@shared-postgres:')) {
    if (!isDocker) {
      env.DATABASE_URL = env.DATABASE_URL.replace('@shared-postgres:', '@127.0.0.1:');
    }
  } else if (!env.DATABASE_URL) {
    env.DATABASE_URL = isDocker 
      ? 'postgres://qualita:qualita_secure_pw@shared-postgres:5432/qualitaos'
      : 'postgres://qualita:qualita_secure_pw@127.0.0.1:5432/qualitaos';
  }

  execSync('npx tsx src/tests/run-tests.ts', {
    cwd: 'app/backend',
    stdio: 'inherit',
    env
  });
} catch (err) {
  console.error('Error running test suite:', err);
  process.exit(1);
}
