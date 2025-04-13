const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - book
 *         - user
 *         - rating
 *       properties:
 *         book:
 *           type: string
 *           description: ID of the book being reviewed
 *         user:
 *           type: string
 *           description: ID of the user who wrote the review
 *         rating:
 *           type: number
 *           description: Rating from 1-5
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           description: Review comments
 *       example:
 *         book: 60d0fe4f5311236168a109cd
 *         user: 60d0fe4f5311236168a109cc
 *         rating: 4.5
 *         comment: A compelling read with well-developed characters
 */
const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
