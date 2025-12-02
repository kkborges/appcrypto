import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { cryptoAnalyzer } from '../services/analyzer';

const router = Router();

// Lista simulações do usuário
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
        s.id,
        s.initial_amount,
        s.start_date,
        s.end_date,
        s.final_amount,
        s.profit_loss,
        s.profit_loss_percent,
        s.status,
        s.created_at,
        c.symbol,
        c.name
      FROM simulations s
      INNER JOIN cryptocurrencies c ON s.crypto_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({ error: 'Erro ao buscar simulações' });
  }
});

// Cria nova simulação
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { cryptoId, amount = 50, days = 7 } = req.body;

    if (!cryptoId) {
      return res.status(400).json({ error: 'cryptoId é obrigatório' });
    }

    // Busca dados históricos para simulação
    const result = await pool.query(
      `WITH current_price AS (
        SELECT price
        FROM price_history
        WHERE crypto_id = $1
        ORDER BY timestamp DESC
        LIMIT 1
      ),
      old_price AS (
        SELECT price
        FROM price_history
        WHERE crypto_id = $1
          AND timestamp <= NOW() - INTERVAL '${days} days'
        ORDER BY timestamp DESC
        LIMIT 1
      )
      SELECT
        cp.price as current_price,
        op.price as old_price
      FROM current_price cp
      CROSS JOIN old_price op`,
      [cryptoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dados insuficientes para simulação' });
    }

    const { current_price, old_price } = result.rows[0];
    const startPrice = parseFloat(old_price);
    const endPrice = parseFloat(current_price);

    const coinsAmount = amount / startPrice;
    const finalAmount = coinsAmount * endPrice;
    const profitLoss = finalAmount - amount;
    const profitLossPercent = (profitLoss / amount) * 100;

    // Salva simulação
    const simulation = await pool.query(
      `INSERT INTO simulations (
        user_id, crypto_id, initial_amount, start_date, end_date,
        final_amount, profit_loss, profit_loss_percent, status
      ) VALUES ($1, $2, $3, NOW() - INTERVAL '${days} days', NOW(), $4, $5, $6, 'completed')
      RETURNING *`,
      [req.userId, cryptoId, amount, finalAmount, profitLoss, profitLossPercent]
    );

    res.json(simulation.rows[0]);
  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({ error: 'Erro ao criar simulação' });
  }
});

// Simulações de investimento das top 25
router.get('/top25', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const analyses = await cryptoAnalyzer.analyzeTop25();
    const cryptoIds = analyses.map(a => a.cryptoId);
    const simulations = await cryptoAnalyzer.simulateInvestments(cryptoIds);

    res.json(simulations);
  } catch (error) {
    console.error('Error simulating top25:', error);
    res.status(500).json({ error: 'Erro ao simular investimentos' });
  }
});

// Portfolio do usuário (simulado)
router.get('/portfolio', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
        p.id,
        p.amount,
        p.buy_price,
        p.buy_date,
        c.symbol,
        c.name,
        (SELECT price FROM price_history WHERE crypto_id = c.id ORDER BY timestamp DESC LIMIT 1) as current_price
      FROM user_portfolios p
      INNER JOIN cryptocurrencies c ON p.crypto_id = c.id
      WHERE p.user_id = $1 AND p.is_simulation = true
      ORDER BY p.buy_date DESC`,
      [req.userId]
    );

    const portfolio = result.rows.map(row => {
      const currentValue = row.amount * parseFloat(row.current_price);
      const buyValue = row.amount * parseFloat(row.buy_price);
      const profitLoss = currentValue - buyValue;
      const profitLossPercent = (profitLoss / buyValue) * 100;

      return {
        ...row,
        current_price: parseFloat(row.current_price),
        current_value: currentValue,
        buy_value: buyValue,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent
      };
    });

    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Erro ao buscar portfólio' });
  }
});

// Adiciona crypto ao portfolio (simulado)
router.post('/portfolio', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { cryptoId, amount } = req.body;

    if (!cryptoId || !amount) {
      return res.status(400).json({ error: 'cryptoId e amount são obrigatórios' });
    }

    // Busca preço atual
    const priceResult = await pool.query(
      `SELECT price FROM price_history
       WHERE crypto_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [cryptoId]
    );

    if (priceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Preço não encontrado' });
    }

    const buyPrice = parseFloat(priceResult.rows[0].price);

    // Adiciona ao portfolio
    const result = await pool.query(
      `INSERT INTO user_portfolios (user_id, crypto_id, amount, buy_price, is_simulation)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [req.userId, cryptoId, amount, buyPrice]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding to portfolio:', error);
    res.status(500).json({ error: 'Erro ao adicionar ao portfólio' });
  }
});

export default router;
