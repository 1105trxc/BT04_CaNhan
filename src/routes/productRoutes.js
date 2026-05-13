const express = require('express');
const router = express.Router();
const { getHomeProducts, getProductDetails, searchAndFilterProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Các API public
router.get('/home', getHomeProducts);
router.get('/search', searchAndFilterProducts);
router.get('/:id', getProductDetails);

module.exports = router;
