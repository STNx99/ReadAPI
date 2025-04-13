const User = require('../models/user.model');

// Middleware to check if user is an admin
const adminMiddleware = async (req, res, next) => {
  try {
    // We assume authMiddleware has already run and populated req.user
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. Admin rights required for this operation.' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = adminMiddleware;
