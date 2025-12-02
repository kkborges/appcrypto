import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, sourcesApi } from '../lib/api';
import { RefreshCw, Database, Search, TrendingUp, Users, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Admin() {
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'api' });
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats(),
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users(),
  });

  const collectData = useMutation({
    mutationFn: () => adminApi.collect(),
    onSuccess: () => {
      toast.success('Coleta de dados iniciada!');
    },
    onError: () => {
      toast.error('Erro ao iniciar coleta');
    },
  });

  const validateSources = useMutation({
    mutationFn: () => adminApi.validateSources(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Validação de fontes concluída!');
    },
    onError: () => {
      toast.error('Erro ao validar fontes');
    },
  });

  const runAnalysis = useMutation({
    mutationFn: () => adminApi.analyze(),
    onSuccess: () => {
      toast.success('Análise completa iniciada!');
    },
    onError: () => {
      toast.error('Erro ao iniciar análise');
    },
  });

  const addSource = useMutation({
    mutationFn: (data: any) => sourcesApi.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      setShowAddSource(false);
      setNewSource({ name: '', url: '', type: 'api' });
      toast.success('Fonte adicionada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar fonte');
    },
  });

  const deleteSource = useMutation({
    mutationFn: (id: number) => sourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Fonte removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover fonte');
    },
  });

  const updateUserRole = useMutation({
    mutationFn: ({ id, isAdmin }: { id: number; isAdmin: boolean }) =>
      adminApi.updateUser(id, { isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });

  const stats = statsData?.data || {};
  const sources = sourcesData?.data || [];
  const users = usersData?.data || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">Gerenciamento e configurações do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Criptomoedas</span>
            <TrendingUp className="text-primary-600" size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.cryptocurrencies?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">rastreadas</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Fontes de Dados</span>
            <Database className="text-primary-600" size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.sources?.active || 0}/{stats.sources?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">ativas</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Usuários</span>
            <Users className="text-primary-600" size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.users?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">cadastrados</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Análises</span>
            <Search className="text-primary-600" size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.analyses?.last24h || 0}</p>
          <p className="text-xs text-gray-500 mt-1">últimas 24h</p>
        </div>
      </div>

      {/* Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Ações do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => collectData.mutate()}
            disabled={collectData.isPending}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} className={collectData.isPending ? 'animate-spin' : ''} />
            {collectData.isPending ? 'Coletando...' : 'Coletar Dados'}
          </button>

          <button
            onClick={() => validateSources.mutate()}
            disabled={validateSources.isPending}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {validateSources.isPending ? 'Validando...' : 'Validar Fontes'}
          </button>

          <button
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <TrendingUp size={20} />
            {runAnalysis.isPending ? 'Analisando...' : 'Executar Análise'}
          </button>
        </div>
      </div>

      {/* Sources Management */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Fontes de Dados</h2>
          <button
            onClick={() => setShowAddSource(!showAddSource)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Adicionar Fonte
          </button>
        </div>

        {showAddSource && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Nova Fonte</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nome"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="input"
              />
              <input
                type="url"
                placeholder="URL"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                className="input"
              />
              <select
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                className="input"
              >
                <option value="api">API</option>
                <option value="website">Website</option>
                <option value="aggregator">Aggregator</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => addSource.mutate(newSource)}
                disabled={!newSource.name || !newSource.url}
                className="btn btn-primary"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddSource(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Nome</th>
                <th className="text-left py-3 px-4">URL</th>
                <th className="text-left py-3 px-4">Tipo</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Tempo de Resposta</th>
                <th className="text-center py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source: any) => (
                <tr key={source.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{source.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">
                    {source.url}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {source.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {source.is_active ? (
                      <CheckCircle className="text-green-600 inline" size={20} />
                    ) : (
                      <XCircle className="text-red-600 inline" size={20} />
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    {source.response_time_ms ? `${source.response_time_ms}ms` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteSource.mutate(source.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Remover fonte"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Gerenciar Usuários</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Nome</th>
                <th className="text-left py-3 px-4">Provedor</th>
                <th className="text-center py-3 px-4">Admin</th>
                <th className="text-left py-3 px-4">Cadastro</th>
                <th className="text-center py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.email}</td>
                  <td className="py-3 px-4">{user.name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {user.auth_provider}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.is_admin ? (
                      <CheckCircle className="text-green-600 inline" size={20} />
                    ) : (
                      <XCircle className="text-gray-400 inline" size={20} />
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => updateUserRole.mutate({ id: user.id, isAdmin: !user.is_admin })}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
