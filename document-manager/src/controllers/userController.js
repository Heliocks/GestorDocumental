const bcrypt = require('bcryptjs');
const Company = require('../models/companyModel');
const Department = require('../models/departmentModel');
const User = require('../models/userModel');
const { getValidationErrors } = require('../utils/validation');

function optionalCatalogId(value) {
  return value ? Number(value) : null;
}

async function getCatalogs(options = { includeInactive: true }) {
  const [departments, companies] = await Promise.all([
    Department.findAll(options),
    Company.findAll(options)
  ]);

  return { departments, companies };
}

async function renderCreate(res, status, data = {}) {
  const catalogs = await getCatalogs();

  return res.status(status).render('users/create', {
    title: 'Nuevo usuario',
    departments: catalogs.departments,
    companies: catalogs.companies,
    formData: data.formData || { role: 'user', is_active: 'true' },
    errors: data.errors
  });
}

async function renderEdit(res, status, user, data = {}) {
  const catalogs = await getCatalogs({ includeInactive: true });

  return res.status(status).render('users/edit', {
    title: 'Editar usuario',
    user,
    departments: catalogs.departments,
    companies: catalogs.companies,
    formData: data.formData || {
      ...user,
      is_active: String(user.is_active)
    },
    errors: data.errors
  });
}

async function index(req, res) {
  const filters = {
    search: req.query.search || '',
    role: req.query.role || '',
    departmentId: req.query.department_id || '',
    companyId: req.query.company_id || ''
  };
  const [users, catalogs] = await Promise.all([
    User.findAll(filters),
    getCatalogs({ includeInactive: true })
  ]);

  return res.render('users/index', {
    title: 'Usuarios',
    users,
    departments: catalogs.departments,
    companies: catalogs.companies,
    filters
  });
}

async function showCreate(req, res) {
  return renderCreate(res, 200);
}

async function store(req, res) {
  const errors = getValidationErrors(req);

  if (errors.length) {
    return renderCreate(res, 422, { errors, formData: req.body });
  }

  try {
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    await User.create({
      name: req.body.name,
      email: req.body.email,
      passwordHash,
      role: req.body.role,
      departmentId: optionalCatalogId(req.body.department_id),
      companyId: optionalCatalogId(req.body.company_id),
      isActive: req.body.is_active === 'true'
    });
  } catch (error) {
    if (error.code === '23505') {
      return renderCreate(res, 409, {
        errors: ['Ya existe un usuario con ese email.'],
        formData: req.body
      });
    }

    if (error.code === '23503') {
      return renderCreate(res, 409, {
        errors: ['Selecciona un departamento y empresa validos.'],
        formData: req.body
      });
    }

    throw error;
  }

  req.flash('success', 'Usuario creado correctamente.');
  return res.redirect('/users');
}

async function edit(req, res) {
  const user = await User.findById(req.params.id);

  if (!user) {
    req.flash('error', 'El usuario no existe.');
    return res.redirect('/users');
  }

  return renderEdit(res, 200, user);
}

async function update(req, res) {
  const errors = getValidationErrors(req);
  const userId = Number(req.params.id);
  const isSelf = req.session.user.id === userId;
  const nextIsActive = req.body.is_active === 'true';
  const nextRole = req.body.role;

  if (isSelf && !nextIsActive) {
    errors.push('No puedes desactivar tu propio usuario.');
  }

  if (isSelf && nextRole !== 'admin') {
    errors.push('No puedes quitar tu propio rol administrativo.');
  }

  if (errors.length) {
    return renderEdit(res, 422, { id: userId }, {
      errors,
      formData: req.body
    });
  }

  try {
    const updatedUser = await User.update(userId, {
      name: req.body.name,
      email: req.body.email,
      role: nextRole,
      departmentId: optionalCatalogId(req.body.department_id),
      companyId: optionalCatalogId(req.body.company_id),
      isActive: nextIsActive
    });

    if (!updatedUser) {
      req.flash('error', 'El usuario no existe.');
      return res.redirect('/users');
    }

    if (req.body.password) {
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      await User.updatePassword(userId, passwordHash);
    }

    if (isSelf) {
      req.session.user = {
        ...req.session.user,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      };
    }
  } catch (error) {
    if (error.code === '23505') {
      return renderEdit(res, 409, { id: userId }, {
        errors: ['Ya existe un usuario con ese email.'],
        formData: req.body
      });
    }

    if (error.code === '23503') {
      return renderEdit(res, 409, { id: userId }, {
        errors: ['Selecciona un departamento y empresa validos.'],
        formData: req.body
      });
    }

    throw error;
  }

  req.flash('success', 'Usuario actualizado correctamente.');
  return res.redirect('/users');
}

async function toggleStatus(req, res) {
  const userId = Number(req.params.id);

  if (req.session.user.id === userId) {
    req.flash('error', 'No puedes desactivar tu propio usuario.');
    return res.redirect('/users');
  }

  const user = await User.findById(userId);

  if (!user) {
    req.flash('error', 'El usuario no existe.');
    return res.redirect('/users');
  }

  await User.setActive(user.id, !user.is_active);
  req.flash('success', user.is_active ? 'Usuario desactivado.' : 'Usuario activado.');
  return res.redirect('/users');
}

async function storeDepartment(req, res) {
  const errors = getValidationErrors(req);

  if (errors.length) {
    req.flash('error', errors[0]);
    return res.redirect('/users#catalogs');
  }

  try {
    await Department.create({
      name: req.body.name,
      description: req.body.description
    });
  } catch (error) {
    if (error.code === '23505') {
      req.flash('error', 'Ya existe un departamento con ese nombre.');
      return res.redirect('/users#catalogs');
    }

    throw error;
  }

  req.flash('success', 'Departamento creado correctamente.');
  return res.redirect('/users#catalogs');
}

async function destroyDepartment(req, res) {
  const department = await Department.findById(req.params.id);

  if (!department) {
    req.flash('error', 'El departamento no existe.');
    return res.redirect('/users#catalogs');
  }

  const assignedUsers = await Department.countAssignedUsers(department.id);

  if (assignedUsers > 0) {
    req.flash('error', `No se puede eliminar "${department.name}" porque tiene ${assignedUsers} usuario(s) asignado(s).`);
    return res.redirect('/users#catalogs');
  }

  try {
    await Department.remove(department.id);
  } catch (error) {
    if (error.code === '23503') {
      req.flash('error', `No se puede eliminar "${department.name}" porque esta asignado a uno o mas usuarios.`);
      return res.redirect('/users#catalogs');
    }

    throw error;
  }

  req.flash('success', 'Departamento eliminado correctamente.');
  return res.redirect('/users#catalogs');
}

async function storeCompany(req, res) {
  const errors = getValidationErrors(req);

  if (errors.length) {
    req.flash('error', errors[0]);
    return res.redirect('/users#catalogs');
  }

  try {
    await Company.create({
      name: req.body.name,
      description: req.body.description
    });
  } catch (error) {
    if (error.code === '23505') {
      req.flash('error', 'Ya existe una empresa con ese nombre.');
      return res.redirect('/users#catalogs');
    }

    throw error;
  }

  req.flash('success', 'Empresa creada correctamente.');
  return res.redirect('/users#catalogs');
}

async function destroyCompany(req, res) {
  const company = await Company.findById(req.params.id);

  if (!company) {
    req.flash('error', 'La empresa no existe.');
    return res.redirect('/users#catalogs');
  }

  const assignedUsers = await Company.countAssignedUsers(company.id);

  if (assignedUsers > 0) {
    req.flash('error', `No se puede eliminar "${company.name}" porque tiene ${assignedUsers} usuario(s) asignado(s).`);
    return res.redirect('/users#catalogs');
  }

  try {
    await Company.remove(company.id);
  } catch (error) {
    if (error.code === '23503') {
      req.flash('error', `No se puede eliminar "${company.name}" porque esta asignada a uno o mas usuarios.`);
      return res.redirect('/users#catalogs');
    }

    throw error;
  }

  req.flash('success', 'Empresa eliminada correctamente.');
  return res.redirect('/users#catalogs');
}

module.exports = {
  index,
  showCreate,
  store,
  edit,
  update,
  toggleStatus,
  storeDepartment,
  destroyDepartment,
  storeCompany,
  destroyCompany
};
