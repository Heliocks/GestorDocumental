const Category = require('../models/categoryModel');
const Document = require('../models/documentModel');
const User = require('../models/userModel');

async function index(req, res) {
  const currentUser = req.session.user;
  const isAdmin = currentUser.role === 'admin';
  const userDocumentScope = {
    visibleToUserId: currentUser.id,
    documentStatus: 'Vigente'
  };
  const userVisibleCountsScope = {
    documentStatus: 'Vigente'
  };

  const [
    totalDocuments,
    totalCategories,
    totalUsers,
    recentDocuments
  ] = await Promise.all([
    Document.countActive(isAdmin ? {} : userDocumentScope),
    isAdmin ? Category.countActive() : Document.countVisibleCategories(currentUser.id, userVisibleCountsScope),
    isAdmin ? User.countActive() : Document.countVisibleOwners(currentUser.id, userVisibleCountsScope),
    Document.recent(6, isAdmin ? {} : userDocumentScope)
  ]);

  return res.render('dashboard/index', {
    title: 'Dashboard',
    isAdminDashboard: isAdmin,
    totalDocuments,
    totalCategories,
    totalUsers,
    recentDocuments
  });
}

module.exports = {
  index
};
