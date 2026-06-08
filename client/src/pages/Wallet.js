import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { walletAPI } from "../utils/api";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Wallet.css";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const Wallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifsc: "",
    accountHolder: ""
  });

  useEffect(() => {
    fetchWalletData();
    loadRazorpayScript();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRazorpayScript = useCallback(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.warn("Razorpay SDK failed to load");
    document.body.appendChild(script);
  }, []);

  const getNestedValue = (obj, path, fallback = null) => {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : fallback), obj);
  };

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [walletRes, transRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions()
      ]);

      const body = getNestedValue(walletRes, 'data', {});
      const walletData = body.wallet || body.data || body;

      const transBody = getNestedValue(transRes, 'data', {});
      const transData = transBody.data || transBody;

      setWallet(walletData);
      setTransactions(Array.isArray(transData) ? transData : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load wallet';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!addAmount || isNaN(addAmount) || Number(addAmount) < 1) {
      setError("Please enter a valid amount (min ₹1)");
      return;
    }
    if (!razorpayLoaded) {
      setError("Payment system not ready. Please wait.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { data } = await walletAPI.createTopupOrder({
        amount: Number(addAmount)
      });

      if (!data.orderId) {
        setError("Failed to initiate payment");
        setProcessing(false);
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ChessMaster Academy",
        description: "Wallet Top-up",
        order_id: data.orderId,
          handler: async function (response) {
          try {
            await walletAPI.verifyTopupPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(addAmount)
            });
            setAddAmount("");
            setShowAddFunds(false);
            fetchWalletData();
            setError(null);
          } catch (verifyErr) {
            setError("Payment verification failed. Please contact support if amount was deducted.");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || ""
        },
        theme: { color: "#2563eb" }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error?.description || "Please try again"}`);
        setProcessing(false);
      });
      razorpay.open();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to initiate payment";
      setError(msg);
      setProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) < 1) {
      setError("Please enter a valid withdrawal amount");
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifsc) {
      setError("Please fill bank account number and IFSC code");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await walletAPI.requestWithdrawal({
        amount: Number(withdrawAmount),
        bankDetails
      });
      setWithdrawAmount("");
      setBankDetails({ accountNumber: "", ifsc: "", accountHolder: "" });
      setShowWithdrawal(false);
      fetchWalletData();
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to request withdrawal";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      wallet_topup: "Wallet Top-up",
      booking_payment: "Session Payment",
      booking_refund: "Refund",
      coach_earning: "Coaching Earning",
      withdrawal: "Withdrawal"
    };
    return labels[reason] || reason || "Transaction";
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <h2>My Wallet</h2>
        <p>Manage your funds and transactions</p>
      </header>

      {error && (
        <div className="wallet-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="balance-card">
        <h3>Current Balance</h3>
        <p className="balance-amount">&#8377;{wallet?.balance?.toLocaleString() || 0}</p>
        {wallet?.pendingWithdrawal > 0 && (
          <p className="pending-info">
            &#8377;{wallet.pendingWithdrawal.toLocaleString()} pending withdrawal
          </p>
        )}
        <div className="balance-actions">
          <button className="btn btn-primary" onClick={() => { setError(null); setShowAddFunds(true); }}>
            + Add Funds
          </button>
          {user?.role === 'coach' && (
            <button className="btn btn-secondary" onClick={() => { setError(null); setShowWithdrawal(true); }}>
              Request Withdrawal
            </button>
          )}
        </div>
      </div>

      <section className="transactions-section">
        <h3>Transaction History</h3>
        {transactions.length > 0 ? (
          <div className="transactions-list">
            {transactions.map(tx => (
              <div key={tx._id} className="transaction-item">
                <div className="tx-info">
                  <p className="tx-desc">{tx.reason ? getReasonLabel(tx.reason) : tx.description || tx.type}</p>
                  <small>{new Date(tx.createdAt).toLocaleString()}</small>
                </div>
                <p className={`tx-amount ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                  {tx.type === 'credit' ? '+' : '-'}&#8377;{tx.amount}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No transactions yet</p>
        )}
      </section>

      <Modal open={showAddFunds} onClose={() => { setShowAddFunds(false); setError(null); }}>
        <h3>Add Funds to Wallet</h3>
        <div className="modal-form">
          <label>Amount (&#8377;)</label>
          <input
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
          />
          <p className="modal-info">You will be redirected to Razorpay to complete payment via UPI, Card, or Net Banking.</p>
          <button className="btn btn-primary" onClick={handleAddFunds} disabled={processing}>
            {processing ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </Modal>

      <Modal open={showWithdrawal} onClose={() => { setShowWithdrawal(false); setError(null); }}>
        <h3>Request Withdrawal</h3>
        <div className="modal-form">
          <label>Withdrawal Amount (&#8377;)</label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
          />

          <label>Bank Account Number</label>
          <input
            type="text"
            value={bankDetails.accountNumber}
            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
            placeholder="Account number"
          />

          <label>IFSC Code</label>
          <input
            type="text"
            value={bankDetails.ifsc}
            onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
            placeholder="IFSC code"
          />

          <label>Account Holder Name</label>
          <input
            type="text"
            value={bankDetails.accountHolder}
            onChange={(e) => setBankDetails({ ...bankDetails, accountHolder: e.target.value })}
            placeholder="Name as on bank account"
          />

          <button className="btn btn-primary" onClick={handleWithdrawal} disabled={processing}>
            {processing ? "Processing..." : "Request Withdrawal"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Wallet;
