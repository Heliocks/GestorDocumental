require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');

function quoteIdentifier(identifier) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid PostgreSQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function createClient(database) {
  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
}

async function ensureDatabase() {
  const dbName = process.env.DB_NAME;
  const adminClient = createClient('postgres');

  await adminClient.connect();

  const exists = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );

  if (!exists.rowCount) {
    await adminClient.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
    console.log(`Database created: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }

  await adminClient.end();
}

async function applySchema() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const client = createClient(process.env.DB_NAME);

  await client.connect();
  await client.query(schema);
  await client.end();

  console.log('Schema applied from sql/schema.sql');
}

async function main() {
  await ensureDatabase();
  await applySchema();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
