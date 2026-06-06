import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { walletAPI } from "../utils/api";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Wallet.css";

const Wallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifsc: "",
    accountHolder: ""
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, transRes] = await Promise.all([
        walletAPI.getWallet() || Promise.resolve({ data: {} }),
        walletAPI.getTransactions() || Promise.resolve({ data: [] })
      ]);

      setWallet(walletRes.data);
      setTransactions(transRes.data || []);
    } catch (err) {
      console.error("Error fetching wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!addAmount || isNaN(addAmount) || Number(addAmount) < 1) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      // 1. Create Order
      const { data } = await walletAPI.createTopupOrder({
        amount: Number(addAmount)
      });

      if (!data.orderId) {
        alert("Failed to initiate payment");
        return;
      }

      // 2. Open Razorpay Modal
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ChessMaster Academy",
        description: "Wallet Top-up",
        order_id: data.orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            await walletAPI.verifyTopupPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(addAmount)
            });

            alert("Funds added successfully!");
            setAddAmount("");
            setShowAddFunds(false);
            fetchWalletData();
          } catch (error) {
            alert("Payment verification failed");
            console.error(error);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: { color: "#2563eb" }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment");
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawAmount || !bankDetails.accountNumber || !bankDetails.ifsc) {
      alert("Please fill all withdrawal details");
      return;
    }

    try {
      await walletAPI.requestWithdrawal({
        amount: Number(withdrawAmount),
        bankDetails
      });
      setWithdrawAmount("");
      setBankDetails({ accountNumber: "", ifsc: "", accountHolder: "" });
      setShowWithdrawal(false);
      fetchWalletData();
      alert("Withdrawal request submitted!");
    } catch (err) {
      alert("Failed to request withdrawal");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <h2>💳 My Wallet</h2>
        <p>Manage your funds and transactions</p>
      </header>

      {/* BALANCE CARD */}
      <div className="balance-card">
        <h3>Current Balance</h3>
        <p className="balance-amount">₹{wallet?.balance?.toLocaleString() || 0}</p>
        <div className="balance-actions">
          <button className="btn btn-primary" onClick={() => setShowAddFunds(true)}>
            + Add Funds
          </button>
          {user?.role === 'coach' && (
            <button className="btn btn-secondary" onClick={() => setShowWithdrawal(true)}>
              Request Withdrawal
            </button>
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <section className="transactions-section">
        <h3>📋 Transaction History</h3>
        {transactions.length > 0 ? (
          <div className="transactions-list">
            {transactions.map(tx => (
              <div key={tx._id} className="transaction-item">
                <div className="tx-info">
                  <p className="tx-desc">{tx.description || tx.type}</p>
                  <small>{new Date(tx.createdAt).toLocaleString()}</small>
                </div>
                <p className={`tx-amount ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No transactions yet</p>
        )}
      </section>

      {/* ADD FUNDS MODAL */}
      <Modal open={showAddFunds} onClose={() => setShowAddFunds(false)}>
        <h3>Add Funds to Wallet</h3>
        <div className="modal-form">
          <label>Amount (₹)</label>
          <input
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="Enter amount"
            min="100"
          />
          <button className="btn btn-primary" onClick={handleAddFunds}>
            Add Funds
          </button>
        </div>
      </Modal>

      {/* WITHDRAWAL MODAL */}
      <Modal open={showWithdrawal} onClose={() => setShowWithdrawal(false)}>
        <h3>Request Withdrawal</h3>
        <div className="modal-form">
          <label>Withdrawal Amount (₹)</label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount"
            min="1000"
          />

          <label>Bank Account Number</label>
          <input
            type="text"
            value={bankDetails.accountNumber}
            onChange={(e) =>
              setBankDetails({ ...bankDetails, accountNumber: e.target.value })
            }
            placeholder="Account number"
          />

          <label>IFSC Code</label>
          <input
            type="text"
            value={bankDetails.ifsc}
            onChange={(e) =>
              setBankDetails({ ...bankDetails, ifsc: e.target.value })
            }
            placeholder="IFSC code"
          />

          <label>Account Holder Name</label>
          <input
            type="text"
            value={bankDetails.accountHolder}
            onChange={(e) =>
              setBankDetails({ ...bankDetails, accountHolder: e.target.value })
            }
            placeholder="Name"
          />

          <button className="btn btn-primary" onClick={handleWithdrawal}>
            Request Withdrawal
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Wallet;