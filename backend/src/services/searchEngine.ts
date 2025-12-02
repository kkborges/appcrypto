import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CryptoSource {
  name: string;
  url: string;
  type: 'api' | 'website' | 'aggregator';
  description?: string;
}

/**
 * Search Engine para localizar fontes de dados de criptomoedas
 */
export class CryptoSearchEngine {
  private readonly knownSources: CryptoSource[] = [
    // APIs Gratuitas
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3',
      type: 'api',
      description: 'API gratuita com dados de 10000+ cryptos'
    },
    {
      name: 'CoinCap',
      url: 'https://api.coincap.io/v2',
      type: 'api',
      description: 'API gratuita em tempo real'
    },
    {
      name: 'CryptoCompare',
      url: 'https://min-api.cryptocompare.com/data',
      type: 'api',
      description: 'API com dados históricos e em tempo real'
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3',
      type: 'api',
      description: 'API da maior exchange do mundo'
    },
    {
      name: 'Coinbase',
      url: 'https://api.coinbase.com/v2',
      type: 'api',
      description: 'API da Coinbase'
    },
    {
      name: 'Kraken',
      url: 'https://api.kraken.com/0/public',
      type: 'api',
      description: 'API da Kraken exchange'
    },
    {
      name: 'Messari',
      url: 'https://data.messari.io/api/v1',
      type: 'api',
      description: 'Dados e métricas de crypto'
    },
    {
      name: 'CoinMarketCap',
      url: 'https://pro-api.coinmarketcap.com/v1',
      type: 'api',
      description: 'API líder em dados de mercado (requer chave)'
    },
    // Aggregators e Sites
    {
      name: 'CoinGecko Website',
      url: 'https://www.coingecko.com',
      type: 'website',
      description: 'Site de análise e ranking'
    },
    {
      name: 'TradingView Crypto',
      url: 'https://www.tradingview.com/markets/cryptocurrencies',
      type: 'website',
      description: 'Gráficos e análises técnicas'
    },
    {
      name: 'LunarCrush',
      url: 'https://lunarcrush.com/api',
      type: 'api',
      description: 'Social analytics para crypto'
    }
  ];

  /**
   * Busca fontes de dados de criptomoedas
   */
  async searchSources(query?: string): Promise<CryptoSource[]> {
    if (query) {
      return this.knownSources.filter(source =>
        source.name.toLowerCase().includes(query.toLowerCase()) ||
        source.description?.toLowerCase().includes(query.toLowerCase())
      );
    }
    return this.knownSources;
  }

  /**
   * Adiciona uma nova fonte customizada
   */
  addCustomSource(source: CryptoSource): void {
    const exists = this.knownSources.some(s => s.url === source.url);
    if (!exists) {
      this.knownSources.push(source);
    }
  }

  /**
   * Busca endpoints específicos em um site usando web scraping
   */
  async discoverEndpoints(baseUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoSearchBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      const endpoints: Set<string> = new Set();

      // Procura por links de API na página
      $('a[href*="api"], a[href*="/v1"], a[href*="/v2"], a[href*="/v3"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          try {
            const url = new URL(href, baseUrl);
            endpoints.add(url.toString());
          } catch (e) {
            // URL inválida, ignora
          }
        }
      });

      // Procura por referências em scripts
      $('script').each((_, elem) => {
        const content = $(elem).html();
        if (content) {
          const apiMatches = content.match(/https?:\/\/[^\s"']+api[^\s"']*/gi);
          if (apiMatches) {
            apiMatches.forEach(url => endpoints.add(url));
          }
        }
      });

      return Array.from(endpoints);
    } catch (error) {
      console.error(`Error discovering endpoints for ${baseUrl}:`, error);
      return [];
    }
  }

  /**
   * Retorna todas as fontes conhecidas
   */
  getAllSources(): CryptoSource[] {
    return [...this.knownSources];
  }
}

export const cryptoSearchEngine = new CryptoSearchEngine();
