const express = require('express');
const Book = require('../models/book.model');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID to filter by
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.categories = category;
    }
    
    const books = await Book.find(query).populate('categories');
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get a book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('categories');
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, author, description, coverImage, publishDate, price, categories } = req.body;
    
    const newBook = new Book({
      title,
      author,
      description,
      coverImage,
      publishDate,
      price,
      categories
    });
    
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(400).json({ message: 'Error creating book', error: error.message });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Books]
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
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, author, description, coverImage, publishDate, price, categories } = req.body;
    
    // Validate required fields
    if (!title || !author || !description) {
      return res.status(400).json({ message: 'Title, author, and description are required fields' });
    }
    
    // Find book and update
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Update book fields
    book.title = title;
    book.author = author;
    book.description = description;
    book.coverImage = coverImage;
    book.publishDate = publishDate;
    book.price = price || 0;
    book.categories = categories || [];
    
    const updatedBook = await book.save();
    
    // Populate categories for the response
    await updatedBook.populate('categories');
    
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: 'Error updating book', error: error.message });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
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
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Delete request received for book ID:', req.params.id);
    
    // First check if book exists
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      console.log('Book not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Book not found' });
    }
    
    console.log('Book found, proceeding with deletion');
    
    // Perform the deletion
    await Book.deleteOne({ _id: req.params.id });
    
    console.log('Book deleted successfully');
    
    // Return success response
    res.status(200).json({ 
      success: true,
      message: 'Book deleted successfully',
      deletedBook: {
        id: book._id,
        title: book.title
      }
    });
  } catch (error) {
    console.error('Error in delete book endpoint:', error);
    res.status(500).json({ 
      message: 'Error deleting book', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/books/stats/top-selling:
 *   get:
 *     summary: Get top selling books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Top selling books retrieved successfully
 */
router.get('/stats/top-selling', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // In a real app, you would track sales in orders and calculate
    // For this example, we'll simulate with random data
    const books = await Book.find().populate('categories');
    
    // Add random sales data for demo purposes
    const booksWithSales = books.map(book => {
      const bookObj = book.toObject();
      bookObj.unitsSold = Math.floor(Math.random() * 100) + 1; // Random number 1-100
      return bookObj;
    });
    
    // Sort by units sold
    const topBooks = booksWithSales.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
    
    res.status(200).json(topBooks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving top books', error: error.message });
  }
});

module.exports = router;
