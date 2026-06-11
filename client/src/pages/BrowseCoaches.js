import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import CoachCard from '../components/CoachCard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/BrowseCoaches.css';

const BrowseCoaches = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [filteredCoaches, setFilteredCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    minRating: 0,
    maxRating: 3000,
    minPrice: 0,
    maxPrice: 10000,
    sortBy: 'rating'
  });

  const fetchCoaches = useCallback(async () => {
    try {
      const { data } = await userAPI.getCoaches();
      const coachesData = data?.coaches || [];
      setCoaches(coachesData);
      setFilteredCoaches(coachesData);
    } catch (error) {
      console.error("Error fetching coaches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  // Determine lowest slot price
  const getLowestPrice = useCallback((coach) => {
    if (!coach.slots || coach.slots.length === 0) return null;
    const prices = coach.slots.map((s) => s.price);
    return Math.min(...prices);
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = useCallback(() => {
    let filtered = [...coaches];

    // Name Search
    if (filters.search) {
      filtered = filtered.filter((coach) =>
        (coach.name || '').toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Rating Filters
    if (filters.minRating) {
      filtered = filtered.filter(
        (coach) => coach.chessRating >= Number(filters.minRating)
      );
    }

    if (filters.maxRating) {
      filtered = filtered.filter(
        (coach) => coach.chessRating <= Number(filters.maxRating)
      );
    }

    // Price Filters (using slot price)
    if (filters.minPrice) {
      filtered = filtered.filter((coach) => {
        const price = getLowestPrice(coach);
        return price !== null && price >= Number(filters.minPrice);
      });
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((coach) => {
        const price = getLowestPrice(coach);
        return price !== null && price <= Number(filters.maxPrice);
      });
    }

    setFilteredCoaches(filtered);
  }, [coaches, filters, getLowestPrice]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCoachClick = (coachId) => {
    navigate(`/coach/${coachId}`);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      minRating: "",
      maxRating: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "rating"
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="browse-container">
      {/* Header */}
      <header className="browse-header">
        <h2 className="browse-title">Find Your Perfect Chess Coach</h2>
        <p className="browse-subtitle">
          Browse expert coaches and start improving your chess skills today.
        </p>
      </header>

      {/* Filters */}
      <div className="filters-container">
        <input
          type="text"
          name="search"
          placeholder="Search by name"
          className="filter-input"
          value={filters.search}
          onChange={handleFilterChange}
        />

        <input
          type="number"
          name="minRating"
          placeholder="Min Rating"
          className="filter-input"
          value={filters.minRating}
          onChange={handleFilterChange}
        />

        <input
          type="number"
          name="maxRating"
          placeholder="Max Rating"
          className="filter-input"
          value={filters.maxRating}
          onChange={handleFilterChange}
        />

        <input
          type="number"
          name="minPrice"
          placeholder="Min Price (₹)"
          className="filter-input"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />

        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price (₹)"
          className="filter-input"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />

        <button className="clear-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Results count */}
      <p className="results-count">
        {filteredCoaches.length} coach{filteredCoaches.length !== 1 ? "es" : ""} found
      </p>

      {/* Coaches List */}
      {filteredCoaches.length > 0 ? (
        <div className="coach-grid">
          {filteredCoaches.map((coach) => (
            <div key={coach._id} onClick={() => handleCoachClick(coach._id)}>
              <CoachCard coach={{ ...coach, lowestPrice: getLowestPrice(coach) }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No coaches found</h3>
          <p>Try adjusting your filters or check again later.</p>
          <button className="clear-btn" onClick={clearFilters}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseCoaches;