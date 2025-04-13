const express = require('express');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const User = require('../models/user.model');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders or all orders (for admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    let orders;
    
    if (user && user.isAdmin) {
      // Admin can see all orders
      orders = await Order.find()
        .populate('user', 'username email')
        .populate({
          path: 'items.book',
          select: 'title author coverImage price'
        })
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see their own orders
      orders = await Order.find({ user: req.user.id })
        .populate({
          path: 'items.book',
          select: 'title author coverImage price'
        })
        .sort({ createdAt: -1 });
    }
    
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
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
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate({
      path: 'items.book',
      select: 'title author coverImage price'
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving order', error: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - address
 *                   - city
 *                   - postalCode
 *                   - country
 *                   - phone
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, cash_on_delivery]
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Empty cart or invalid input
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.book',
      select: 'title price'
    });
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Create order items from cart
    const orderItems = cart.items.map(item => ({
      book: item.book._id,
      quantity: item.quantity,
      price: item.price
    }));
    
    // Create new order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount: cart.totalAmount,
      shippingAddress,
      paymentMethod
    });
    
    const createdOrder = await order.save();
    
    // Clear cart after order creation
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
    
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error creating order', error: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (admin only)
 *     tags: [Orders]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'processing', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error: error.message });
  }
});

module.exports = router;
