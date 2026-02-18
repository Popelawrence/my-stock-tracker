import { useState, useEffect } from 'react';
import { fetchStockPrice } from './api';
import './App.css';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Bell, AlertTriangle } from 'lucide-react';

function App() {
  const [ticker, setTicker] = useState('DIS'); 
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState(null); // New state for error handling

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getLatestPrice = async () => {
    setLoading(true);
    try {
      const result = await fetchStockPrice(ticker);
      
      // Validation: Finnhub returns 0 for invalid tickers
      if (!result || result.price === 0) {
        setError(`Ticker "${ticker}" not found. Please enter a valid symbol or click the button below to reset.`);
        setData(null);
        return;
      }

      setError(null);
      setData(result);

      // Update history with new entry. We keep only the last 10 entries for performance. 
      setHistory(prev => {
        const newHistory = [
          ...prev, 
          { 
            time: result.lastUpdated, 
            price: result.price, 
            symbol: ticker.toUpperCase() // Added symbol to distinguish entries
          }
        ];
        return newHistory.slice(-10); 
      });

      if (targetPrice && result.price >= parseFloat(targetPrice)) {
        new Notification("Target Reached! 🚀", {
          body: `${ticker} has hit your target of $${targetPrice}. Current: $${result.price}`,
        });
        setTargetPrice('');   // Clear alert after firing
      }

    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest price on component mount and whenever ticker changes. Auto-refresh every 30 seconds
  useEffect(() => {
    getLatestPrice();
    const pulse = setInterval(getLatestPrice, 30000);
    return () => clearInterval(pulse);
  }, [ticker]);

  const isPositive = data?.percentChange >= 0;

  return (
    <div className="pulse-container">
      <header>
        <h1>StockPulse</h1>
        <div className={`status-pill ${loading ? 'syncing' : ''}`}>
          <RefreshCw size={14} /> {loading ? 'Syncing...' : 'Live'}
        </div>
      </header>

      {/* Error Message Display */}
      {error && (
        <div className="error-container fade-in">
          <AlertTriangle color="#f87171" size={32} />
          <p>{error}</p>
          <button className="reset-btn" onClick={() => {setTicker('DIS'); setError(null);}}>
            Return to Default
          </button>
        </div>
      )}

      {data && !error && (
        <main className="dashboard">
          <section className="price-card">
            <div className="ticker-info">
              <h2>{data.ticker}</h2>
              <span className="price">${data.price.toFixed(2)}</span>
            </div>
            
            <div className={`change-indicator ${isPositive ? 'up' : 'down'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {data.percentChange.toFixed(2)}%
            </div>
          </section>

          <section className="chart-preview">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={history}>
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#4ade80" : "#f87171"} 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: isPositive ? '#4ade80' : '#f87171' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="alert-setup">
            <div className="input-group">
              <Bell size={16} color="#94a3b8" />
              <input 
                type="number" 
                placeholder="Set Alert Price..." 
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
          </section>

          <section className="history-table-container">
            <h3>Recent Activity</h3>
            <div className="table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Ticker</th> {/* New Column */}
                    <th>Time</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((entry, index) => (
                    <tr key={index} className="fade-in">
                      <td className="ticker-label">{entry.symbol}</td>
                      <td>{entry.time}</td>
                      <td>${entry.price.toFixed(2)}</td>
                      <td>
                        <span className={`trend-pill ${isPositive ? 'up' : 'down'}`}>
                          {isPositive ? '↑' : '↓'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}
      
      <div className="controls">
        <input 
          className="ticker-input"
          placeholder="Search Ticker (e.g. AAPL)" 
          onKeyDown={(e) => e.key === 'Enter' && setTicker(e.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}

export default App;