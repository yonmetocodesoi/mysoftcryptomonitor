import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Rocket, Github, TrendingUp, RefreshCw } from 'lucide-react';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Crypto {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  last_updated: string;
}

interface PriceHistory {
  timestamp: string;
  price: number;
}

function App() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedPrices, setUpdatedPrices] = useState<Set<string>>(new Set());
  const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [page, setPage] = useState(1);
  const chartRef = useRef<any>(null);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100, // Aumentado para 100 moedas
            page: page,
            sparkline: false,
          },
          headers: {
            'x-cg-demo-api-key': 'CG-y7A6GstRRuLEitbFTpNcqt5y'
          }
        }
      );
      
      const newUpdatedPrices = new Set<string>();
      response.data.forEach((newCrypto: Crypto) => {
        const oldCrypto = cryptos.find(c => c.id === newCrypto.id);
        if (oldCrypto && oldCrypto.current_price !== newCrypto.current_price) {
          newUpdatedPrices.add(newCrypto.id);
        }
      });
      setUpdatedPrices(newUpdatedPrices);
      
      setCryptos(response.data);

      const selectedCryptoData = response.data.find((crypto: Crypto) => crypto.id === selectedCrypto);
      if (selectedCryptoData) {
        setPriceHistory(prev => {
          const newHistory = [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            price: selectedCryptoData.current_price
          }];
          return newHistory.slice(-20);
        });

        if (chartRef.current) {
          const chart = chartRef.current;
          chart.update('active');
        }
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch crypto data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 5000);
    return () => clearInterval(interval);
  }, [selectedCrypto, page]);

  const gradientFill = (context: any) => {
    if (context) {
      const chart = context.chart;
      const {ctx, chartArea} = chart;
      if (!chartArea) return null;
      
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
      return gradient;
    }
    return null;
  };

  const chartData = {
    labels: priceHistory.map(item => item.timestamp),
    datasets: [
      {
        label: `${selectedCrypto.toUpperCase()} Price (USD)`,
        data: priceHistory.map(item => item.price),
        borderColor: '#00ffff',
        backgroundColor: gradientFill,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#00ffff',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00ffff',
        fill: true,
        pointRadius: 4,
        pointStyle: 'circle',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
          font: {
            family: 'monospace'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'monospace',
          size: 14
        },
        bodyFont: {
          family: 'monospace',
          size: 12
        },
        borderColor: '#00ffff',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            return `$ ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#fff',
          font: {
            family: 'monospace'
          },
          callback: (value: any) => `$${value.toLocaleString()}`
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#fff',
          font: {
            family: 'monospace'
          }
        }
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    transitions: {
      active: {
        animation: {
          duration: 750
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const handleCryptoChange = (cryptoId: string) => {
    setSelectedCrypto(cryptoId);
    setPriceHistory([]);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setLoading(true);
  };

  return (
    <div className="min-h-screen cyberpunk-bg text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-mono neon-text flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          MySoft Crypto
        </h1>
        <div className="flex gap-4">
          <button
            onClick={fetchCryptoData}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition-all glitch-effect"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <a
            href="https://github.com/yonmetocodesoi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-8 crypto-item">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="chart-container p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-mono chart-title neon-text">Real-time Price Chart</h2>
            <select
              value={selectedCrypto}
              onChange={(e) => handleCryptoChange(e.target.value)}
              className="bg-black/50 border border-cyan-500/30 text-white px-3 py-1 rounded-lg font-mono focus:outline-none focus:border-cyan-500"
            >
              {cryptos.map(crypto => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name}
                </option>
              ))}
            </select>
          </div>
          <Line ref={chartRef} data={chartData} options={chartOptions} className="data-point" />
          <p className="text-center text-sm text-gray-400 mt-2">
            Updating every 5 seconds
          </p>
        </div>

        <div className="crypto-card p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-mono mb-4 neon-text">Top Cryptocurrencies</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-cyan-600/30 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-black/30 rounded-lg">
                Page {page}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1 bg-cyan-600/30 rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
              </div>
            ) : (
              cryptos.map((crypto, index) => (
                <div
                  key={crypto.id}
                  className={`crypto-item flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-all cursor-pointer ${selectedCrypto === crypto.id ? 'border border-cyan-500' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleCryptoChange(crypto.id)}
                >
                  <div className="flex items-center gap-3">
                    <img src={crypto.image} alt={crypto.name} className="w-8 h-8" />
                    <div>
                      <h3 className="font-mono">{crypto.name}</h3>
                      <p className="text-gray-400 text-sm">{crypto.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono ${updatedPrices.has(crypto.id) ? 'price-update' : ''}`}>
                      ${crypto.current_price.toLocaleString()}
                    </p>
                    <p 
                      className={`${
                        crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'
                      } ${updatedPrices.has(crypto.id) ? 'price-pulse' : ''}`}
                    >
                      {crypto.price_change_percentage_24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-400 font-mono">
        <p className="flex items-center justify-center gap-2">
          Powered by MySoft <Rocket className="w-4 h-4" /> 
        </p>
      </footer>
    </div>
  );
}

export default App;