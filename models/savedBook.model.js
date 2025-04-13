const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     SavedBook:
 *       type: object
 *       required:
 *         - book
 *         - user
 *       properties:
 *         book:
 *           type: string
 *           description: ID of the saved book
 *         user:
 *           type: string
 *           description: ID of the user who saved the book
 *       example:
 *         book: 60d0fe4f5311236168a109cd
 *         user: 60d0fe4f5311236168a109cc
 */
const savedBookSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

savedBookSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('SavedBook', savedBookSchema);
