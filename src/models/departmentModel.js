const { query } = require('../config/database');

async function findAll(options = {}) {
  const includeInactive = options.includeInactive || false;
  const result = await query(
    `
      SELECT d.id,
             d.name,
             d.description,
             d.is_active,
             d.created_at,
             d.updated_at,
             COUNT(u.id)::int AS assigned_users_count
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      ${includeInactive ? '' : 'WHERE d.is_active = true'}
      GROUP BY d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at
      ORDER BY d.name ASC
    `
  );

  return result.rows;
}

async function findById(id) {
  const result = await query(
    `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM departments
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function create(department) {
  const result = await query(
    `
      INSERT INTO departments (name, description, is_active)
      VALUES ($1, $2, true)
      RETURNING id, name, description, is_active, created_at
    `,
    [department.name, department.description || null]
  );

  return result.rows[0];
}

async function countAssignedUsers(id) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE department_id = $1
    `,
    [id]
  );

  return result.rows[0].total;
}

async function remove(id) {
  const result = await query(
    `
      DELETE FROM departments
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
