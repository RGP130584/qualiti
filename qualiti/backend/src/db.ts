import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://qualita:qualita_secure_pw@localhost:5432/qualitaos',
});

export default pool;
