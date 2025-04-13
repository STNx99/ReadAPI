const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - street
 *         - city
 *         - state
 *         - zipCode
 *         - country
 *       properties:
 *         street:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State
 *         zipCode:
 *           type: string
 *           description: Zip code
 *         country:
 *           type: string
 *           description: Country
 *           default: USA
 *     OrderItem:
 *       type: object
 *       required:
 *         - book
 *         - quantity
 *         - price
 *       properties:
 *         book:
 *           type: string
 *           description: ID of the book
 *         quantity:
 *           type: number
 *           description: Quantity of books
 *         price:
 *           type: number
 *           description: Price of the book at time of order
 *     Order:
 *       type: object
 *       required:
 *         - user
 *         - items
 *         - totalAmount
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         user:
 *           type: string
 *           description: ID of the user who placed the order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *         shippingAddress:
 *           $ref: '#/components/schemas/Address'
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, paypal, stripe]
 *           description: Payment method
 *         paymentDetails:
 *           type: object
 *           description: Additional payment details
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           default: pending
 *           description: Order status
 *         trackingNumber:
 *           type: string
 *           description: Tracking number for the order
 *           default: ''
 */
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'USA'
  }
});

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true
    },
    shippingAddress: addressSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit_card', 'paypal', 'stripe']
    },
    paymentDetails: {
      type: Object
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingNumber: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
