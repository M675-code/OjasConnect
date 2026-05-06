// roleMiddleware: enforces allowed roles for a route
module.exports = function allowedRoles(...roles) {
  // normalize allowed roles to lowercase for case-insensitive comparison
  const allowed = roles.map(r => String(r).toLowerCase());
  // compute normalized forms without underscores/spaces as well
  const allowedNormalized = allowed.map(r => r.replace(/[_\s]/g, ''));
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRole = String(req.user.role || '').toLowerCase();
    if (!userRole) return res.status(403).json({ message: 'Forbidden' });
    // direct match
    if (allowed.includes(userRole)) return next();
    // normalized compare (remove underscores/spaces)
    const normalized = userRole.replace(/[_\s]/g, '');
    if (allowedNormalized.includes(normalized)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
};
