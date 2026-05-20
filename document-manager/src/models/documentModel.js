const { pool, query } = require('../config/database');

async function countActive(options = {}) {
  const { visibleToUserId, documentStatus } = options;
  const values = [];
  const conditions = ['d.is_active = true'];

  if (documentStatus) {
    values.push(documentStatus);
    conditions.push(`d.document_status = $${values.length}`);
  }

  if (visibleToUserId) {
    values.push(visibleToUserId);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM document_visible_users access_dvu
        WHERE access_dvu.document_id = d.id
          AND access_dvu.user_id = $${values.length}
      )
    `);
  }

  const result = await query(
    `SELECT COUNT(*)::int AS total FROM documents d WHERE ${conditions.join(' AND ')}`,
    values
  );
  return result.rows[0].total;
}

async function countVisibleCategories(userId, options = {}) {
  const values = [userId];
  const conditions = [
    'd.is_active = true',
    'dvu.user_id = $1'
  ];

  if (options.documentStatus) {
    values.push(options.documentStatus);
    conditions.push(`d.document_status = $${values.length}`);
  }

  const result = await query(
    `
      SELECT COUNT(DISTINCT d.category_id)::int AS total
      FROM documents d
      JOIN document_visible_users dvu ON dvu.document_id = d.id
      WHERE ${conditions.join(' AND ')}
    `,
    values
  );

  return result.rows[0].total;
}

async function countVisibleOwners(userId, options = {}) {
  const values = [userId];
  const conditions = [
    'd.is_active = true',
    'dvu.user_id = $1',
    'd.owner_user_id IS NOT NULL'
  ];

  if (options.documentStatus) {
    values.push(options.documentStatus);
    conditions.push(`d.document_status = $${values.length}`);
  }

  const result = await query(
    `
      SELECT COUNT(DISTINCT d.owner_user_id)::int AS total
      FROM documents d
      JOIN document_visible_users dvu ON dvu.document_id = d.id
      WHERE ${conditions.join(' AND ')}
    `,
    values
  );

  return result.rows[0].total;
}

async function recent(limit = 5, options = {}) {
  const { visibleToUserId, documentStatus } = options;
  const values = [limit];
  const conditions = ['d.is_active = true'];

  if (documentStatus) {
    values.push(documentStatus);
    conditions.push(`d.document_status = $${values.length}`);
  }

  if (visibleToUserId) {
    values.push(visibleToUserId);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM document_visible_users access_dvu
        WHERE access_dvu.document_id = d.id
          AND access_dvu.user_id = $${values.length}
      )
    `);
  }

  const result = await query(
    `
      SELECT d.id,
             d.title,
             d.original_filename,
             d.file_type,
             d.file_size,
             d.document_date,
             d.document_status,
             d.created_at,
             c.name AS category_name,
             owner.name AS owner_user_name,
             owner.email AS owner_user_email,
             uploader.name AS uploaded_by_name,
             COALESCE(visible.visible_users_count, 0) AS visible_users_count
      FROM documents d
      LEFT JOIN categories c ON c.id = d.category_id
      LEFT JOIN users owner ON owner.id = d.owner_user_id
      LEFT JOIN users uploader ON uploader.id = d.uploaded_by
      LEFT JOIN (
        SELECT document_id, COUNT(*)::int AS visible_users_count
        FROM document_visible_users
        GROUP BY document_id
      ) visible ON visible.document_id = d.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.document_date DESC, d.created_at DESC
      LIMIT $1
    `,
    values
  );

  return result.rows;
}

async function findAll(filters = {}) {
  const {
    search,
    categoryId,
    departmentId,
    companyId,
    ownerUserId,
    documentStatus,
    visibleToUserId
  } = filters;
  const values = [];
  const conditions = ['d.is_active = true'];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`d.title ILIKE $${values.length}`);
  }

  if (categoryId) {
    values.push(categoryId);
    conditions.push(`d.category_id = $${values.length}`);
  }

  if (departmentId) {
    values.push(departmentId);
    conditions.push(`d.department_id = $${values.length}`);
  }

  if (companyId) {
    values.push(companyId);
    conditions.push(`d.company_id = $${values.length}`);
  }

  if (ownerUserId) {
    values.push(ownerUserId);
    conditions.push(`d.owner_user_id = $${values.length}`);
  }

  if (documentStatus) {
    values.push(documentStatus);
    conditions.push(`d.document_status = $${values.length}`);
  }

  if (visibleToUserId) {
    values.push(visibleToUserId);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM document_visible_users access_dvu
        WHERE access_dvu.document_id = d.id
          AND access_dvu.user_id = $${values.length}
      )
    `);
  }

  const result = await query(
    `
      SELECT d.id,
             d.title,
             d.description,
             d.original_filename,
             d.stored_filename,
             d.file_path,
             d.file_type,
             d.file_size,
             d.document_date,
             d.document_status,
             d.category_id,
             d.department_id,
             d.company_id,
             d.owner_user_id,
             d.uploaded_by,
             d.is_active,
             d.created_at,
             d.updated_at,
             c.name AS category_name,
             dep.name AS department_name,
             comp.name AS company_name,
             owner.name AS owner_user_name,
             owner.email AS owner_user_email,
             uploader.name AS uploaded_by_name,
             COALESCE(visible.visible_users_count, 0) AS visible_users_count
      FROM documents d
      LEFT JOIN categories c ON c.id = d.category_id
      LEFT JOIN departments dep ON dep.id = d.department_id
      LEFT JOIN companies comp ON comp.id = d.company_id
      LEFT JOIN users owner ON owner.id = d.owner_user_id
      LEFT JOIN users uploader ON uploader.id = d.uploaded_by
      LEFT JOIN (
        SELECT document_id, COUNT(*)::int AS visible_users_count
        FROM document_visible_users
        GROUP BY document_id
      ) visible ON visible.document_id = d.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.document_date DESC, d.created_at DESC
    `,
    values
  );

  return result.rows;
}

async function findById(id, options = {}) {
  const { visibleToUserId, approvalOwnerUserId, visibleDocumentStatus } = options;
  const values = [id];
  const conditions = ['d.id = $1', 'd.is_active = true'];

  if (visibleToUserId && approvalOwnerUserId) {
    values.push(visibleToUserId);
    const visibleParam = values.length;
    let visibleStatusCondition = '';

    if (visibleDocumentStatus) {
      values.push(visibleDocumentStatus);
      visibleStatusCondition = `AND d.document_status = $${values.length}`;
    }

    values.push(approvalOwnerUserId);
    const ownerParam = values.length;
    conditions.push(`
      (
        EXISTS (
          SELECT 1
          FROM document_visible_users access_dvu
          WHERE access_dvu.document_id = d.id
            AND access_dvu.user_id = $${visibleParam}
        )
        ${visibleStatusCondition}
        OR (
          d.owner_user_id = $${ownerParam}
          AND d.document_status = 'Revisión'
        )
      )
    `);
  } else if (visibleToUserId) {
    values.push(visibleToUserId);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM document_visible_users access_dvu
        WHERE access_dvu.document_id = d.id
          AND access_dvu.user_id = $${values.length}
      )
    `);

    if (visibleDocumentStatus) {
      values.push(visibleDocumentStatus);
      conditions.push(`d.document_status = $${values.length}`);
    }
  } else if (approvalOwnerUserId) {
    values.push(approvalOwnerUserId);
    conditions.push(`d.owner_user_id = $${values.length} AND d.document_status = 'Revisión'`);
  }

  const result = await query(
    `
      SELECT d.id,
             d.title,
             d.description,
             d.original_filename,
             d.stored_filename,
             d.file_path,
             d.file_type,
             d.file_size,
             d.document_date,
             d.document_status,
             d.category_id,
             d.department_id,
             d.company_id,
             d.owner_user_id,
             d.uploaded_by,
             d.is_active,
             d.created_at,
             d.updated_at,
             c.name AS category_name,
             dep.name AS department_name,
             comp.name AS company_name,
             owner.name AS owner_user_name,
             owner.email AS owner_user_email,
             uploader.name AS uploaded_by_name,
             COALESCE(visible.visible_users, '[]'::json) AS visible_users
      FROM documents d
      LEFT JOIN categories c ON c.id = d.category_id
      LEFT JOIN departments dep ON dep.id = d.department_id
      LEFT JOIN companies comp ON comp.id = d.company_id
      LEFT JOIN users owner ON owner.id = d.owner_user_id
      LEFT JOIN users uploader ON uploader.id = d.uploaded_by
      LEFT JOIN (
        SELECT dvu.document_id,
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email
                 )
                 ORDER BY u.name ASC
               ) AS visible_users
        FROM document_visible_users dvu
        JOIN users u ON u.id = dvu.user_id
        GROUP BY dvu.document_id
      ) visible ON visible.document_id = d.id
      WHERE ${conditions.join(' AND ')}
    `,
    values
  );

  return result.rows[0] || null;
}

async function findPendingApprovalsByOwner(ownerUserId) {
  const values = [];
  const conditions = [
    'd.is_active = true',
    "d.document_status = 'Revisión'"
  ];

  if (ownerUserId) {
    values.push(ownerUserId);
    conditions.push(`d.owner_user_id = $${values.length}`);
  }

  const result = await query(
    `
      SELECT d.id,
             d.title,
             d.description,
             d.original_filename,
             d.file_type,
             d.file_size,
             d.document_date,
             d.document_status,
             d.created_at,
             c.name AS category_name,
             dep.name AS department_name,
             comp.name AS company_name,
             owner.name AS owner_user_name,
             owner.email AS owner_user_email,
             uploader.name AS uploaded_by_name
      FROM documents d
      LEFT JOIN categories c ON c.id = d.category_id
      LEFT JOIN departments dep ON dep.id = d.department_id
      LEFT JOIN companies comp ON comp.id = d.company_id
      LEFT JOIN users owner ON owner.id = d.owner_user_id
      LEFT JOIN users uploader ON uploader.id = d.uploaded_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.document_date ASC, d.created_at ASC
    `,
    values
  );

  return result.rows;
}

async function create(document) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
        INSERT INTO documents (
          title,
          description,
          original_filename,
          stored_filename,
          file_path,
          file_type,
          file_size,
          document_date,
          document_status,
          category_id,
          department_id,
          company_id,
          owner_user_id,
          uploaded_by,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
        RETURNING id, title, document_date, document_status, created_at
      `,
      [
        document.title,
        document.description || null,
        document.originalFilename,
        document.storedFilename,
        document.filePath,
        document.fileType,
        document.fileSize,
        document.documentDate,
        document.documentStatus,
        document.categoryId,
        document.departmentId,
        document.companyId,
        document.ownerUserId,
        document.uploadedBy
      ]
    );

    const createdDocument = result.rows[0];

    const visibleUserIds = document.visibleUserIds || [];

    if (visibleUserIds.length) {
      await client.query(
        `
          INSERT INTO document_visible_users (document_id, user_id)
          SELECT $1, UNNEST($2::bigint[])
          ON CONFLICT (document_id, user_id) DO NOTHING
        `,
        [createdDocument.id, visibleUserIds]
      );
    }

    await client.query('COMMIT');
    return createdDocument;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function update(id, document) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query(
      `
        SELECT id, stored_filename
        FROM documents
        WHERE id = $1 AND is_active = true
        FOR UPDATE
      `,
      [id]
    );

    if (!currentResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const currentDocument = currentResult.rows[0];
    const hasNewFile = Boolean(document.storedFilename);

    const result = await client.query(
      `
        UPDATE documents
        SET title = $1,
            description = $2,
            document_date = $3,
            document_status = $4,
            category_id = $5,
            department_id = $6,
            company_id = $7,
            owner_user_id = $8,
            original_filename = CASE WHEN $9::boolean THEN $10 ELSE original_filename END,
            stored_filename = CASE WHEN $9::boolean THEN $11 ELSE stored_filename END,
            file_path = CASE WHEN $9::boolean THEN $12 ELSE file_path END,
            file_type = CASE WHEN $9::boolean THEN $13 ELSE file_type END,
            file_size = CASE WHEN $9::boolean THEN $14 ELSE file_size END,
            updated_at = NOW()
        WHERE id = $15 AND is_active = true
        RETURNING id, title, stored_filename, document_date, document_status, updated_at
      `,
      [
        document.title,
        document.description || null,
        document.documentDate,
        document.documentStatus,
        document.categoryId,
        document.departmentId,
        document.companyId,
        document.ownerUserId,
        hasNewFile,
        document.originalFilename || null,
        document.storedFilename || null,
        document.filePath || null,
        document.fileType || null,
        document.fileSize || null,
        id
      ]
    );

    const updatedDocument = result.rows[0];

    await client.query('DELETE FROM document_visible_users WHERE document_id = $1', [id]);

    const visibleUserIds = document.visibleUserIds || [];

    if (visibleUserIds.length) {
      await client.query(
        `
          INSERT INTO document_visible_users (document_id, user_id)
          SELECT $1, UNNEST($2::bigint[])
          ON CONFLICT (document_id, user_id) DO NOTHING
        `,
        [id, visibleUserIds]
      );
    }

    await client.query('COMMIT');
    return {
      ...updatedDocument,
      previousStoredFilename: hasNewFile ? currentDocument.stored_filename : null
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateApprovalStatus(id, ownerUserId, documentStatus) {
  const result = await query(
    `
      UPDATE documents
      SET document_status = $3,
          updated_at = NOW()
      WHERE id = $1
        AND ($2::bigint IS NULL OR owner_user_id = $2)
        AND document_status = 'Revisión'
        AND is_active = true
      RETURNING id, title, document_status
    `,
    [id, ownerUserId || null, documentStatus]
  );

  return result.rows[0] || null;
}

async function softDelete(id) {
  const result = await query(
    `
      UPDATE documents
      SET is_active = false,
          updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  countActive,
  countVisibleCategories,
  countVisibleOwners,
  recent,
  findAll,
  findById,
  findPendingApprovalsByOwner,
  create,
  update,
  updateApprovalStatus,
  softDelete
};
