const { query } = require('../config/database');

async function countActive() {
  const result = await query('SELECT COUNT(*)::int AS total FROM users WHERE is_active = true');
  return result.rows[0].total;
}

async function findAll(filters = {}) {
  const { search, role, departmentId, companyId } = filters;
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(u.name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }

  if (role) {
    values.push(role);
    conditions.push(`u.role = $${values.length}`);
  }

  if (departmentId) {
    values.push(departmentId);
    conditions.push(`u.department_id = $${values.length}`);
  }

  if (companyId) {
    values.push(companyId);
    conditions.push(`u.company_id = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `
      SELECT u.id,
             u.name,
             u.email,
             u.role,
             u.department_id,
             u.company_id,
             u.is_active,
             u.created_at,
             u.updated_at,
             d.name AS department_name,
             c.name AS company_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN companies c ON c.id = u.company_id
      ${whereClause}
      ORDER BY u.created_at DESC
    `,
    values
  );

  return result.rows;
}

async function findById(id) {
  const result = await query(
    `
      SELECT u.id,
             u.name,
             u.email,
             u.role,
             u.department_id,
             u.company_id,
             u.is_active,
             u.created_at,
             u.updated_at,
             d.name AS department_name,
             c.name AS company_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findAuthByEmail(email) {
  const result = await query(
    `
      SELECT id, name, email, password_hash, role, is_active
      FROM users
      WHERE email = $1 AND is_active = true
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findActiveOptions() {
  const result = await query(
    `
      SELECT u.id,
             u.name,
             u.email,
             u.department_id,
             u.company_id,
             d.name AS department_name,
             c.name AS company_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.is_active = true
      ORDER BY u.name ASC
    `
  );

  return result.rows;
}

async function findByEmail(email) {
  const result = await query(
    `
      SELECT id, name, email, role, is_active
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function create(user) {
  const result = await query(
    `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        department_id,
        company_id,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, department_id, company_id, is_active, created_at
    `,
    [
      user.name,
      user.email,
      user.passwordHash,
      user.role || 'user',
      user.departmentId || null,
      user.companyId || null,
      user.isActive ?? true
    ]
  );

  return result.rows[0];
}

async function update(id, user) {
  const result = await query(
    `
      UPDATE users
      SET name = $1,
          email = $2,
          role = $3,
          department_id = $4,
          company_id = $5,
          is_active = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING id, name, email, role, department_id, company_id, is_active, updated_at
    `,
    [
      user.name,
      user.email,
      user.role,
      user.departmentId || null,
      user.companyId || null,
      user.isActive,
      id
    ]
  );

  return result.rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  const result = await query(
    `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `,
    [passwordHash, id]
  );

  return result.rows[0] || null;
}

async function setActive(id, isActive) {
  const result = await query(
    `
      UPDATE users
      SET is_active = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, role, is_active
    `,
    [isActive, id]
  );

  return result.rows[0] || null;
}

module.exports = {
  countActive,
  findAll,
  findById,
  findAuthByEmail,
  findActiveOptions,
  findByEmail,
  create,
  update,
  updatePassword,
  setActive
};
