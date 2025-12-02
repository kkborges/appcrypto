import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Lista todas as criptomoedas com preços atuais
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    let query = `
      WITH latest_prices AS (
        SELECT DISTINCT ON (crypto_id)
          crypto_id,
          price,
          volume_24h,
          market_cap,
          change_24h,
          change_7d,
          timestamp
        FROM price_history
        ORDER BY crypto_id, timestamp DESC
      )
      SELECT
        c.id,
        c.symbol,
        c.name,
        lp.price,
        lp.volume_24h,
        lp.market_cap,
        lp.change_24h,
        lp.change_7d,
        lp.timestamp as last_update
      FROM cryptocurrencies c
      LEFT JOIN latest_prices lp ON c.id = lp.crypto_id
      WHERE c.is_tracked = true
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (c.symbol ILIKE $${params.length + 1} OR c.name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY lp.market_cap DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: result.rowCount
      }
    });
  } catch (error) {
    console.error('Error fetching cryptos:', error);
    res.status(500).json({ error: 'Erro ao buscar criptomoedas' });
  }
});

// Detalhes de uma criptomoeda específica
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        c.id,
        c.symbol,
        c.name,
        c.created_at
      FROM cryptocurrencies c
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Criptomoeda não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
});

// Histórico de preços com diferentes timeframes
router.get('/:id/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { timeframe = '1h' } = req.query;

    let interval = '1 hour';
    let truncUnit = 'minute';
    let limit = 60;

    // Configura intervalo baseado no timeframe solicitado
    // PostgreSQL date_trunc aceita apenas: second, minute, hour, day, week, month, quarter, year
    switch (timeframe) {
      case '1m': // Últimos 5 minutos, minuto a minuto
        interval = '5 minutes';
        truncUnit = 'minute';
        limit = 5;
        break;
      case '5m': // Últimos 60 minutos, 5 em 5 minutos
        interval = '1 hour';
        truncUnit = 'minute';
        limit = 12;
        break;
      case '15m': // Últimas 2 horas, 15 em 15 minutos
        interval = '2 hours';
        truncUnit = 'minute';
        limit = 8;
        break;
      case '1h': // Últimas 24 horas, hora em hora
        interval = '24 hours';
        truncUnit = 'hour';
        limit = 24;
        break;
      case '2h': // Últimas 48 horas, 2 em 2 horas
        interval = '48 hours';
        truncUnit = 'hour';
        limit = 24;
        break;
      case '6h': // Últimos 7 dias, 6 em 6 horas
        interval = '7 days';
        truncUnit = 'hour';
        limit = 28;
        break;
      case '12h': // Últimas 2 semanas, 12 em 12 horas
        interval = '14 days';
        truncUnit = 'hour';
        limit = 28;
        break;
      case '24h': // Último mês, dia a dia
        interval = '30 days';
        truncUnit = 'day';
        limit = 30;
        break;
      case '7d': // Últimos 3 meses, semana a semana
        interval = '90 days';
        truncUnit = 'week';
        limit = 13;
        break;
      case '30d': // Último ano, mês a mês
        interval = '365 days';
        truncUnit = 'month';
        limit = 12;
        break;
      default:
        interval = '24 hours';
        truncUnit = 'hour';
        limit = 24;
    }

    const result = await pool.query(
      `SELECT
        date_trunc($1, timestamp) as time,
        AVG(price) as price,
        SUM(volume_24h) as volume,
        ((MAX(price) - MIN(price)) / MIN(price) * 100) as change_percent
      FROM price_history
      WHERE crypto_id = $2
        AND timestamp > NOW() - INTERVAL '${interval}'
      GROUP BY date_trunc($1, timestamp)
      ORDER BY time DESC
      LIMIT $3`,
      [truncUnit, id, limit]
    );

    res.json({
      timeframe,
      data: result.rows.reverse() // Ordem cronológica
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

export default router;
