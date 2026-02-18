import { useState, useEffect } from 'react';
import { fetchStockPrice } from './api';
import './App.css';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Bell } from 'lucide-react';

function App() {
  const [ticker, setTicker] = useState('DIS'); 
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  // 1. Request Browser Notification Permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getLatestPrice = async () => {
    setLoading(true);
    try {
      const result = await fetchStockPrice(ticker);
      setData(result);
      
      // Data Engineering: Maintain a sliding window of the last 10 entries
      setHistory(prev => {
        const newHistory = [...prev, { time: result.lastUpdated, price: result.price }];
        return newHistory.slice(-10); 
      });

      // 2. Alert Logic
      if (targetPrice && result.price >= parseFloat(targetPrice)) {
        new Notification("Target Reached! 🚀", {
          body: `${ticker} has hit your target of $${targetPrice}. Current: $${result.price}`,
        });
        setTargetPrice(''); // Clear alert after firing
      }

    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. The "Pulse" - Auto-refresh every 30 seconds
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

      {data && (
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
            {targetPrice && <p className="alert-msg">Alerting at ${targetPrice}</p>}
          </section>

          <section className="history-table-container">
            <h3>Recent Activity</h3>
            <div className="table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((entry, index) => (
                    <tr key={index} className="fade-in">
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