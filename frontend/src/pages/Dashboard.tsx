import { useQuery } from '@tanstack/react-query';
import { cryptoApi, analysisApi } from '../lib/api';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import CryptoChart from '../components/CryptoChart';
import { useState } from 'react';

export default function Dashboard() {
  const [selectedCrypto, setSelectedCrypto] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState('1h');

  const { data: cryptosData, isLoading: loadingCryptos } = useQuery({
    queryKey: ['cryptos'],
    queryFn: () => cryptoApi.list({ limit: 50 }),
  });

  const { data: top25Data, isLoading: loadingTop25 } = useQuery({
    queryKey: ['analysis-top25'],
    queryFn: () => analysisApi.top25(),
  });

  const { data: historyData } = useQuery({
    queryKey: ['crypto-history', selectedCrypto, timeframe],
    queryFn: () => selectedCrypto ? cryptoApi.getHistory(selectedCrypto, timeframe) : null,
    enabled: !!selectedCrypto,
  });

  const cryptos = cryptosData?.data?.data || [];
  const top25 = top25Data?.data || [];

  // Estatísticas gerais
  const stats = {
    bullish: top25.filter((c: any) => c.trend === 'bullish').length,
    bearish: top25.filter((c: any) => c.trend === 'bearish').length,
    neutral: top25.filter((c: any) => c.trend === 'neutral').length,
    avgScore: top25.reduce((sum: number, c: any) => sum + c.score, 0) / (top25.length || 1),
  };

  if (loadingCryptos || loadingTop25) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do mercado de criptomoedas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Tendência Alta</span>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.bullish}</p>
          <p className="text-xs text-gray-500 mt-1">cryptos em alta</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Tendência Baixa</span>
            <TrendingDown className="text-red-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.bearish}</p>
          <p className="text-xs text-gray-500 mt-1">cryptos em queda</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Neutras</span>
            <Activity className="text-gray-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-600">{stats.neutral}</p>
          <p className="text-xs text-gray-500 mt-1">cryptos estáveis</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Score Médio</span>
            <DollarSign className="text-primary-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-primary-600">{stats.avgScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">de 100 pontos</p>
        </div>
      </div>

      {/* Chart Section */}
      {selectedCrypto && historyData && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Histórico de Preços</h2>
            <div className="flex gap-2">
              {['1m', '5m', '15m', '1h', '2h'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <CryptoChart data={historyData.data.data} />
        </div>
      )}

      {/* Top Cryptos Table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Top Criptomoedas</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Moeda</th>
                <th className="text-right py-3 px-4">Preço</th>
                <th className="text-right py-3 px-4">24h</th>
                <th className="text-right py-3 px-4">7d</th>
                <th className="text-right py-3 px-4">Score</th>
                <th className="text-left py-3 px-4">Tendência</th>
                <th className="text-left py-3 px-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {top25.slice(0, 15).map((crypto: any) => {
                const cryptoData = cryptos.find((c: any) => c.symbol === crypto.symbol);
                return (
                  <tr key={crypto.cryptoId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{crypto.symbol}</p>
                        <p className="text-xs text-gray-500">{crypto.name}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-mono">
                      ${crypto.currentPrice?.toFixed(8) || '0.00'}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.change24h >= 0 ? '+' : ''}
                      {crypto.change24h?.toFixed(2) || '0.00'}%
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      crypto.change7d >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.change7d >= 0 ? '+' : ''}
                      {crypto.change7d?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        crypto.score >= 70 ? 'bg-green-100 text-green-800' :
                        crypto.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {crypto.score.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        crypto.trend === 'bullish' ? 'text-green-600' :
                        crypto.trend === 'bearish' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {crypto.trend === 'bullish' && <TrendingUp size={16} />}
                        {crypto.trend === 'bearish' && <TrendingDown size={16} />}
                        {crypto.trend === 'neutral' && <Activity size={16} />}
                        {crypto.trend}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedCrypto(crypto.cryptoId)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver Gráfico
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
