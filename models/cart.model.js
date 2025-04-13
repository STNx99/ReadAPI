const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - book
 *         - quantity
 *       properties:
 *         book:
 *           type: string
 *           description: ID of the book
 *         quantity:
 *           type: number
 *           description: Quantity of books
 *         price:
 *           type: number
 *           description: Price of the book
 *     Cart:
 *       type: object
 *       required:
 *         - user
 *         - items
 *       properties:
 *         user:
 *           type: string
 *           description: ID of the user who owns the cart
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalAmount:
 *           type: number
 *           description: Total amount of the cart
 */
const cartItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
