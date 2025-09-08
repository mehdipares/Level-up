import { useEffect, useState } from 'react';
import './QuoteOfTheDay.css';
import API_BASE from "../config/api";

import { useEffect, useState } from "react";
import API_BASE from "../config/api"; // 👈 ajoute cet import

export default function QuoteOfTheDay() {
  const [data, setData] = useState({ loading: true, error: null, quote: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/quotes/today?lang=fr`); // 👈 utilise API_BASE
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();      // { text, author, language }
        setData({ loading: false, error: null, quote: json });
      } catch (e) {
        setData({ loading: false, error: e.message, quote: null });
      }
    })();
  }, []);

  if (data.loading) return null;
  if (data.error || !data.quote) return null;

  return (
    <div className="quote-card">
      <p className="quote-text">{data.quote.text}</p>
      {data.quote.author && (
        <div className="quote-author">— {data.quote.author}</div>
      )}
    </div>
  );
}
