import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('connect', (client) => {
  client.query('SET search_path TO marketplace, public');
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT current_schema()');
    console.log('Current schema:', res.rows[0]);
    
    // Check if we can select from User
    const users = await client.query('SELECT count(*) FROM "User"');
    console.log('Users count:', users.rows[0]);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
main();
