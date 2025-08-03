import { User } from '../models/index.js';

class UserController {
  // Update user
  static async updateUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.update(updates);

      // Update session if updating current user
      if (req.session?.user?.id === userId) {
        req.session.user = {
          id: user.id,
          email: user.email || undefined,
          phone: user.phone || undefined,
          name: user.name || 'User',
          role: user.role
        };
      }
      
      // Add needsNameUpdate flag
      const userResponse = {
        ...user.toJSON(),
        needsNameUpdate: user.role === 'customer' && (!user.name || user.name === 'Customer')
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Update failed' });
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        order: [['createdAt', 'DESC']]
      });
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  // Delete user (admin only)
  static async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Prevent admin from deleting themselves
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      await user.destroy();
      
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }

  // Toggle user status (admin only)
  static async toggleUserStatus(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.update({ isActive });
      
      res.json(user);
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  }
}

export default UserController;