module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.session.isAdmin) {
      return next();
    }
    res.redirect('/admin/login');
  },
  forwardAuthenticated: function (req, res, next) {
    if (!req.session.isAdmin) {
      return next();
    }
    res.redirect('/admin');
  }
};
