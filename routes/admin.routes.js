const express = require('express');
const Book = require('../models/book.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Category = require('../models/category.model');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Apply middleware to all routes in this router
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get count statistics
    const [booksCount, usersCount, ordersCount] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
    ]);

    // Get sales statistics
    const orders = await Order.find().sort({ createdAt: -1 });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get monthly sales data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" } 
          },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Format monthly data for the chart
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlySales = Array(6).fill().map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const orderData = monthlyOrders.find(o => 
        o._id.month === month + 1 && o._id.year === year
      );
      
      return {
        month: months[month],
        revenue: orderData ? orderData.revenue : 0,
        count: orderData ? orderData.count : 0
      };
    }).reverse();

    // Get category statistics
    const categoryStats = await Book.aggregate([
      {
        $unwind: "$categories"
      },
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Populate category names
    const categoriesData = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await Category.findById(stat._id);
        return {
          name: category ? category.name : 'Unknown',
          count: stat.count
        };
      })
    );

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      stats: {
        books: booksCount,
        users: usersCount,
        orders: ordersCount,
        revenue: totalRevenue
      },
      monthlySales,
      categories: categoriesData,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dashboard data', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, isAdmin } = req.body;
    
    // Prevent removing admin privileges from the last admin account
    if (isAdmin === false) {
      const currentUser = await User.findById(req.params.id);
      if (currentUser && currentUser.isAdmin) {
        const adminCount = await User.countDocuments({ isAdmin: true });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot remove the only admin account' });
        }
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, isAdmin },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });
    
    await newUser.save();
    
    // Return user without password
    const savedUser = await User.findById(newUser._id).select('-password');
    
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent deleting the last admin
    const userToDelete = await User.findById(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if trying to delete the last admin account
    if (userToDelete.isAdmin) {
      const adminCount = await User.countDocuments({ isAdmin: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin account' });
      }
    }
    
    // Prevent admins from deleting themselves
    if (userToDelete._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting user', error: error.message });
  }
});

module.exports = router;
