import axios, { AxiosError } from 'axios';
import { pool } from '../config/database';

export interface ValidationResult {
  url: string;
  isOnline: boolean;
  status: number | null;
  responseTime: number;
  error?: string;
  lastChecked: Date;
}

/**
 * Validador de fontes de dados - verifica se estão online e funcionais
 */
export class SourceValidator {
  private readonly timeout = 10000; // 10 segundos

  /**
   * Valida uma única fonte
   */
  async validateSource(url: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const result: ValidationResult = {
      url,
      isOnline: false,
      status: null,
      responseTime: 0,
      lastChecked: new Date()
    };

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        validateStatus: () => true, // Aceita qualquer status
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoValidatorBot/1.0)'
        }
      });

      result.responseTime = Date.now() - startTime;
      result.status = response.status;
      result.isOnline = response.status >= 200 && response.status < 500;

      // Para APIs, verifica se retorna JSON válido
      if (result.isOnline && url.includes('/api')) {
        try {
          if (typeof response.data === 'object') {
            result.isOnline = true;
          }
        } catch (e) {
          result.error = 'Invalid JSON response';
          result.isOnline = false;
        }
      }
    } catch (error) {
      result.responseTime = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        result.error = axiosError.code || axiosError.message;
        result.status = axiosError.response?.status || null;
      } else {
        result.error = 'Unknown error';
      }
    }

    return result;
  }

  /**
   * Valida múltiplas fontes em paralelo
   */
  async validateMultipleSources(urls: string[]): Promise<ValidationResult[]> {
    const promises = urls.map(url => this.validateSource(url));
    return Promise.all(promises);
  }

  /**
   * Salva resultado da validação no banco de dados
   */
  async saveValidationResult(sourceId: number, result: ValidationResult): Promise<void> {
    try {
      await pool.query(
        `UPDATE crypto_sources
         SET is_active = $1,
             status = $2,
             response_time_ms = $3,
             last_checked = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          result.isOnline,
          result.status ? result.status.toString() : 'error',
          result.responseTime,
          result.lastChecked,
          sourceId
        ]
      );
    } catch (error) {
      console.error('Error saving validation result:', error);
      throw error;
    }
  }

  /**
   * Valida todas as fontes cadastradas no banco
   */
  async validateAllSources(): Promise<ValidationResult[]> {
    try {
      const result = await pool.query(
        'SELECT id, url FROM crypto_sources WHERE is_active = true'
      );

      const sources = result.rows;
      const validations: ValidationResult[] = [];

      for (const source of sources) {
        const validation = await this.validateSource(source.url);
        await this.saveValidationResult(source.id, validation);
        validations.push(validation);
      }

      return validations;
    } catch (error) {
      console.error('Error validating all sources:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de validação
   */
  async getValidationStats(): Promise<{
    total: number;
    online: number;
    offline: number;
    averageResponseTime: number;
  }> {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as online,
          SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as offline,
          AVG(response_time_ms) as avg_response_time
        FROM crypto_sources
      `);

      const row = result.rows[0];
      return {
        total: parseInt(row.total),
        online: parseInt(row.online),
        offline: parseInt(row.offline),
        averageResponseTime: parseFloat(row.avg_response_time) || 0
      };
    } catch (error) {
      console.error('Error getting validation stats:', error);
      throw error;
    }
  }
}

export const sourceValidator = new SourceValidator();
