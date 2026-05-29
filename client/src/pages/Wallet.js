import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { walletAPI } from "../utils/api";

const Wallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");

  const fetchWallet = useCallback(async () => {
    try {
      if (!user) return;

      const res = await walletAPI.getMyWallet();
      setWallet(res.data.wallet);

    } catch (err) {
      console.error("Wallet fetch error:", err);
      setWallet(null);
    }
  }, [user]);

  const addMoney = async () => {
    if (!amount || user.role !== "student") return;

    await walletAPI.addMoney({ amount: Number(amount) });
    setAmount("");
    fetchWallet();
  };

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  if (!wallet) return <p>Loading wallet...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>💰 My Wallet</h2>

      <h1>₹ {user.role === "coach" ? wallet.earnings : wallet.balance}</h1>

      {user.role === "student" && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={addMoney}>Add Money</button>
        </div>
      )}
    </div>
  );
};

export default Wallet;