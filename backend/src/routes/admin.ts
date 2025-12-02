import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { dataCollector } from '../services/dataCollector';
import { sourceValidator } from '../services/sourceValidator';
import { cryptoAnalyzer } from '../services/analyzer';

const router = Router();

// Todas as rotas exigem autenticação e privilégios de admin
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard de estatísticas
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [cryptos, sources, users, analyses] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM cryptocurrencies WHERE is_tracked = true'),
      pool.query('SELECT COUNT(*) as count, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active FROM crypto_sources'),
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM analysis_results WHERE analysis_date > NOW() - INTERVAL \'24 hours\'')
    ]);

    res.json({
      cryptocurrencies: {
        total: parseInt(cryptos.rows[0].count),
        tracked: parseInt(cryptos.rows[0].count)
      },
      sources: {
        total: parseInt(sources.rows[0].count),
        active: parseInt(sources.rows[0].active)
      },
      users: {
        total: parseInt(users.rows[0].count)
      },
      analyses: {
        last24h: parseInt(analyses.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Força coleta de dados
router.post('/collect', async (req: AuthRequest, res: Response) => {
  try {
    await dataCollector.collectAndSave();
    res.json({ message: 'Coleta de dados iniciada com sucesso' });
  } catch (error) {
    console.error('Error collecting data:', error);
    res.status(500).json({ error: 'Erro ao coletar dados' });
  }
});

// Força validação de todas as fontes
router.post('/validate-sources', async (req: AuthRequest, res: Response) => {
  try {
    const results = await sourceValidator.validateAllSources();
    res.json({
      message: 'Validação concluída',
      results
    });
  } catch (error) {
    console.error('Error validating sources:', error);
    res.status(500).json({ error: 'Erro ao validar fontes' });
  }
});

// Força análise completa
router.post('/analyze', async (req: AuthRequest, res: Response) => {
  try {
    const result = await cryptoAnalyzer.performFullAnalysis();
    res.json({
      message: 'Análise concluída',
      analyses: result.analyses.length,
      simulations: result.simulations.length
    });
  } catch (error) {
    console.error('Error analyzing:', error);
    res.status(500).json({ error: 'Erro ao analisar' });
  }
});

// Gerenciar usuários
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, cpf, auth_provider, is_admin, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Atualizar permissões de usuário
router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    await pool.query(
      'UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isAdmin, id]
    );

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Gerenciar criptomoedas rastreadas
router.patch('/cryptocurrencies/:id/track', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isTracked } = req.body;

    await pool.query(
      'UPDATE cryptocurrencies SET is_tracked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isTracked, id]
    );

    res.json({ message: 'Criptomoeda atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating crypto:', error);
    res.status(500).json({ error: 'Erro ao atualizar criptomoeda' });
  }
});

// Logs do sistema (últimas 100 entradas)
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    // Por enquanto, retorna logs de price_history como exemplo
    const result = await pool.query(
      `SELECT
        'price_update' as type,
        ph.timestamp,
        c.symbol,
        ph.price,
        ph.source_id
      FROM price_history ph
      INNER JOIN cryptocurrencies c ON ph.crypto_id = c.id
      ORDER BY ph.timestamp DESC
      LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

export default router;
