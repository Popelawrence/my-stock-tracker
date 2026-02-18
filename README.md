# StockPulse: Real-Time Financial Dashboard

StockPulse is a high-frequency data monitoring application built to track market volatility and price movements. It features a sliding-window data architecture to visualize real-time trends for specific equities, including **The Walt Disney Company ($DIS)**.

## 🚀 Key Engineering Features

- **Real-Time Polling Engine**: Implemented an asynchronous data fetching cycle that polls the Finnhub API every 30 seconds, simulating a live market feed.
- **Sliding Window Visualization**: Designed a data pipeline that maintains a rolling buffer of the latest 10 price points to ensure constant-time $O(1)$ memory consumption while providing historical context via Recharts.
- **Complex Event Processing (CEP)**: Built a proactive alerting system that monitors price thresholds and triggers Browser API Notifications when specific financial conditions are met.
- **Data Normalization Layer**: Developed a transformation utility to map heterogeneous API responses into a unified schema for consistent UI rendering.

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite)
- **Styling**: Modern CSS3 (Dark Mode Optimized)
- **Data Visualization**: Recharts (D3-based)
- **Icons**: Lucide-React
- **API**: Finnhub Stock API

## 📈 System Architecture

[Image of a real-time data flow diagram from Finnhub API to React state and UI components]

1. **Extraction**: `fetchStockPrice` handles the network request to the Finnhub quote endpoint.
2. **Transformation**: The raw JSON is normalized into an object containing price, percentage change, and localized timestamps.
3. **Loading**: The transformed data is pushed into the `history` state array using an immutable update pattern.
4. **Monitoring**: A side-effect hook evaluates the current price against the `targetPrice` state to trigger notifications.

## 🏁 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Finnhub API Key

### Installation
1. Clone the repo:
   ```bash
   git clone [https://github.com/Popelawrence/stock-pulse.git](https://github.com/Popelawrence/stock-pulse.git)