import React, { useEffect, useState } from "react";
import { walletAPI } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Dashboard.css";

const CoachEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [earningsRes, transRes] = await Promise.all([
        walletAPI.getEarnings?.() || Promise.resolve({ data: {} }),
        walletAPI.getTransactions?.() || Promise.resolve({ data: [] })
      ]);

      setEarnings(earningsRes.data);
      const txData = transRes.data;
      setTransactions(Array.isArray(txData) ? txData : txData?.data || []);
    } catch (err) {
      console.error("Error fetching earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    if (!Array.isArray(transactions)) return [];
    switch (filter) {
      case "pending":
        return transactions.filter(t => t.status === "pending");
      case "completed":
        return transactions.filter(t => t.status === "completed");
      default:
        return transactions;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>📈 My Earnings</h2>
        <p>Track your coaching earnings</p>
      </header>

      {/* EARNINGS STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <h3>₹{earnings?.totalEarnings?.toLocaleString() || 0}</h3>
          <p>Total Earnings</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <h3>₹{earnings?.monthlyEarnings?.toLocaleString() || 0}</h3>
          <p>This Month</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <h3>₹{earnings?.pendingAmount?.toLocaleString() || 0}</h3>
          <p>Pending Payout</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <h3>₹{earnings?.completedPayouts?.toLocaleString() || 0}</h3>
          <p>Completed Payouts</p>
        </div>
      </div>

      {/* EARNINGS TABLE */}
      <section className="dashboard-section">
        <h3>Transaction History</h3>

        {/* FILTERS */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>

        {/* TABLE */}
        {getFilteredTransactions().length > 0 ? (
          <div className="earnings-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredTransactions().map(tx => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>{tx.description || tx.type}</td>
                    <td>₹{tx.amount}</td>
                    <td>
                      <span className={`badge badge-${tx.status}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No earnings yet</p>
        )}
      </section>
    </div>
  );
};

export default CoachEarnings;