import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cryptoApi, simulationApi } from '../lib/api';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Simulation() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cryptoId: '',
    amount: 50,
    days: 7,
  });

  const queryClient = useQueryClient();

  const { data: cryptosData } = useQuery({
    queryKey: ['cryptos'],
    queryFn: () => cryptoApi.list({ limit: 100 }),
  });

  const { data: simulationsData, isLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => simulationApi.list(),
  });

  const { data: portfolioData } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => simulationApi.portfolio(),
  });

  const createSimulation = useMutation({
    mutationFn: (data: any) => simulationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setShowForm(false);
      setFormData({ cryptoId: '', amount: 50, days: 7 });
      toast.success('Simulação criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar simulação');
    },
  });

  const addToPortfolio = useMutation({
    mutationFn: (data: { cryptoId: number; amount: number }) =>
      simulationApi.addToPortfolio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Adicionado ao portfólio!');
    },
    onError: () => {
      toast.error('Erro ao adicionar ao portfólio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSimulation.mutate({
      cryptoId: parseInt(formData.cryptoId),
      amount: formData.amount,
      days: formData.days,
    });
  };

  const cryptos = cryptosData?.data?.data || [];
  const simulations = simulationsData?.data || [];
  const portfolio = portfolioData?.data || [];

  const portfolioValue = portfolio.reduce((sum: number, item: any) => sum + item.current_value, 0);
  const portfolioInvested = portfolio.reduce((sum: number, item: any) => sum + item.buy_value, 0);
  const portfolioProfit = portfolioValue - portfolioInvested;
  const portfolioProfitPercent = portfolioInvested > 0 ? (portfolioProfit / portfolioInvested) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando simulações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Simulador de Investimentos</h1>
          <p className="text-gray-600">Teste estratégias sem risco real</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Simulação
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Criar Nova Simulação</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Criptomoeda</label>
              <select
                value={formData.cryptoId}
                onChange={(e) => setFormData({ ...formData, cryptoId: e.target.value })}
                className="input"
                required
              >
                <option value="">Selecione uma criptomoeda</option>
                {cryptos.map((crypto: any) => (
                  <option key={crypto.id} value={crypto.id}>
                    {crypto.symbol} - {crypto.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor (USD)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="input"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Período (dias)</label>
                <input
                  type="number"
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                  className="input"
                  min="1"
                  max="365"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={createSimulation.isPending}>
                {createSimulation.isPending ? 'Criando...' : 'Criar Simulação'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-2">Valor Investido</p>
            <p className="text-2xl font-bold">${portfolioInvested.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-2">Valor Atual</p>
            <p className="text-2xl font-bold">${portfolioValue.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-2">Lucro/Prejuízo</p>
            <p className={`text-2xl font-bold ${
              portfolioProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioProfit >= 0 ? '+' : ''}${portfolioProfit.toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-2">Retorno</p>
            <p className={`text-2xl font-bold ${
              portfolioProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioProfitPercent >= 0 ? '+' : ''}
              {portfolioProfitPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Table */}
      {portfolio.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Meu Portfólio Simulado</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Moeda</th>
                  <th className="text-right py-3 px-4">Quantidade</th>
                  <th className="text-right py-3 px-4">Preço Compra</th>
                  <th className="text-right py-3 px-4">Preço Atual</th>
                  <th className="text-right py-3 px-4">Valor Investido</th>
                  <th className="text-right py-3 px-4">Valor Atual</th>
                  <th className="text-right py-3 px-4">Lucro/Prejuízo</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{item.symbol}</p>
                        <p className="text-xs text-gray-500">{item.name}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-mono">
                      {parseFloat(item.amount).toFixed(8)}
                    </td>
                    <td className="text-right py-3 px-4 font-mono">
                      ${parseFloat(item.buy_price).toFixed(8)}
                    </td>
                    <td className="text-right py-3 px-4 font-mono">
                      ${item.current_price.toFixed(8)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${item.buy_value.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${item.current_value.toFixed(2)}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      item.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.profit_loss >= 0 ? '+' : ''}${item.profit_loss.toFixed(2)}
                      <span className="text-xs block">
                        ({item.profit_loss_percent >= 0 ? '+' : ''}
                        {item.profit_loss_percent.toFixed(2)}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulations History */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Histórico de Simulações</h2>

        {simulations.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhuma simulação realizada ainda. Crie sua primeira simulação!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Moeda</th>
                  <th className="text-right py-3 px-4">Valor Inicial</th>
                  <th className="text-right py-3 px-4">Valor Final</th>
                  <th className="text-right py-3 px-4">Lucro/Prejuízo</th>
                  <th className="text-right py-3 px-4">Retorno</th>
                  <th className="text-left py-3 px-4">Data</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim: any) => (
                  <tr key={sim.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{sim.symbol}</p>
                        <p className="text-xs text-gray-500">{sim.name}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      ${parseFloat(sim.initial_amount).toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${parseFloat(sim.final_amount).toFixed(2)}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      parseFloat(sim.profit_loss) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(sim.profit_loss) >= 0 ? '+' : ''}
                      ${parseFloat(sim.profit_loss).toFixed(2)}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      parseFloat(sim.profit_loss_percent) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(sim.profit_loss_percent) >= 0 ? '+' : ''}
                      {parseFloat(sim.profit_loss_percent).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
