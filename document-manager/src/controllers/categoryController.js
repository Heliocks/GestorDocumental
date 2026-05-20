const Category = require('../models/categoryModel');
const { getValidationErrors } = require('../utils/validation');

async function index(req, res) {
  const categories = await Category.findAll({ includeInactive: true });

  return res.render('categories/index', {
    title: 'Categorias',
    categories
  });
}

function showCreate(req, res) {
  return res.render('categories/create', {
    title: 'Nueva categoria',
    formData: {}
  });
}

async function store(req, res) {
  const errors = getValidationErrors(req);

  if (errors.length) {
    return res.status(422).render('categories/create', {
      title: 'Nueva categoria',
      errors,
      formData: req.body
    });
  }

  try {
    await Category.create({
      name: req.body.name,
      description: req.body.description,
      isActive: true
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).render('categories/create', {
        title: 'Nueva categoria',
        errors: ['Ya existe una categoria con ese nombre.'],
        formData: req.body
      });
    }

    throw error;
  }

  req.flash('success', 'Categoria creada correctamente.');
  return res.redirect('/categories');
}

async function edit(req, res) {
  const category = await Category.findById(req.params.id);

  if (!category) {
    req.flash('error', 'La categoria no existe.');
    return res.redirect('/categories');
  }

  return res.render('categories/edit', {
    title: 'Editar categoria',
    category,
    formData: category
  });
}

async function update(req, res) {
  const errors = getValidationErrors(req);

  if (errors.length) {
    return res.status(422).render('categories/edit', {
      title: 'Editar categoria',
      category: { id: req.params.id },
      errors,
      formData: req.body
    });
  }

  try {
    const category = await Category.update(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      isActive: req.body.is_active === 'true'
    });

    if (!category) {
      req.flash('error', 'La categoria no existe.');
      return res.redirect('/categories');
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).render('categories/edit', {
        title: 'Editar categoria',
        category: { id: req.params.id },
        errors: ['Ya existe una categoria con ese nombre.'],
        formData: req.body
      });
    }

    throw error;
  }

  req.flash('success', 'Categoria actualizada correctamente.');
  return res.redirect('/categories');
}

async function toggleStatus(req, res) {
  const category = await Category.findById(req.params.id);

  if (!category) {
    req.flash('error', 'La categoria no existe.');
    return res.redirect('/categories');
  }

  await Category.setActive(category.id, !category.is_active);
  req.flash('success', category.is_active ? 'Categoria desactivada.' : 'Categoria activada.');
  return res.redirect('/categories');
}

module.exports = {
  index,
  showCreate,
  store,
  edit,
  update,
  toggleStatus
};
