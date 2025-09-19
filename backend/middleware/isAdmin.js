function isAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ error: "Требуется админ" });
}

module.exports = isAdmin;
