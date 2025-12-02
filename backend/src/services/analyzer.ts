import { pool } from '../config/database';

export interface CryptoAnalysis {
  cryptoId: number;
  symbol: string;
  name: string;
  currentPrice: number;
  score: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: number;
  recommendation: string;
  reasons: string[];
  change24h?: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
}

export interface InvestmentSimulation {
  cryptoId: number;
  symbol: string;
  name: string;
  initialAmount: number;
  startPrice: number;
  endPrice: number;
  finalAmount: number;
  profitLoss: number;
  profitLossPercent: number;
  days: number;
}

/**
 * Analisador de criptomoedas com IA e indicadores técnicos
 */
export class CryptoAnalyzer {
  /**
   * Analisa as top 25 criptomoedas mais promissoras
   */
  async analyzeTop25(): Promise<CryptoAnalysis[]> {
    try {
      // Busca dados das últimas 24 horas
      const result = await pool.query(`
        WITH latest_prices AS (
          SELECT DISTINCT ON (crypto_id)
            crypto_id,
            price,
            volume_24h,
            market_cap,
            change_1h,
            change_24h,
            change_7d,
            timestamp
          FROM price_history
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY crypto_id, timestamp DESC
        ),
        price_volatility AS (
          SELECT
            crypto_id,
            STDDEV(price) / AVG(price) * 100 as volatility
          FROM price_history
          WHERE timestamp > NOW() - INTERVAL '7 days'
          GROUP BY crypto_id
        )
        SELECT
          c.id,
          c.symbol,
          c.name,
          lp.price,
          lp.volume_24h,
          lp.market_cap,
          lp.change_1h,
          lp.change_24h,
          lp.change_7d,
          COALESCE(pv.volatility, 0) as volatility
        FROM cryptocurrencies c
        INNER JOIN latest_prices lp ON c.id = lp.crypto_id
        LEFT JOIN price_volatility pv ON c.id = pv.crypto_id
        WHERE c.is_tracked = true
          AND lp.price > 0
          AND lp.volume_24h > 100000
        ORDER BY lp.volume_24h DESC
        LIMIT 100
      `);

      const analyses: CryptoAnalysis[] = [];

      for (const row of result.rows) {
        const analysis = this.analyzeIndividual(row);
        analyses.push(analysis);
      }

      // Ordena por score e retorna top 25
      analyses.sort((a, b) => b.score - a.score);
      return analyses.slice(0, 25);
    } catch (error) {
      console.error('Error analyzing top 25:', error);
      throw error;
    }
  }

  /**
   * Analisa uma criptomoeda individual
   */
  private analyzeIndividual(data: any): CryptoAnalysis {
    const reasons: string[] = [];
    let score = 50; // Score base

    // Análise de momentum (mudanças de preço)
    const change24h = parseFloat(data.change_24h) || 0;
    const change7d = parseFloat(data.change_7d) || 0;
    const volatility = parseFloat(data.volatility) || 0;

    // Positive momentum
    if (change24h > 5) {
      score += 15;
      reasons.push(`Forte alta de ${change24h.toFixed(2)}% em 24h`);
    } else if (change24h > 2) {
      score += 8;
      reasons.push(`Alta moderada de ${change24h.toFixed(2)}% em 24h`);
    } else if (change24h < -5) {
      score -= 10;
      reasons.push(`Queda de ${change24h.toFixed(2)}% em 24h`);
    }

    // Weekly trend
    if (change7d > 10) {
      score += 12;
      reasons.push(`Tendência positiva de ${change7d.toFixed(2)}% em 7 dias`);
    } else if (change7d < -10) {
      score -= 8;
      reasons.push(`Tendência negativa de ${change7d.toFixed(2)}% em 7 dias`);
    }

    // Volume analysis
    const volume24h = parseFloat(data.volume_24h) || 0;
    if (volume24h > 1000000000) {
      score += 10;
      reasons.push('Alto volume de negociação (liquidez excelente)');
    } else if (volume24h > 100000000) {
      score += 5;
      reasons.push('Volume de negociação adequado');
    } else if (volume24h < 1000000) {
      score -= 5;
      reasons.push('Volume baixo (risco de liquidez)');
    }

    // Volatility analysis
    if (volatility > 20) {
      score -= 8;
      reasons.push(`Alta volatilidade (${volatility.toFixed(2)}%) - risco elevado`);
    } else if (volatility > 10) {
      score += 3;
      reasons.push(`Volatilidade moderada (${volatility.toFixed(2)}%) - oportunidades`);
    } else if (volatility < 5) {
      score += 5;
      reasons.push(`Baixa volatilidade (${volatility.toFixed(2)}%) - estável`);
    }

    // Market cap consideration (não favorece apenas as gigantes)
    const marketCap = parseFloat(data.market_cap) || 0;
    if (marketCap > 1000000000 && marketCap < 10000000000) {
      score += 8;
      reasons.push('Market cap médio - potencial de crescimento');
    } else if (marketCap < 1000000000 && marketCap > 100000000) {
      score += 12;
      reasons.push('Small cap - alto potencial (alto risco)');
    }

    // Determine trend
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (change24h > 2 && change7d > 5) {
      trend = 'bullish';
    } else if (change24h < -2 && change7d < -5) {
      trend = 'bearish';
    }

    // Generate recommendation
    let recommendation = '';
    if (score >= 75) {
      recommendation = 'FORTE COMPRA - Alta probabilidade de ganhos';
    } else if (score >= 60) {
      recommendation = 'COMPRA - Boa oportunidade';
    } else if (score >= 50) {
      recommendation = 'MANTER - Observar movimentações';
    } else if (score >= 40) {
      recommendation = 'CAUTELA - Considerar venda';
    } else {
      recommendation = 'VENDA - Alto risco';
    }

    return {
      cryptoId: data.id,
      symbol: data.symbol,
      name: data.name,
      currentPrice: parseFloat(data.price),
      score: Math.min(100, Math.max(0, score)),
      trend,
      volatility,
      recommendation,
      reasons,
      change24h,
      change7d,
      volume24h,
      marketCap
    };
  }

  /**
   * Simula investimento de $50 por 7 dias para cada crypto
   */
  async simulateInvestments(cryptoIds: number[]): Promise<InvestmentSimulation[]> {
    const simulations: InvestmentSimulation[] = [];
    const initialAmount = 50;
    const days = 7;

    for (const cryptoId of cryptoIds) {
      try {
        // Busca preço de 7 dias atrás e preço atual
        const result = await pool.query(`
          WITH current_price AS (
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
              AND timestamp <= NOW() - INTERVAL '7 days'
            ORDER BY timestamp DESC
            LIMIT 1
          )
          SELECT
            c.id,
            c.symbol,
            c.name,
            op.price as start_price,
            cp.price as end_price
          FROM cryptocurrencies c
          CROSS JOIN current_price cp
          CROSS JOIN old_price op
          WHERE c.id = $1
        `, [cryptoId]);

        if (result.rows.length > 0) {
          const row = result.rows[0];
          const startPrice = parseFloat(row.start_price);
          const endPrice = parseFloat(row.end_price);

          // Calcula quantas moedas foram compradas
          const coinsAmount = initialAmount / startPrice;
          const finalAmount = coinsAmount * endPrice;
          const profitLoss = finalAmount - initialAmount;
          const profitLossPercent = (profitLoss / initialAmount) * 100;

          simulations.push({
            cryptoId: row.id,
            symbol: row.symbol,
            name: row.name,
            initialAmount,
            startPrice,
            endPrice,
            finalAmount,
            profitLoss,
            profitLossPercent,
            days
          });
        }
      } catch (error) {
        console.error(`Error simulating investment for crypto ${cryptoId}:`, error);
      }
    }

    // Ordena por lucro
    simulations.sort((a, b) => b.profitLossPercent - a.profitLossPercent);
    return simulations;
  }

  /**
   * Salva análise no banco de dados
   */
  async saveAnalysis(analysis: CryptoAnalysis): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO analysis_results (
          crypto_id, score, trend, volatility, recommendation, data
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          analysis.cryptoId,
          analysis.score,
          analysis.trend,
          analysis.volatility,
          analysis.recommendation,
          JSON.stringify({
            reasons: analysis.reasons,
            change24h: analysis.change24h,
            change7d: analysis.change7d,
            volume24h: analysis.volume24h,
            marketCap: analysis.marketCap
          })
        ]
      );
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  /**
   * Processo completo de análise
   */
  async performFullAnalysis(): Promise<{
    analyses: CryptoAnalysis[];
    simulations: InvestmentSimulation[];
  }> {
    console.log('🔍 Iniciando análise completa...');

    const analyses = await this.analyzeTop25();
    console.log(`✅ ${analyses.length} cryptos analisadas`);

    // Salva análises
    for (const analysis of analyses) {
      await this.saveAnalysis(analysis);
    }

    // Simula investimentos
    const cryptoIds = analyses.map(a => a.cryptoId);
    const simulations = await this.simulateInvestments(cryptoIds);
    console.log(`✅ ${simulations.length} simulações realizadas`);

    return { analyses, simulations };
  }
}

export const cryptoAnalyzer = new CryptoAnalyzer();
