import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { cryptoSearchEngine } from '../services/searchEngine';
import { sourceValidator } from '../services/sourceValidator';

const router = Router();

// Lista todas as fontes conhecidas
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        url,
        type,
        is_active,
        status,
        response_time_ms,
        last_checked,
        created_at
      FROM crypto_sources
      ORDER BY is_active DESC, name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Erro ao buscar fontes' });
  }
});

// Busca fontes disponíveis (do search engine)
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    const sources = await cryptoSearchEngine.searchSources(q as string);
    res.json(sources);
  } catch (error) {
    console.error('Error searching sources:', error);
    res.status(500).json({ error: 'Erro ao buscar fontes' });
  }
});

// Valida uma fonte específica
router.post('/:id/validate', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT url FROM crypto_sources WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fonte não encontrada' });
    }

    const validation = await sourceValidator.validateSource(result.rows[0].url);
    await sourceValidator.saveValidationResult(parseInt(id), validation);

    res.json(validation);
  } catch (error) {
    console.error('Error validating source:', error);
    res.status(500).json({ error: 'Erro ao validar fonte' });
  }
});

// Estatísticas de validação
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await sourceValidator.getValidationStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Adiciona nova fonte (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, type } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Nome e URL são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO crypto_sources (name, url, type, added_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, url, type || 'api', req.userId]
    );

    // Valida imediatamente
    const validation = await sourceValidator.validateSource(url);
    await sourceValidator.saveValidationResult(result.rows[0].id, validation);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding source:', error);
    res.status(500).json({ error: 'Erro ao adicionar fonte' });
  }
});

// Remove fonte (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM crypto_sources WHERE id = $1', [id]);

    res.json({ message: 'Fonte removida com sucesso' });
  } catch (error) {
    console.error('Error deleting source:', error);
    res.status(500).json({ error: 'Erro ao remover fonte' });
  }
});

export default router;
