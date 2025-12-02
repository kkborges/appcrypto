import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, TrendingUp, PlayCircle, Settings, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Crypto Engine</h1>
          <p className="text-sm text-gray-400 mt-1">Análise de Criptomoedas</p>
        </div>

        <nav className="mt-6">
          <Link
            to="/"
            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/analysis"
            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            <TrendingUp size={20} />
            <span>Análises</span>
          </Link>

          <Link
            to="/simulation"
            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            <PlayCircle size={20} />
            <span>Simulações</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors"
            >
              <Settings size={20} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-400">
                {isAdmin ? 'Administrador' : 'Usuário'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
