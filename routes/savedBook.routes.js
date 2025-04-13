const express = require('express');
const SavedBook = require('../models/savedBook.model');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/saved-books:
 *   get:
 *     summary: Get all saved books for the current user
 *     tags: [Saved Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved books
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const savedBooks = await SavedBook.find({ user: req.user.id })
      .populate({
        path: 'book',
        populate: {
          path: 'categories',
        },
      });
      
    res.status(200).json(savedBooks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/saved-books:
 *   post:
 *     summary: Save a book
 *     tags: [Saved Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book
 *             properties:
 *               book:
 *                 type: string
 *                 description: Book ID to save
 *     responses:
 *       201:
 *         description: Book saved successfully
 *       400:
 *         description: Book already saved or invalid input
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { book } = req.body;
    const existingSavedBook = await SavedBook.findOne({
      user: req.user.id,
      book,
    });
    
    if (existingSavedBook) {
      return res.status(400).json({ message: 'Book already saved' });
    }
    const newSavedBook = new SavedBook({
      user: req.user.id,
      book,
    });
    
    const savedBook = await newSavedBook.save();
    
    const populatedSavedBook = await SavedBook.findById(savedBook._id)
      .populate({
        path: 'book',
        populate: {
          path: 'categories',
        },
      });
      
    res.status(201).json(populatedSavedBook);
  } catch (error) {
    res.status(400).json({ message: 'Error saving book', error: error.message });
  }
});

/**
 * @swagger
 * /api/saved-books/{id}:
 *   delete:
 *     summary: Remove a saved book
 *     tags: [Saved Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the saved book entry (not the book ID)
 *     responses:
 *       200:
 *         description: Book removed from saved list successfully
 *       403:
 *         description: Not authorized to remove this saved book
 *       404:
 *         description: Saved book not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Find the saved book first to check ownership
    const savedBook = await SavedBook.findById(req.params.id);
    
    if (!savedBook) {
      return res.status(404).json({ message: 'Saved book not found' });
    }
    
    // Check if user owns the saved book
    if (savedBook.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to remove this saved book' });
    }
    
    await SavedBook.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Book removed from saved list successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing saved book', error: error.message });
  }
});

module.exports = router;
