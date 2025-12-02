import { useQuery } from '@tanstack/react-query';
import { analysisApi, simulationApi } from '../lib/api';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Analysis() {
  const { data: top25Data, isLoading, refetch } = useQuery({
    queryKey: ['analysis-top25'],
    queryFn: () => analysisApi.top25(),
  });

  const { data: simulationsData } = useQuery({
    queryKey: ['simulations-top25'],
    queryFn: () => simulationApi.top25(),
  });

  const handleRefresh = async () => {
    toast.loading('Atualizando análises...', { id: 'refresh' });
    try {
      await analysisApi.refresh();
      await refetch();
      toast.success('Análises atualizadas!', { id: 'refresh' });
    } catch (error) {
      toast.error('Erro ao atualizar análises', { id: 'refresh' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análises...</p>
        </div>
      </div>
    );
  }

  const analyses = top25Data?.data || [];
  const simulations = simulationsData?.data || [];

  // Cria um mapa de simulações por cryptoId
  const simulationMap = new Map(
    simulations.map((sim: any) => [sim.cryptoId, sim])
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Análises de Criptomoedas</h1>
          <p className="text-gray-600">Top 25 moedas mais promissoras com análise comportamental</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-primary"
        >
          Atualizar Análises
        </button>
      </div>

      {/* Análises Detalhadas */}
      <div className="grid gap-6">
        {analyses.map((analysis: any, index: number) => {
          const simulation = simulationMap.get(analysis.cryptoId);

          return (
            <div key={analysis.cryptoId} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-300">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{analysis.symbol}</h3>
                    <p className="text-sm text-gray-600">{analysis.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">${analysis.currentPrice?.toFixed(8)}</p>
                  <div className="flex items-center gap-2 justify-end mt-1">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                      analysis.trend === 'bullish' ? 'text-green-600' :
                      analysis.trend === 'bearish' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {analysis.trend === 'bullish' && <TrendingUp size={16} />}
                      {analysis.trend === 'bearish' && <TrendingDown size={16} />}
                      {analysis.trend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score e Métricas */}
              <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Score</p>
                  <p className={`text-2xl font-bold ${
                    analysis.score >= 70 ? 'text-green-600' :
                    analysis.score >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {analysis.score.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Volatilidade</p>
                  <p className="text-lg font-medium">{analysis.volatility?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">24h</p>
                  <p className={`text-lg font-medium ${
                    analysis.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analysis.change24h >= 0 ? '+' : ''}
                    {analysis.change24h?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">7 dias</p>
                  <p className={`text-lg font-medium ${
                    analysis.change7d >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analysis.change7d >= 0 ? '+' : ''}
                    {analysis.change7d?.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Recomendação */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      {analysis.recommendation}
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {analysis.reasons?.map((reason: string, i: number) => (
                        <li key={i}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Simulação de Investimento */}
              {simulation && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-green-600" size={20} />
                    <h4 className="font-semibold text-green-900">
                      Simulação de Investimento (7 dias)
                    </h4>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Investimento Inicial</p>
                      <p className="font-bold text-green-900">
                        ${simulation.initialAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Valor Final</p>
                      <p className="font-bold text-green-900">
                        ${simulation.finalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lucro/Prejuízo</p>
                      <p className={`font-bold ${
                        simulation.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {simulation.profitLoss >= 0 ? '+' : ''}
                        ${simulation.profitLoss.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Retorno</p>
                      <p className={`font-bold ${
                        simulation.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {simulation.profitLossPercent >= 0 ? '+' : ''}
                        {simulation.profitLossPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
