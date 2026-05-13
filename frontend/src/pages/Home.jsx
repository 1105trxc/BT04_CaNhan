import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getHomeProducts } from '../redux/productSlice';
import Layout from '../components/Layout';
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

import { FASHION_PRODUCTS } from '../data/fashionProducts';

// Non-fashion keywords to filter out DB products
const NON_FASHION_KWS = ['UTE', 'Giáo trình', 'Bút', 'Gấu', 'Máy ảnh', 'Camera', 
  'Điện thoại', 'Chuột', 'Máy tính', 'Logitech', 'Canon', 'Samsung', 'Apple',
  'Bàn phím', 'Tai nghe', 'Tivi', 'Đồng hồ thông minh'];

const isNonFashion = (name = '') => NON_FASHION_KWS.some(k => name.includes(k));

// Give fashion fallback products an ID to map back to product detail page correctly
const getOverride = (product, index) => {
  if (isNonFashion(product.name)) {
    const fallback = FASHION_PRODUCTS[index % FASHION_PRODUCTS.length];
    return { id: fallback._id, name: fallback.name, category: fallback.category.name, img: fallback.media[0].media_url };
  }
  return { id: product._id, name: product.name, category: product.category?.name, img: product.media?.[0]?.media_url };
};

const StarRating = ({ rating = 4.5, count }) => (
  <div className="d-flex align-items-center gap-1">
    <div className="d-flex text-warning" style={{ fontSize: '11px' }}>
      {[...Array(5)].map((_, i) => (
        <i key={i} className={`fa-solid ${i < Math.floor(rating) ? 'fa-star' : i < rating ? 'fa-star-half-stroke' : 'fa-star opacity-25'}`}></i>
      ))}
    </div>
    {count && <span className="text-muted" style={{ fontSize: '11px' }}>({count})</span>}
  </div>
);

const ProductCard = ({ name, category, price, oldPrice, badge, badgeColor, img, id, sold, navigate }) => (
  <div className="col-6 col-md-3 mb-0">
    <div
      className="h-100"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Image */}
      <div className="position-relative rounded-3 overflow-hidden mb-2" style={{ aspectRatio: '3/4', backgroundColor: '#f3f3f3' }}>
        <img
          src={img || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80'}
          className="w-100 h-100"
          style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
          alt={name}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        {badge && (
          <span
            className="position-absolute top-0 start-0 m-2 text-white fw-bold rounded-1 px-2 py-1"
            style={{ fontSize: '10px', letterSpacing: '0.3px', backgroundColor: badgeColor || '#e11d48' }}
          >
            {badge}
          </span>
        )}
      </div>
      {/* Info */}
      <div>
        <p className="text-uppercase text-muted mb-1" style={{ fontSize: '9px', letterSpacing: '0.8px' }}>{category || 'FASHION'}</p>
        <p className="fw-medium text-dark mb-1" style={{ fontSize: '13px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {name}
        </p>
        <StarRating count={sold || Math.floor(Math.random() * 500 + 50)} />
        <div className="d-flex align-items-center gap-2 mt-1">
          <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>${price?.toFixed(2)}</span>
          {oldPrice && <span className="text-muted text-decoration-line-through" style={{ fontSize: '12px' }}>${oldPrice?.toFixed(2)}</span>}
        </div>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, icon, linkTo }) => (
  <div className="d-flex justify-content-between align-items-center mb-3">
    <div className="d-flex align-items-center gap-2">
      {icon && <span style={{ width: '3px', height: '20px', backgroundColor: '#111', borderRadius: '2px', display: 'inline-block' }}></span>}
      <h2 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>{title}</h2>
    </div>
    <Link to={linkTo} className="text-dark text-decoration-none d-flex align-items-center gap-1 fw-medium" style={{ fontSize: '13px' }}>
      View All <ArrowRight size={14} />
    </Link>
  </div>
);

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { homeProducts, isLoading } = useSelector((state) => state.products);

  useEffect(() => { dispatch(getHomeProducts()); }, [dispatch]);

  // Decide which products to show — real DB data or fashion fallback
  const resolvePromo = () => {
    if (homeProducts?.promotional?.length > 0) {
      return homeProducts.promotional.slice(0, 4).map((p, i) => {
        const ov = getOverride(p, i);
        return { ...p, _id: ov.id, _displayName: ov.name, _displayCat: ov.category, _displayImg: ov.img };
      });
    }
    return FASHION_PRODUCTS.slice(0, 4).map(p => ({ ...p, _displayName: p.name, _displayCat: p.category.name, _displayImg: p.media[0].media_url, badge: 'HOT', badgeColor: '#e11d48' }));
  };

  const resolveNew = () => {
    if (homeProducts?.newProducts?.length > 0) {
      return homeProducts.newProducts.slice(0, 4).map((p, i) => {
        const ov = getOverride(p, i);
        return { ...p, _id: ov.id, _displayName: ov.name, _displayCat: ov.category, _displayImg: ov.img };
      });
    }
    return FASHION_PRODUCTS.slice(4, 8).map(p => ({ ...p, _displayName: p.name, _displayCat: p.category.name, _displayImg: p.media[0].media_url }));
  };

  const resolveBest = () => {
    if (homeProducts?.bestSelling?.length > 0) {
      return homeProducts.bestSelling.slice(0, 4).map((p, i) => {
        const ov = getOverride(p, i);
        return { ...p, _id: ov.id, _displayName: ov.name, _displayCat: ov.category, _displayImg: ov.img };
      });
    }
    return FASHION_PRODUCTS.slice(8, 12).map(p => ({ ...p, _displayName: p.name, _displayCat: p.category.name, _displayImg: p.media[0].media_url }));
  };

  const promoItems = resolvePromo();
  const newItems = resolveNew();
  const bestItems = resolveBest();

  return (
    <Layout>
      <div style={{ backgroundColor: '#fff' }}>

        {/* ── Hero Banner ── */}
        <div
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2)), url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            minHeight: '480px',
          }}
          className="d-flex align-items-center"
        >
          <div className="container-xl px-4 py-5">
            <div style={{ maxWidth: '520px' }}>
              <span className="text-white opacity-75 text-uppercase fw-bold mb-3 d-block" style={{ fontSize: '11px', letterSpacing: '3px' }}>
                NEW SEASON — SS 2025
              </span>
              <h1 className="text-white fw-bold mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: '1.1', fontFamily: 'Georgia, serif' }}>
                Elevate Your<br />Style Standard
              </h1>
              <p className="text-white opacity-75 mb-4" style={{ fontSize: '15px', lineHeight: '1.7', maxWidth: '400px' }}>
                Discover the Modern Elegance collection — curated fashion pieces designed for the modern individual, engineered for premium comfort and style.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/search" className="btn text-white fw-semibold px-4 py-2 rounded-2 d-flex align-items-center gap-2"
                  style={{ backgroundColor: '#111', fontSize: '14px' }}>
                  Shop Now <ArrowRight size={16} />
                </Link>
                <Link to="/search?sort=newest" className="btn fw-semibold px-4 py-2 rounded-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontSize: '14px', backdropFilter: 'blur(4px)' }}>
                  New Arrivals
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features strip ── */}
        <div style={{ backgroundColor: '#111' }}>
          <div className="container-xl px-4">
            <div className="row g-0">
              {[
                { icon: <Truck size={18} />, title: 'Free Shipping', sub: 'On orders over $100' },
                { icon: <RotateCcw size={18} />, title: '30-Day Returns', sub: 'Hassle-free guarantee' },
                { icon: <ShieldCheck size={18} />, title: 'Authenticity', sub: 'All items verified' },
              ].map((f, i) => (
                <div key={i} className="col-md-4 d-flex align-items-center gap-3 py-3 px-4 border-end border-secondary" style={{ borderColor: '#333 !important' }}>
                  <span className="text-white opacity-50">{f.icon}</span>
                  <div>
                    <p className="text-white fw-bold mb-0" style={{ fontSize: '13px' }}>{f.title}</p>
                    <p className="text-white opacity-50 mb-0" style={{ fontSize: '11px' }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="container-xl px-4 py-5">

          {/* Hot Promotions */}
          <div className="mb-5">
            <SectionHeader title="Hot Promotions" icon linkTo="/search?promo=true" />
            {isLoading ? (
              <div className="text-center py-5"><div className="spinner-border" role="status"></div></div>
            ) : (
              <div className="row g-3">
                {promoItems.map((p, i) => (
                  <ProductCard
                    key={p._id || i}
                    id={p._id}
                    name={p._displayName}
                    category={p._displayCat}
                    price={p.base_price || p.price}
                    oldPrice={p.base_price ? p.base_price * 1.35 : p.oldPrice}
                    badge={p.badge || ['35% OFF','30% OFF','SALE','HOT'][i % 4]}
                    badgeColor={['#e11d48','#e11d48','#f59e0b','#7c3aed'][i % 4]}
                    img={p._displayImg}
                    sold={p.sold_quantity || p.sold}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Category Quick Links */}
          <div className="mb-5 py-4 rounded-3" style={{ backgroundColor: '#f9f9f9' }}>
            <h2 className="fw-bold text-dark text-center mb-4" style={{ fontSize: '18px' }}>Shop by Category</h2>
            <div className="row g-3 px-3">
              {[
                { label: 'Tops', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80' },
                { label: 'Dresses', img: 'https://images.unsplash.com/photo-1568285521946-e414c1eb02b0?auto=format&fit=crop&w=400&q=80' },
                { label: 'Outerwear', img: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&q=80' },
                { label: 'Accessories', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80' },
                { label: 'Footwear', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80' },
                { label: 'Pants', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4992?auto=format&fit=crop&w=400&q=80' },
              ].map(cat => (
                <div key={cat.label} className="col-4 col-md-2">
                  <Link to={`/search?category=${cat.label}`} className="text-decoration-none">
                    <div className="rounded-3 overflow-hidden mb-2" style={{ aspectRatio: '1/1', backgroundColor: '#eee' }}>
                      <img src={cat.img} className="w-100 h-100" style={{ objectFit: 'cover' }} alt={cat.label} />
                    </div>
                    <p className="text-dark fw-medium text-center mb-0" style={{ fontSize: '12px' }}>{cat.label}</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* New Arrivals */}
          <div className="mb-5">
            <SectionHeader title="New Arrivals" icon linkTo="/search?sort=newest" />
            <div className="row g-3">
              {newItems.map((p, i) => (
                <ProductCard
                  key={p._id || i}
                  id={p._id}
                  name={p._displayName}
                  category={p._displayCat}
                  price={p.base_price || p.price}
                  img={p._displayImg}
                  sold={p.sold_quantity || p.sold}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>

          {/* Banner mid-page */}
          <div
            className="rounded-4 overflow-hidden mb-5 d-flex align-items-center"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.1)), url(https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '280px',
            }}
          >
            <div className="p-5">
              <p className="text-white opacity-75 text-uppercase fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '2px' }}>LIMITED OFFER</p>
              <h2 className="text-white fw-bold mb-3" style={{ fontSize: '28px', fontFamily: 'Georgia, serif' }}>
                Up to 40% off<br />Selected Styles
              </h2>
              <Link to="/search?promo=true" className="btn text-dark fw-semibold px-4 py-2 rounded-2"
                style={{ backgroundColor: '#fff', fontSize: '13px' }}>
                Shop the Sale
              </Link>
            </div>
          </div>

          {/* Best Sellers */}
          <div className="mb-5">
            <SectionHeader title="Best Sellers" icon linkTo="/search?sort=best_selling" />
            <div className="row g-3">
              {bestItems.map((p, i) => (
                <ProductCard
                  key={p._id || i}
                  id={p._id}
                  name={p._displayName}
                  category={p._displayCat}
                  price={p.base_price || p.price}
                  img={p._displayImg}
                  sold={p.sold_quantity || p.sold}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="rounded-4 text-center py-5 px-4" style={{ backgroundColor: '#111' }}>
            <p className="text-white opacity-50 text-uppercase fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '2px' }}>EXCLUSIVE MEMBER ACCESS</p>
            <h2 className="text-white fw-bold mb-2" style={{ fontSize: '26px', fontFamily: 'Georgia, serif' }}>Stay ahead of the curve.</h2>
            <p className="opacity-50 mb-4 mx-auto" style={{ color: '#fff', fontSize: '14px', maxWidth: '400px' }}>
              Join 50,000+ fashion enthusiasts. Get first access to drops, styling tips, and VIP pricing.
            </p>
            <div className="d-flex justify-content-center gap-2 mx-auto" style={{ maxWidth: '380px' }}>
              <input
                type="email"
                className="form-control rounded-2 border-0"
                placeholder="Your email address"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}
              />
              <button className="btn fw-bold rounded-2 px-4 text-dark" style={{ backgroundColor: '#fff', fontSize: '13px', whiteSpace: 'nowrap' }}>
                Subscribe
              </button>
            </div>
            <p className="opacity-25 mt-3 mb-0 text-white" style={{ fontSize: '10px', letterSpacing: '1px' }}>NO SPAM. UNSUBSCRIBE ANYTIME.</p>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Home;
