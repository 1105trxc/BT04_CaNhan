import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { searchProducts } from '../redux/productSlice';
import Layout from '../components/Layout';
import { ShoppingCart, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, X, Search as SearchIcon } from 'lucide-react';

import { FASHION_PRODUCTS } from '../data/fashionProducts';


const CATEGORIES = ['Tops', 'Dresses', 'Outerwear', 'Pants', 'Footwear', 'Accessories'];
const BRANDS = ['Zara', 'H&M', 'Uniqlo', 'Gucci', 'Local Brand', 'Mango'];
const SORT_OPTIONS = [
  { label: 'Relevancy', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Selling', value: 'best_selling' },
  { label: 'Newest', value: 'newest' },
];

const Search = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, isLoading } = useSelector((state) => state.products);

  const queryParams = new URLSearchParams(location.search);
  const initialKeyword = queryParams.get('keyword') || '';

  const [filters, setFilters] = useState({
    keyword: initialKeyword,
    categories: [],
    minPrice: '',
    maxPrice: '',
    inStock: false,
    rating: null,
    sort: ''
  });
  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const query = new URLSearchParams();
    if (filters.keyword) query.append('keyword', filters.keyword);
    if (filters.minPrice) query.append('minPrice', filters.minPrice);
    if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
    if (filters.sort) query.append('sortBy', filters.sort);
    dispatch(searchProducts(query.toString()));
    setCurrentPage(1);
  }, [filters.keyword, filters.minPrice, filters.maxPrice, filters.sort, dispatch]);

  const toggleCategory = (cat) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
    setCurrentPage(1);
  };

  const clearAll = () => {
    setFilters({ keyword: '', categories: [], minPrice: '', maxPrice: '', inStock: false, rating: null, sort: '' });
    setSearchInput('');
    navigate('/search');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, keyword: searchInput }));
  };

  // Non-fashion keywords to filter out DB products
  const NON_FASHION_KWS = ['UTE', 'Giáo trình', 'Bút', 'Gấu', 'Máy ảnh', 'Camera', 
    'Điện thoại', 'Chuột', 'Máy tính', 'Logitech', 'Canon', 'Samsung', 'Apple',
    'Bàn phím', 'Tai nghe', 'Tivi', 'Đồng hồ thông minh'];

  const isFashionProduct = (p) => {
    const name = p.name || '';
    const catName = p.category?.name || '';
    const fashionCats = ['Tops', 'Dresses', 'Outerwear', 'Pants', 'Footwear', 'Accessories',
      'Quần áo', 'Thời trang', 'Giày dép', 'Túi xách', 'Phụ kiện thời trang'];
    if (NON_FASHION_KWS.some(k => name.includes(k))) return false;
    // If category name is a known fashion one → keep it
    if (fashionCats.some(c => catName.toLowerCase().includes(c.toLowerCase()))) return true;
    // If category is in our CATEGORIES list → keep it
    if (CATEGORIES.includes(catName)) return true;
    // Otherwise reject to keep display clean
    return false;
  };

  // Build the base pool: always start from FASHION_PRODUCTS (guaranteed fashion)
  // then prepend any real DB products that are confirmed fashion
  const buildBasePool = () => {
    let base = [...FASHION_PRODUCTS];
    if (searchResults && searchResults.length > 0) {
      const realFashion = searchResults.filter(isFashionProduct);
      if (realFashion.length > 0) {
        // Prepend real fashion items, avoid name duplicates with our mocks
        const deduped = realFashion.filter(rf =>
          !FASHION_PRODUCTS.some(fp => fp.name === rf.name)
        );
        base = [...deduped, ...base];
      }
    }
    return base;
  };

  let displayProducts = buildBasePool();

  // Keyword filter (client-side on fashion pool)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    displayProducts = displayProducts.filter(p =>
      (p.name || '').toLowerCase().includes(kw) ||
      (p.category?.name || '').toLowerCase().includes(kw)
    );
  }

  // Category filter — match against the CATEGORIES list names
  if (filters.categories.length > 0) {
    displayProducts = displayProducts.filter(p =>
      filters.categories.includes(p.category?.name)
    );
  }

  // Price filter
  if (filters.minPrice) displayProducts = displayProducts.filter(p => p.base_price >= parseFloat(filters.minPrice));
  if (filters.maxPrice) displayProducts = displayProducts.filter(p => p.base_price <= parseFloat(filters.maxPrice));

  // Rating filter
  if (filters.rating) {
    displayProducts = displayProducts.filter(p => (p.average_rating || 4.5) >= filters.rating);
  }

  // Sort
  if (filters.sort === 'price_asc') displayProducts = [...displayProducts].sort((a, b) => a.base_price - b.base_price);
  if (filters.sort === 'price_desc') displayProducts = [...displayProducts].sort((a, b) => b.base_price - a.base_price);
  if (filters.sort === 'best_selling') displayProducts = [...displayProducts].sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0));
  if (filters.sort === 'newest') displayProducts = [...displayProducts].reverse();

  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = displayProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const activeSortLabel = SORT_OPTIONS.find(o => o.value === filters.sort)?.label || 'Relevancy';

  // Count per category from full pool (before category filter)
  const fullPool = buildBasePool();
  const catCount = (cat) => fullPool.filter(p => p.category?.name === cat).length;

  return (
    <Layout>
      <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <div className="container-xl py-4 px-3 px-md-4">

          {/* Top Header Bar */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div>
              <p className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>
                SHOP / COLLECTIONS
              </p>
              <h1 className="fw-bold text-dark mb-0" style={{ fontSize: '24px', fontFamily: 'Georgia, serif' }}>
                {filters.keyword ? `Results for "${filters.keyword}"` : 'All Fashion'}
              </h1>
              <p className="text-muted mt-1 mb-0" style={{ fontSize: '13px' }}>
                {displayProducts.length} items found
                {filters.categories.length > 0 && ` in ${filters.categories.join(', ')}`}
              </p>
            </div>

            {/* Search bar + Sort */}
            <div className="d-flex gap-2 align-items-center w-100 w-md-auto" style={{ maxWidth: '500px' }}>
              <form onSubmit={handleSearchSubmit} className="d-flex flex-grow-1 border rounded-2 overflow-hidden bg-white" style={{ height: '40px' }}>
                <input
                  type="text"
                  className="form-control border-0 shadow-none"
                  placeholder="Search fashion items..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  style={{ fontSize: '14px' }}
                />
                <button type="submit" className="btn btn-dark px-3 rounded-0" style={{ borderRadius: 0 }}>
                  <SearchIcon size={15} />
                </button>
              </form>

              {/* Sort Dropdown */}
              <div className="position-relative">
                <button
                  className="btn btn-white border rounded-2 d-flex align-items-center gap-2 bg-white"
                  style={{ fontSize: '13px', height: '40px', whiteSpace: 'nowrap' }}
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  {activeSortLabel} <ChevronDown size={14} />
                </button>
                {showSortMenu && (
                  <div className="position-absolute end-0 top-100 mt-1 bg-white border rounded-2 shadow-sm z-3" style={{ minWidth: '180px' }}>
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`d-block w-100 text-start px-3 py-2 border-0 bg-transparent text-dark ${filters.sort === opt.value ? 'fw-bold' : ''}`}
                        style={{ fontSize: '13px' }}
                        onClick={() => { setFilters(prev => ({ ...prev, sort: opt.value })); setShowSortMenu(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filters chips */}
          {(filters.categories.length > 0 || filters.minPrice || filters.maxPrice) && (
            <div className="d-flex gap-2 flex-wrap mb-3">
              {filters.categories.map(cat => (
                <span key={cat} className="badge rounded-pill border text-dark fw-normal px-3 py-2 d-flex align-items-center gap-1"
                  style={{ fontSize: '12px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}
                  onClick={() => toggleCategory(cat)}>
                  {cat} <X size={12} />
                </span>
              ))}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="badge rounded-pill border text-dark fw-normal px-3 py-2 d-flex align-items-center gap-1"
                  style={{ fontSize: '12px', backgroundColor: '#f0f0f0', cursor: 'pointer' }}
                  onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))}>
                  ${filters.minPrice || '0'} – ${filters.maxPrice || '∞'} <X size={12} />
                </span>
              )}
              <button className="btn btn-link text-danger p-0 text-decoration-none" style={{ fontSize: '12px' }} onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}

          <div className="row g-4">
            {/* Sidebar */}
            <div className="col-lg-2 d-none d-lg-block">
              <div className="bg-white rounded-3 border p-3" style={{ position: 'sticky', top: '20px' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: '14px' }}>
                    <SlidersHorizontal size={15} /> Filters
                  </span>
                  <button className="btn btn-link text-muted p-0 text-decoration-none" style={{ fontSize: '12px' }} onClick={clearAll}>
                    Reset
                  </button>
                </div>

                <hr className="my-2" />

                {/* Categories */}
                <div className="mb-3">
                  <p className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>CATEGORY</p>
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="d-flex justify-content-between align-items-center mb-1">
                      <div className="form-check mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`cat-${cat}`}
                          checked={filters.categories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                        />
                        <label className="form-check-label text-dark" style={{ fontSize: '13px' }} htmlFor={`cat-${cat}`}>
                          {cat}
                        </label>
                      </div>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {catCount(cat)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="my-2" />

                {/* Price Range */}
                <div className="mb-3">
                  <p className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>PRICE RANGE</p>
                  <div className="d-flex gap-2">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="Min $"
                      value={filters.minPrice}
                      onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                      style={{ fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="Max $"
                      value={filters.maxPrice}
                      onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                </div>

                <hr className="my-2" />

                {/* Availability */}
                <div className="mb-3">
                  <p className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>AVAILABILITY</p>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="inStockSwitch"
                      checked={filters.inStock}
                      onChange={e => setFilters({ ...filters, inStock: e.target.checked })}
                    />
                    <label className="form-check-label text-dark" style={{ fontSize: '13px' }} htmlFor="inStockSwitch">
                      In Stock Only
                    </label>
                  </div>
                </div>

                <hr className="my-2" />

                {/* Brands */}
                <div className="mb-3">
                  <p className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>TOP BRANDS</p>
                  {BRANDS.map(brand => (
                    <div key={brand} className="form-check mb-1">
                      <input className="form-check-input" type="checkbox" id={`brand-${brand}`} />
                      <label className="form-check-label text-dark" style={{ fontSize: '13px' }} htmlFor={`brand-${brand}`}>{brand}</label>
                    </div>
                  ))}
                </div>

                <hr className="my-2" />

                {/* Rating */}
                <div className="mb-3">
                  <p className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>MIN RATING</p>
                  {[4, 3, 2].map(stars => (
                    <div key={stars} className="d-flex align-items-center gap-2 mb-1" style={{ cursor: 'pointer' }}
                      onClick={() => setFilters(prev => ({ ...prev, rating: prev.rating === stars ? null : stars }))}>
                      <input className="form-check-input mt-0" type="radio" readOnly checked={filters.rating === stars} />
                      <div className="d-flex text-warning" style={{ fontSize: '11px' }}>
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fa-solid fa-star ${i < stars ? '' : 'opacity-25'}`}></i>
                        ))}
                      </div>
                      <span className="text-muted" style={{ fontSize: '11px' }}>& up</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="col-lg-10">
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                  <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-3" style={{ fontSize: '16px' }}>No items found in this category.</p>
                  <button className="btn btn-outline-dark rounded-2 px-4" onClick={clearAll}>Clear Filters</button>
                </div>
              ) : (
                <>
                  <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3">
                    {paginatedProducts.map(product => (
                      <div key={product._id} className="col">
                        <div
                          className="bg-white rounded-3 border overflow-hidden h-100"
                          style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                          onClick={() => navigate(`/product/${product._id}`)}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div className="position-relative overflow-hidden" style={{ aspectRatio: '1/1', backgroundColor: '#f5f5f5' }}>
                            <img
                              src={product.media?.[0]?.media_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80'}
                              className="w-100 h-100"
                              style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                              alt={product.name}
                              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            />
                            <span className="position-absolute top-0 start-0 m-2 badge text-white fw-bold"
                              style={{ fontSize: '9px', letterSpacing: '0.5px', backgroundColor: '#111' }}>
                              {product.category?.name?.toUpperCase()}
                            </span>
                          </div>
                          <div className="p-3">
                            <p className="fw-medium text-dark mb-1" style={{ fontSize: '13px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {product.name}
                            </p>
                            <div className="d-flex text-warning mb-2" style={{ fontSize: '10px' }}>
                              {[...Array(5)].map((_, i) => (
                                <i key={i} className={`fa-solid fa-star ${i < Math.floor(product.average_rating || 4.5) ? '' : 'opacity-25'}`}></i>
                              ))}
                              <span className="text-muted ms-1" style={{ fontSize: '10px' }}>({product.sold_quantity || 120})</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>${product.base_price?.toFixed(2)}</span>
                                <span className="text-muted text-decoration-line-through ms-2" style={{ fontSize: '12px' }}>
                                  ${(product.base_price * 1.25).toFixed(2)}
                                </span>
                              </div>
                              <button
                                className="btn btn-dark btn-sm rounded-2 px-2"
                                style={{ fontSize: '11px' }}
                                onClick={e => { e.stopPropagation(); }}
                              >
                                <ShoppingCart size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                      <button
                        className="btn btn-outline-secondary btn-sm rounded-2"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          className={`btn btn-sm rounded-2 px-3 ${currentPage === i + 1 ? 'btn-dark' : 'btn-outline-secondary'}`}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="btn btn-outline-secondary btn-sm rounded-2"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}

                  {/* Suggestion Tags */}
                  <div className="rounded-3 border p-4 text-center mt-5 mb-3" style={{ backgroundColor: '#f9f9f9' }}>
                    <p className="text-dark fw-medium mb-3" style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}>
                      Explore more styles
                    </p>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {['Summer Collection', 'Vintage Denim', 'Oversized Tees', 'Silk Dresses', 'Sneakers', 'Leather Bags'].map(tag => (
                        <button
                          key={tag}
                          className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                          style={{ fontSize: '12px' }}
                          onClick={() => { setSearchInput(tag); setFilters(prev => ({ ...prev, keyword: tag })); }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
