const { query } = require('../config/database');

async function countActive() {
  const result = await query('SELECT COUNT(*)::int AS total FROM categories WHERE is_active = true');
  return result.rows[0].total;
}

async function findAll(options = {}) {
  const includeInactive = options.includeInactive || false;
  const result = await query(
    `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      ${includeInactive ? '' : 'WHERE is_active = true'}
      ORDER BY name ASC
    `
  );

  return result.rows;
}

async function findById(id) {
  const result = await query(
    `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function create(category) {
  const result = await query(
    `
      INSERT INTO categories (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, is_active, created_at
    `,
    [
      category.name,
      category.description || null,
      category.isActive ?? true
    ]
  );

  return result.rows[0];
}

async function update(id, category) {
  const result = await query(
    `
      UPDATE categories
      SET name = $1,
          description = $2,
          is_active = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, description, is_active, updated_at
    `,
    [
      category.name,
      category.description || null,
      category.isActive,
      id
    ]
  );

  return result.rows[0] || null;
}

async function setActive(id, isActive) {
  const result = await query(
    `
      UPDATE categories
      SET is_active = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, description, is_active
    `,
    [isActive, id]
  );

  return result.rows[0] || null;
}

module.exports = {
  countActive,
  findAll,
  findById,
  create,
  update,
  setActive
};
