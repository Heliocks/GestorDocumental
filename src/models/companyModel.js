const { query } = require('../config/database');

async function findAll(options = {}) {
  const includeInactive = options.includeInactive || false;
  const result = await query(
    `
      SELECT c.id,
             c.name,
             c.description,
             c.is_active,
             c.created_at,
             c.updated_at,
             COUNT(u.id)::int AS assigned_users_count
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id
      ${includeInactive ? '' : 'WHERE c.is_active = true'}
      GROUP BY c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at
      ORDER BY c.name ASC
    `
  );

  return result.rows;
}

async function findById(id) {
  const result = await query(
    `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM companies
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function create(company) {
  const result = await query(
    `
      INSERT INTO companies (name, description, is_active)
      VALUES ($1, $2, true)
      RETURNING id, name, description, is_active, created_at
    `,
    [company.name, company.description || null]
  );

  return result.rows[0];
}

async function countAssignedUsers(id) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE company_id = $1
    `,
    [id]
  );

  return result.rows[0].total;
}

async function remove(id) {
  const result = await query(
    `
      DELETE FROM companies
      WHERE id = $1
      RETURNING id, name
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  countAssignedUsers,
  remove
};
