const fs = require('fs/promises');
const path = require('path');
const Category = require('../models/categoryModel');
const Company = require('../models/companyModel');
const Department = require('../models/departmentModel');
const Document = require('../models/documentModel');
const User = require('../models/userModel');
const { uploadsDir, sanitizeFileName } = require('../middlewares/uploadMiddleware');
const { deleteFileIfExists } = require('../utils/files');
const { getValidationErrors } = require('../utils/validation');

const documentStatuses = [
  'Vigente',
  'Revisión',
  'Creación',
  'Desactualizado',
  'Obsoleto'
];
const documentFormStatuses = documentStatuses.filter((status) => status !== 'Vigente');

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseVisibleUserIds(value) {
  if (!value) {
    return [];
  }

  return [...new Set(
    String(value)
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];
}

function getDocumentReadOptions(req) {
  const currentUser = req.session.user;

  if (currentUser.role === 'admin') {
    return {};
  }

  return {
    visibleToUserId: currentUser.id,
    visibleDocumentStatus: 'Vigente',
    approvalOwnerUserId: currentUser.id
  };
}

async function getDocumentFormCatalogs() {
  const [categories, departments, companies, ownerUsers] = await Promise.all([
    Category.findAll(),
    Department.findAll(),
    Company.findAll(),
    User.findActiveOptions()
  ]);

  return {
    categories,
    departments,
    companies,
    ownerUsers
  };
}

async function renderCreate(res, status, data = {}) {
  const catalogs = await getDocumentFormCatalogs();

  return res.status(status).render('documents/create', {
    title: 'Cargar documento',
    ...catalogs,
    documentStatuses: documentFormStatuses,
    errors: data.errors,
    formData: data.formData || {
      document_date: todayInputValue(),
      document_status: 'Creación',
      visible_user_ids: ''
    }
  });
}

async function renderEdit(res, status, document, data = {}) {
  const catalogs = await getDocumentFormCatalogs();
  const visibleUserIds = document.visible_users
    ? document.visible_users.map((user) => String(user.id)).join(',')
    : '';

  return res.status(status).render('documents/edit', {
    title: 'Editar documento',
    document,
    ...catalogs,
    documentStatuses: documentFormStatuses,
    errors: data.errors,
    formData: data.formData || {
      title: document.title,
      description: document.description,
      document_date: document.document_date?.toISOString
        ? document.document_date.toISOString().slice(0, 10)
        : String(document.document_date || '').slice(0, 10),
      document_status: document.document_status === 'Vigente' ? 'Revisión' : document.document_status,
      owner_user_id: document.owner_user_id,
      visible_user_ids: visibleUserIds,
      category_id: document.category_id,
      department_id: document.department_id,
      company_id: document.company_id
    }
  });
}

async function index(req, res) {
  const currentUser = req.session.user;
  const filters = {
    search: req.query.search || '',
    categoryId: req.query.category_id || '',
    departmentId: req.query.department_id || '',
    companyId: req.query.company_id || '',
    ownerUserId: req.query.owner_user_id || '',
    documentStatus: req.query.document_status || ''
  };
  const documentFilters = currentUser.role === 'admin'
    ? filters
    : { ...filters, documentStatus: 'Vigente', visibleToUserId: currentUser.id };
  const viewFilters = currentUser.role === 'admin'
    ? filters
    : { ...filters, documentStatus: 'Vigente' };

  const [documents, catalogs] = await Promise.all([
    Document.findAll(documentFilters),
    getDocumentFormCatalogs()
  ]);

  return res.render('documents/index', {
    title: 'Documentos',
    documents,
    categories: catalogs.categories,
    departments: catalogs.departments,
    companies: catalogs.companies,
    ownerUsers: catalogs.ownerUsers,
    documentStatuses,
    filters: viewFilters
  });
}

async function showCreate(req, res) {
  return renderCreate(res, 200);
}

async function store(req, res) {
  const errors = getValidationErrors(req);

  if (!req.file) {
    errors.push('Selecciona un archivo permitido.');
  }

  if (errors.length) {
    await deleteFileIfExists(req.file?.path);

    return renderCreate(res, 422, {
      errors,
      formData: req.body
    });
  }

  try {
    await Document.create({
      title: req.body.title,
      description: req.body.description,
      originalFilename: sanitizeFileName(req.file.originalname),
      storedFilename: req.file.filename,
      filePath: `uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      documentDate: req.body.document_date,
      documentStatus: req.body.document_status || 'Creación',
      categoryId: req.body.category_id,
      departmentId: req.body.department_id,
      companyId: req.body.company_id,
      ownerUserId: req.body.owner_user_id,
      visibleUserIds: parseVisibleUserIds(req.body.visible_user_ids),
      uploadedBy: req.session.user.id
    });
  } catch (error) {
    await deleteFileIfExists(req.file.path);

    if (error.code === '23503') {
      return renderCreate(res, 409, {
        errors: ['Selecciona categoria, departamento, empresa, dueño y usuarios de mostrar validos.'],
        formData: req.body
      });
    }

    throw error;
  }

  req.flash('success', 'Documento cargado correctamente.');
  return res.redirect('/documents');
}

async function edit(req, res) {
  const document = await Document.findById(req.params.id);

  if (!document) {
    req.flash('error', 'El documento no existe o fue eliminado.');
    return res.redirect('/documents');
  }

  return renderEdit(res, 200, document);
}

async function update(req, res) {
  const document = await Document.findById(req.params.id);

  if (!document) {
    await deleteFileIfExists(req.file?.path);
    req.flash('error', 'El documento no existe o fue eliminado.');
    return res.redirect('/documents');
  }

  const errors = getValidationErrors(req);

  if (errors.length) {
    await deleteFileIfExists(req.file?.path);

    return renderEdit(res, 422, document, {
      errors,
      formData: req.body
    });
  }

  try {
    const updatedDocument = await Document.update(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      documentDate: req.body.document_date,
      documentStatus: req.body.document_status || 'Creación',
      categoryId: req.body.category_id,
      departmentId: req.body.department_id,
      companyId: req.body.company_id,
      ownerUserId: req.body.owner_user_id,
      visibleUserIds: parseVisibleUserIds(req.body.visible_user_ids),
      originalFilename: req.file ? sanitizeFileName(req.file.originalname) : null,
      storedFilename: req.file?.filename || null,
      filePath: req.file ? `uploads/${req.file.filename}` : null,
      fileType: req.file?.mimetype || null,
      fileSize: req.file?.size || null
    });

    if (!updatedDocument) {
      await deleteFileIfExists(req.file?.path);
      req.flash('error', 'El documento no existe o fue eliminado.');
      return res.redirect('/documents');
    }

    if (updatedDocument.previousStoredFilename) {
      await deleteFileIfExists(path.join(uploadsDir, updatedDocument.previousStoredFilename));
    }
  } catch (error) {
    await deleteFileIfExists(req.file?.path);

    if (error.code === '23503') {
      return renderEdit(res, 409, document, {
        errors: ['Selecciona categoria, departamento, empresa, dueño y usuarios de mostrar validos.'],
        formData: req.body
      });
    }

    throw error;
  }

  req.flash('success', 'Documento actualizado correctamente.');
  return res.redirect(`/documents/${req.params.id}`);
}

async function detail(req, res) {
  const document = await Document.findById(req.params.id, getDocumentReadOptions(req));

  if (!document) {
    req.flash('error', 'El documento no existe o fue eliminado.');
    return res.redirect('/documents');
  }

  return res.render('documents/detail', {
    title: document.title,
    document
  });
}

async function download(req, res, next) {
  const document = await Document.findById(req.params.id, getDocumentReadOptions(req));

  if (!document) {
    req.flash('error', 'El documento no existe o fue eliminado.');
    return res.redirect('/documents');
  }

  const filePath = path.join(uploadsDir, document.stored_filename);

  try {
    await fs.access(filePath);
  } catch (error) {
    req.flash('error', 'El archivo fisico no se encontro en el servidor.');
    return res.redirect(`/documents/${document.id}`);
  }

  return res.download(filePath, document.original_filename, (error) => {
    if (error && !res.headersSent) {
      next(error);
    }
  });
}

async function destroy(req, res) {
  const deleted = await Document.softDelete(req.params.id);

  if (!deleted) {
    req.flash('error', 'No se pudo eliminar el documento solicitado.');
    return res.redirect('/documents');
  }

  req.flash('success', 'Documento eliminado logicamente.');
  return res.redirect('/documents');
}

module.exports = {
  index,
  showCreate,
  store,
  edit,
  update,
  detail,
  download,
  destroy
};
