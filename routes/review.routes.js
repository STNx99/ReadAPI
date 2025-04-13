const express = require('express');
const Review = require('../models/review.model');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: book
 *         schema:
 *           type: string
 *         description: Book ID to filter reviews by
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/', async (req, res) => {
  try {
    const { book } = req.query;
    let query = {};
    
    if (book) {
      query.book = book;
    }
    
    const reviews = await Review.find(query)
      .populate('user', 'username')
      .populate('book', 'title');
      
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review details
 *       404:
 *         description: Review not found
 */
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'username')
      .populate('book', 'title');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { book, rating, comment } = req.body;
    const newReview = new Review({
      book,
      user: req.user.id,
      rating,
      comment,
    });
    
    const savedReview = await newReview.save();
    
    const populatedReview = await Review.findById(savedReview._id)
      .populate('user', 'username')
      .populate('book', 'title');
      
    res.status(201).json(populatedReview);
  } catch (error) {
    res.status(400).json({ message: 'Error creating review', error: error.message });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not authorized to update this review
 *       404:
 *         description: Review not found
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    const { rating, comment } = req.body;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    
    const updatedReview = await review.save();
    
    const populatedReview = await Review.findById(updatedReview._id)
      .populate('user', 'username')
      .populate('book', 'title');
      
    res.status(200).json(populatedReview);
  } catch (error) {
    res.status(400).json({ message: 'Error updating review', error: error.message });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized to delete this review
 *       404:
 *         description: Review not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Find review first to check ownership
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

module.exports = router;
