// roleMiddleware: enforces allowed roles for a route
module.exports = function allowedRoles(...roles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRole = req.user.role;
    if (!userRole) return res.status(403).json({ message: 'Forbidden' });
    if (roles.includes(userRole)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
};
