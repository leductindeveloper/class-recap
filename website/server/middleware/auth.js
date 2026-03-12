function ensureAuthenticated(req, res, next) {

  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.redirect("/admin/login");
}

module.exports = { ensureAuthenticated };