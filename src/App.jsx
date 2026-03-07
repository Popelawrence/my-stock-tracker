import { useState, useEffect } from 'react';
import { fetchStockPrice } from './api';
import './App.css';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Bell, AlertTriangle } from 'lucide-react';

function App() {
  const [ticker, setTicker] = useState('DIS');
  const [data, setData] = useState(null);
  const [fullHistory, setFullHistory] = useState([]);
  const [displayedHistory, setDisplayedHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1month');

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const filterByTimeRange = (data, range) => {
    const now = new Date();
    let cutoffDate = new Date();

    if (range === 'daily') cutoffDate.setDate(now.getDate() - 1);
    else if (range === '1week') cutoffDate.setDate(now.getDate() - 7);
    else if (range === '1month') cutoffDate.setMonth(now.getMonth() - 1);
    else if (range === '1year') cutoffDate.setFullYear(now.getFullYear() - 1);

    const filtered = data.filter(entry => {
      const entryDate = new Date(entry.time);
      return entryDate >= cutoffDate;
    });

    // Calculate 20-day moving average
    return filtered.map((entry, index) => {
      const start = Math.max(0, index - 19);
      const avg = filtered.slice(start, index + 1)
          .reduce((sum, e) => sum + e.price, 0) / (index - start + 1);
      return { ...entry, movingAvg: parseFloat(avg.toFixed(2)) };
    });
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setDisplayedHistory(filterByTimeRange(fullHistory, range));
  };

  const getLatestPrice = async () => {
    setLoading(true);
    try {
      const result = await fetchStockPrice(ticker);

      if (!result || result.price === 0) {
        setError(`Ticker "${ticker}" not found. Please enter a valid symbol or click the button below to reset.`);
        setData(null);
        return;
      }

      setError(null);
      setData(result);

      setFullHistory(prev => {
        const newHistory = [
          ...prev,
          {
            time: result.lastUpdated,
            price: result.price,
            symbol: ticker.toUpperCase()
          }
        ];
        return newHistory;
      });

      // Update displayed history based on current time range
      setDisplayedHistory(prev => {
        const newHistory = [
          ...prev,
          {
            time: result.lastUpdated,
            price: result.price,
            symbol: ticker.toUpperCase()
          }
        ];
        return filterByTimeRange(newHistory, timeRange);
      });if (targetPrice && result.price >= parseFloat(targetPrice)) {
        new Notification("Target Reached! 🚀", {
          body: `${ticker} has hit your target of $${targetPrice}. Current: $${result.price}`,
        });
        setTargetPrice('');
      }

    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLatestPrice();
    setFullHistory([]);
    setDisplayedHistory([]);
    setError(null);
    setTimeRange('1month');
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

              <section className="time-range-controls">
                {['daily', '1week', '1month', '1year'].map(range => (
                    <button
                        key={range}
                        className={`range-btn ${timeRange === range ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange(range)}
                    >
                      {range === 'daily' ? '1D' : range === '1week' ? '1W' : range === '1month' ? '1M' : '1Y'}
                    </button>
                ))}
              </section>

              <section className="chart-preview">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={displayedHistory}>
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#4ade80" : "#f87171"}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        name="Price"
                    />
                    <Line
                        type="monotone"
                        dataKey="movingAvg"
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={false}
                        name="20-Day MA"
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
                      <th>Ticker</th>
                      <th>Time</th>
                      <th>Price</th>
                      <th>20-Day MA</th>
                      <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {displayedHistory.slice().reverse().map((entry, index) => (
                        <tr key={index} className="fade-in">
                          <td className="ticker-label">{entry.symbol}</td>
                          <td>{entry.time}</td>
                          <td>${entry.price.toFixed(2)}</td>
                          <td>${entry.movingAvg.toFixed(2)}</td>
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
