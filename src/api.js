// src/api.js
export const normalizeStockData = (rawData, symbol) => {
  // Extracting only the values we need for the UI
  return {
    ticker: symbol.toUpperCase(),
    price: rawData.c, // 'c' is the current price in Finnhub
    high: rawData.h,
    low: rawData.l,
    change: rawData.d,
    percentChange: rawData.dp,
    lastUpdated: new Date().toLocaleTimeString()
  };
};

export const fetchStockPrice = async (symbol) => {
  const API_KEY = import.meta.env.VITE_FINNHUB_KEY; 
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
  );
  const data = await response.json();
  return normalizeStockData(data, symbol);
};