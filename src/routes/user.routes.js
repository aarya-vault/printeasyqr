const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// User update route (any authenticated user can update their own profile)
router.patch('/users/:id', requireAuth, UserController.updateUser);
router.get('/users/:id', requireAuth, UserController.getUserById);

module.exports = router;