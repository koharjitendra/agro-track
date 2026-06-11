import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiMapPin, FiStar, FiShoppingCart, FiFilter } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import * as marketplaceApi from '../../../api/marketplace.api.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { useCartStore } from '../../../store/cart.store.js';
import { formatMoney } from '../../../utils/money.js';

const SORT_OPTIONS = [
  { value: '', label: 'Latest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating_desc', label: 'Top Rated' },
];

const StarRating = ({ score = 5, count = 0 }) => (
  <div className="mp-stars">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(score) ? 'mp-star filled' : 'mp-star'}>★</span>
    ))}
    <span className="mp-star-score">{Number(score).toFixed(1)} ({count})</span>
  </div>
);

const CropCard = ({ listing, onAddToCart, isBuyer }) => {
  const farmer = listing.farmerId;

  return (
    <div className="mp-card">
      <div className="mp-card-img">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.productName} />
        ) : (
          <div className="mp-card-img-placeholder">
            <span>🌾</span>
          </div>
        )}
        <span className={`mp-card-badge mp-badge-${listing.status?.toLowerCase().replace(/_/g, '-')}`}>
          {listing.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="mp-card-body">
        <h3 className="mp-card-name">{listing.productName}</h3>

        {listing.category && (
          <span className="text-xs text-gray-400 bg-zinc-700/50 px-2 py-0.5 rounded mb-1 inline-block">
            {listing.category}
          </span>
        )}

        {listing.description && (
          <p className="mp-card-desc">{listing.description}</p>
        )}

        <div className="mp-card-price">
          <span className="mp-price-value">{formatMoney(listing.price)}</span>
          <span className="mp-price-unit">/ {listing.unit || 'kg'}</span>
        </div>

        <div className="mp-card-meta">
          {listing.quantity > 0 && (
            <span className="mp-meta-tag">
              📦 {listing.quantity} {listing.unit || 'kg'} available
            </span>
          )}
          {listing.location && (
            <span className="mp-meta-tag">
              <FiMapPin className="inline" /> {listing.location}
            </span>
          )}
        </div>

        <div className="mp-card-farmer">
          <div className="mp-farmer-avatar">{farmer?.name?.slice(0, 2).toUpperCase()}</div>
          <div className="mp-farmer-info">
            <p className="mp-farmer-name">{farmer?.name || 'Unknown Farmer'}</p>
            <StarRating score={farmer?.trustScore} count={farmer?.ratingsCount} />
          </div>
        </div>

        {isBuyer && (
          <button
            className="mp-add-cart-btn"
            onClick={() => onAddToCart(listing)}
            disabled={!listing.quantity || !listing.availability}
          >
            <FiShoppingCart />
            {listing.quantity && listing.availability ? 'Add to Cart' : 'Out of Stock'}
          </button>
        )}
      </div>
    </div>
  );
};

const Marketplace = () => {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const isBuyer = user?.role === 'BUYER';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (sort) params.sort = sort;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const res = await marketplaceApi.getMarketplaceCrops(params);
      setListings(res.data || []);
    } catch {
      toast.error('Failed to load marketplace.');
    } finally {
      setLoading(false);
    }
  }, [search, sort, minPrice, maxPrice]);

  useEffect(() => {
    const t = setTimeout(fetchListings, 300);
    return () => clearTimeout(t);
  }, [fetchListings]);

  const handleAddToCart = (listing) => {
    addToCart(listing);
    toast.success(`${listing.productName} added to cart!`);
  };

  return (
    <div className="mp-page fade-in">
      <div className="mp-header">
        <div>
          <h1 className="mp-title">Marketplace</h1>
          <p className="mp-subtitle">{listings.length} product{listings.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Search + Sort bar */}
      <div className="mp-toolbar">
        <div className="mp-search-wrap">
          <FiSearch className="mp-search-icon" />
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search crops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="mp-sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          className={`mp-filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mp-filter-panel">
          <div className="mp-filter-row">
            <label>Min Price (₹/KG)</label>
            <input
              type="number"
              className="mp-filter-input"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="mp-filter-row">
            <label>Max Price (₹/KG)</label>
            <input
              type="number"
              className="mp-filter-input"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              min="0"
            />
          </div>
          <button className="mp-filter-clear" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <Loader />
      ) : listings.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon">🌾</span>
          <h3>No products found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {listings.map((listing) => (
            <CropCard
              key={listing._id}
              listing={listing}
              onAddToCart={handleAddToCart}
              isBuyer={isBuyer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
