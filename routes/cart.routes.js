const express = require('express');
const Cart = require('../models/cart.model');
const Book = require('../models/book.model');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart retrieved successfully
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.book',
      select: 'title author coverImage price'
    });
    
    if (!cart) {
      // Create empty cart if none exists
      cart = new Cart({ user: req.user.id, items: [], totalAmount: 0 });
      await cart.save();
    }
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving cart', error: error.message });
  }
});

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;
    
    // Validate book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Get user's cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    // Create new cart if none exists
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [], totalAmount: 0 });
    }
    
    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.book.toString() === bookId
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        book: bookId,
        quantity,
        price: book.price
      });
    }
    
    // Calculate total amount
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    
    await cart.save();
    
    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.book',
      select: 'title author coverImage price'
    });
    
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

/**
 * @swagger
 * /api/cart/update/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/update/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    
    await cart.save();
    
    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.book',
      select: 'title author coverImage price'
    });
    
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
});

/**
 * @swagger
 * /api/cart/remove/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/remove/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Remove item from cart
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    
    await cart.save();
    
    // Return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.book',
      select: 'title author coverImage price'
    });
    
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart', error: error.message });
  }
});

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Clear cart items
    cart.items = [];
    cart.totalAmount = 0;
    
    await cart.save();
    
    res.status(200).json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

module.exports = router;
