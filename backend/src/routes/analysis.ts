import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { cryptoAnalyzer } from '../services/analyzer';

const router = Router();

// Retorna análise das top 25 cryptos
router.get('/top25', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const analyses = await cryptoAnalyzer.analyzeTop25();
    res.json(analyses);
  } catch (error) {
    console.error('Error getting top25 analysis:', error);
    res.status(500).json({ error: 'Erro ao analisar criptomoedas' });
  }
});

// Análise histórica de uma crypto
router.get('/:cryptoId/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { cryptoId } = req.params;
    const { limit = 30 } = req.query;

    const result = await pool.query(
      `SELECT
        id,
        score,
        trend,
        volatility,
        recommendation,
        data,
        analysis_date
      FROM analysis_results
      WHERE crypto_id = $1
      ORDER BY analysis_date DESC
      LIMIT $2`,
      [cryptoId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de análise' });
  }
});

// Força nova análise (pode demorar)
router.post('/refresh', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await cryptoAnalyzer.performFullAnalysis();
    res.json({
      message: 'Análise concluída',
      analysesCount: result.analyses.length,
      simulationsCount: result.simulations.length
    });
  } catch (error) {
    console.error('Error refreshing analysis:', error);
    res.status(500).json({ error: 'Erro ao realizar análise' });
  }
});

export default router;
