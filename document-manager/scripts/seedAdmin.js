require('dotenv').config();

const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/config/database');

async function main() {
  const name = process.env.ADMIN_NAME || 'Administrador';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin12345!';

  if (password.length < 8 || password.length > 72) {
    throw new Error('ADMIN_PASSWORD must have between 8 and 72 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await query(
    `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'admin', true)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = 'admin',
        is_active = true,
        updated_at = NOW()
    `,
    [name, email, passwordHash]
  );

  console.log(`Admin user ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
