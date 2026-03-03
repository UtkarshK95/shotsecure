// Simulated auth: validates a static token issued by the /api/login endpoint.
// No real JWT or session management — keeps the demo simple per project spec.
module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
