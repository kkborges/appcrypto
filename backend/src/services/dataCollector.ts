import axios from 'axios';
import { pool } from '../config/database';

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  volume24h?: number;
  marketCap?: number;
  change1h?: number;
  change24h?: number;
  change7d?: number;
  change3m?: number;
  change6m?: number;
}

/**
 * Coletor de dados de múltiplas fontes de criptomoedas
 */
export class DataCollector {
  /**
   * Coleta dados do CoinGecko (API gratuita)
   */
  async collectFromCoinGecko(): Promise<CryptoData[]> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 250,
            page: 1,
            sparkline: false,
            price_change_percentage: '1h,24h,7d,30d,200d'
          },
          timeout: 15000
        }
      );

      return response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        change1h: coin.price_change_percentage_1h_in_currency,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency,
        change3m: coin.price_change_percentage_30d_in_currency,
        change6m: coin.price_change_percentage_200d_in_currency
      }));
    } catch (error: any) {
      const errorMsg = error.code === 'ENOTFOUND'
        ? `DNS resolution failed for ${error.hostname}`
        : error.message || 'Unknown error';
      console.warn(`⚠️  CoinGecko unavailable: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Coleta dados do CoinCap
   */
  async collectFromCoinCap(): Promise<CryptoData[]> {
    try {
      const response = await axios.get('https://api.coincap.io/v2/assets', {
        params: { limit: 250 },
        timeout: 15000
      });

      return response.data.data.map((coin: any) => ({
        symbol: coin.symbol,
        name: coin.name,
        price: parseFloat(coin.priceUsd),
        volume24h: parseFloat(coin.volumeUsd24Hr),
        marketCap: parseFloat(coin.marketCapUsd),
        change24h: parseFloat(coin.changePercent24Hr)
      }));
    } catch (error: any) {
      const errorMsg = error.code === 'ENOTFOUND'
        ? `DNS resolution failed for ${error.hostname}`
        : error.message || 'Unknown error';
      console.warn(`⚠️  CoinCap unavailable: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Coleta dados do Binance
   */
  async collectFromBinance(): Promise<CryptoData[]> {
    try {
      const [ticker24h, prices] = await Promise.all([
        axios.get('https://api.binance.com/api/v3/ticker/24hr', { timeout: 15000 }),
        axios.get('https://api.binance.com/api/v3/ticker/price', { timeout: 15000 })
      ]);

      const priceMap = new Map(
        prices.data.map((p: any) => [p.symbol, parseFloat(p.price)])
      );

      return ticker24h.data
        .filter((coin: any) => coin.symbol.endsWith('USDT'))
        .slice(0, 250)
        .map((coin: any) => ({
          symbol: coin.symbol.replace('USDT', ''),
          name: coin.symbol.replace('USDT', ''),
          price: parseFloat(coin.lastPrice),
          volume24h: parseFloat(coin.volume) * parseFloat(coin.lastPrice),
          change24h: parseFloat(coin.priceChangePercent)
        }));
    } catch (error: any) {
      const errorMsg = error.code === 'ENOTFOUND'
        ? `DNS resolution failed for ${error.hostname}`
        : error.message || 'Unknown error';
      console.warn(`⚠️  Binance unavailable: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Agrega dados de múltiplas fontes
   */
  async aggregateData(): Promise<Map<string, CryptoData>> {
    console.log('🔄 Coletando dados de múltiplas fontes...');

    const [coinGeckoData, coinCapData, binanceData] = await Promise.all([
      this.collectFromCoinGecko(),
      this.collectFromCoinCap(),
      this.collectFromBinance()
    ]);

    const aggregated = new Map<string, CryptoData>();

    // Prioriza CoinGecko por ter mais dados
    for (const data of coinGeckoData) {
      aggregated.set(data.symbol, data);
    }

    // Complementa com CoinCap
    for (const data of coinCapData) {
      if (!aggregated.has(data.symbol)) {
        aggregated.set(data.symbol, data);
      }
    }

    // Complementa com Binance
    for (const data of binanceData) {
      if (!aggregated.has(data.symbol)) {
        aggregated.set(data.symbol, data);
      }
    }

    console.log(`✅ Coletados dados de ${aggregated.size} criptomoedas`);
    return aggregated;
  }

  /**
   * Salva dados coletados no banco
   */
  async saveToDatabase(data: Map<string, CryptoData>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const [symbol, cryptoData] of data) {
        // Insere ou atualiza cryptocurrency
        const cryptoResult = await client.query(
          `INSERT INTO cryptocurrencies (symbol, name)
           VALUES ($1, $2)
           ON CONFLICT (symbol)
           DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [symbol, cryptoData.name]
        );

        const cryptoId = cryptoResult.rows[0].id;

        // Insere histórico de preço
        await client.query(
          `INSERT INTO price_history (
            crypto_id, price, volume_24h, market_cap,
            change_1h, change_24h, change_7d
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            cryptoId,
            cryptoData.price,
            cryptoData.volume24h,
            cryptoData.marketCap,
            cryptoData.change1h,
            cryptoData.change24h,
            cryptoData.change7d
          ]
        );
      }

      await client.query('COMMIT');
      console.log('✅ Dados salvos no banco de dados');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao salvar dados:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Coleta e salva dados - processo completo
   */
  async collectAndSave(): Promise<void> {
    try {
      const data = await this.aggregateData();
      await this.saveToDatabase(data);
    } catch (error) {
      console.error('Error in collect and save:', error);
      throw error;
    }
  }
}

export const dataCollector = new DataCollector();
