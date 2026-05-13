const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getHomeProducts = async (req, res, next) => {
  try {
    // Lấy sản phẩm mới nhất
    const newProducts = await Product.find({ is_active: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('category', 'name slug');

    // Lấy sản phẩm bán chạy nhất
    const bestSelling = await Product.find({ is_active: true })
      .sort({ sold_quantity: -1 })
      .limit(8)
      .populate('category', 'name slug');

    // Lấy sản phẩm khuyến mãi (giả sử có trường promotion_price hoặc lấy random)
    const promotional = await Product.find({ is_active: true })
      .limit(8)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      data: {
        newProducts,
        bestSelling,
        promotional
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format before querying to avoid CastError
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('shop', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Lấy sản phẩm tương tự (cùng danh mục) — guard against null category
    let similarProducts = [];
    if (product.category && product.category._id) {
      similarProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        is_active: true
      })
        .limit(4)
        .populate('category', 'name slug');
    }

    res.status(200).json({
      success: true,
      data: {
        product,
        similarProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.searchAndFilterProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, sortBy } = req.query;
    
    let query = { is_active: true };

    // Tìm kiếm theo từ khóa
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Lọc theo danh mục
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Lọc theo giá
    if (minPrice || maxPrice) {
      query.base_price = {};
      if (minPrice) query.base_price.$gte = Number(minPrice);
      if (maxPrice) query.base_price.$lte = Number(maxPrice);
    }

    // Sắp xếp
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOptions = { base_price: 1 };
    if (sortBy === 'price_desc') sortOptions = { base_price: -1 };
    if (sortBy === 'best_selling') sortOptions = { sold_quantity: -1 };

    const products = await Product.find(query)
      .sort(sortOptions)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};
