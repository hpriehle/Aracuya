"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Currency = "USD" | "GHS";

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  formatPrice: (ghsAmount: number) => string;
}

// GHS per 1 USD. Prices are stored in GHS; USD is derived from this rate.
const FALLBACK_RATE = 11.6;
const CACHE_KEY = "aracuya_ghs_rate";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "GHS",
  toggleCurrency: () => {},
  formatPrice: (ghs) => `GH₵${ghs}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("GHS");
  const [rate, setRate] = useState(FALLBACK_RATE);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const { rate: cachedRate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        setRate(cachedRate);
        return;
      }
    }

    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data.rates?.GHS) {
          setRate(data.rates.GHS);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rate: data.rates.GHS, timestamp: Date.now() })
          );
        }
      })
      .catch(() => {
        // Use fallback rate silently
      });
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => (prev === "USD" ? "GHS" : "USD"));
  }, []);

  const formatPrice = useCallback(
    (ghsAmount: number) => {
      if (currency === "GHS") {
        return `GH₵${ghsAmount.toLocaleString("en-US")}`;
      }
      const converted = Math.round(ghsAmount / rate);
      return `$${converted}`;
    },
    [currency, rate]
  );

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
