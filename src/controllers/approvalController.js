const Document = require('../models/documentModel');

async function index(req, res) {
  const isAdmin = req.session.user.role === 'admin';
  const documents = await Document.findPendingApprovalsByOwner(isAdmin ? null : req.session.user.id);

  return res.render('approvals/index', {
    title: 'Aprobar',
    isAdminApproval: isAdmin,
    documents
  });
}

async function approve(req, res) {
  const isAdmin = req.session.user.role === 'admin';
  const document = await Document.updateApprovalStatus(
    req.params.id,
    isAdmin ? null : req.session.user.id,
    'Vigente'
  );

  if (!document) {
    req.flash('error', 'No se pudo aprobar el documento. Verifica que siga en Revision y tengas acceso.');
    return res.redirect('/approvals');
  }

  req.flash('success', 'Documento aprobado correctamente.');
  return res.redirect('/approvals');
}

async function reject(req, res) {
  const isAdmin = req.session.user.role === 'admin';
  const document = await Document.updateApprovalStatus(
    req.params.id,
    isAdmin ? null : req.session.user.id,
    'Creación'
  );

  if (!document) {
    req.flash('error', 'No se pudo rechazar el documento. Verifica que siga en Revision y tengas acceso.');
    return res.redirect('/approvals');
  }

  req.flash('success', 'Documento rechazado y regresado a Creacion.');
  return res.redirect('/approvals');
}

module.exports = {
  index,
  approve,
  reject
};
