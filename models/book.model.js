const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           description: Book title
 *         author:
 *           type: string
 *           description: Book author
 *         description:
 *           type: string
 *           description: Book description
 *         coverImage:
 *           type: string
 *           description: URL to book cover image
 *         publishDate:
 *           type: string
 *           format: date
 *           description: Publication date
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *       example:
 *         title: The Great Gatsby
 *         author: F. Scott Fitzgerald
 *         description: A novel about American society during the Roaring 20s
 *         coverImage: https://example.com/images/gatsby.jpg
 *         publishDate: 1925-04-10
 *         categories: ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"]
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    publishDate: {
      type: Date,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
