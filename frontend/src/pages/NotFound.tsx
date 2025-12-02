import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-bold mt-4 mb-2">Página não encontrada</h2>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe.
        </p>
        <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
          <Home size={20} />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
