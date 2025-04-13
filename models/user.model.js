const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username
 *         email:
 *           type: string
 *           description: User's email
 *         password:
 *           type: string
 *           description: User's password (hashed)
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user is an admin
 *           default: false
 *       example:
 *         username: johndoe
 *         email: john.doe@example.com
 *         password: hashedpassword123
 *         isAdmin: false
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false, // Set default to false so new users are regular users
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
