import React, { useEffect, useState } from "react";
import { walletAPI } from "../utils/api";

const CoachEarnings = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    walletAPI.getEarnings().then(res => setData(res.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>📈 Coach Earnings</h2>

      <h1>Total: ₹ {data.totalEarnings}</h1>

      <ul>
        {data.transactions.map(t => (
          <li key={t._id}>
            ₹{t.amount} – {new Date(t.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CoachEarnings;