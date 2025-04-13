const express = require('express');
const Category = require('../models/category.model');
const Book = require('../models/book.model');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

const router = express.Router();

// Get all categories (public access)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    
    // If request is from admin dashboard, include book count
    if (req.query.admin) {
      // Add book count for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const bookCount = await Book.countDocuments({ categories: category._id });
          return {
            ...category.toObject(),
            bookCount
          };
        })
      );
      
      return res.status(200).json(categoriesWithCounts);
    }
    
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
});

// Get category by ID (public access)
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving category', error: error.message });
  }
});

// Create category (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check if category with same name exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    const newCategory = new Category({
      name,
      description
    });
    
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error creating category', error: error.message });
  }
});

// Update category (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check if another category with same name exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Another category with this name already exists' });
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error updating category', error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if books are using this category
    const booksWithCategory = await Book.countDocuments({ categories: req.params.id });
    
    if (booksWithCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete this category as it is used by ${booksWithCategory} books. Please reassign those books first.` 
      });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json({ 
      message: 'Category deleted successfully',
      deletedCategory: {
        id: deletedCategory._id,
        name: deletedCategory.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;
