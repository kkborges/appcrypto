import cron from 'node-cron';
import { dataCollector } from './dataCollector';
import { sourceValidator } from './sourceValidator';
import { cryptoAnalyzer } from './analyzer';

/**
 * Configura jobs agendados para coleta e análise automática
 */
export function setupCronJobs() {
  console.log('⏰ Configurando cron jobs...');

  // Coleta de dados a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 [CRON] Iniciando coleta de dados...');
    try {
      await dataCollector.collectAndSave();
      console.log('✅ [CRON] Coleta de dados concluída');
    } catch (error) {
      console.error('❌ [CRON] Erro na coleta de dados:', error);
    }
  });

  // Validação de fontes a cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔍 [CRON] Validando fontes...');
    try {
      await sourceValidator.validateAllSources();
      console.log('✅ [CRON] Validação de fontes concluída');
    } catch (error) {
      console.error('❌ [CRON] Erro na validação:', error);
    }
  });

  // Análise completa a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('📊 [CRON] Iniciando análise completa...');
    try {
      const { pool } = await import('../config/database');

      // Verifica se há dados suficientes para análise
      const countResult = await pool.query('SELECT COUNT(*) as count FROM price_history');
      const dataCount = parseInt(countResult.rows[0].count);

      if (dataCount < 10) {
        console.log('⚠️  [CRON] Dados insuficientes para análise. Aguardando mais coletas...');
        return;
      }

      await cryptoAnalyzer.performFullAnalysis();
      console.log('✅ [CRON] Análise completa concluída');
    } catch (error: any) {
      console.error('❌ [CRON] Erro na análise:', error.message || error);
    }
  });

  // Limpeza de dados antigos (a cada dia às 3h da manhã)
  cron.schedule('0 3 * * *', async () => {
    console.log('🧹 [CRON] Limpando dados antigos...');
    try {
      const { pool } = await import('../config/database');

      // Remove dados de preço com mais de 6 meses
      await pool.query(`
        DELETE FROM price_history
        WHERE timestamp < NOW() - INTERVAL '6 months'
      `);

      // Remove análises com mais de 30 dias
      await pool.query(`
        DELETE FROM analysis_results
        WHERE analysis_date < NOW() - INTERVAL '30 days'
      `);

      console.log('✅ [CRON] Limpeza concluída');
    } catch (error) {
      console.error('❌ [CRON] Erro na limpeza:', error);
    }
  });

  console.log('✅ Cron jobs configurados:');
  console.log('   - Coleta de dados: a cada 5 minutos');
  console.log('   - Validação de fontes: a cada 30 minutos');
  console.log('   - Análise completa: a cada hora');
  console.log('   - Limpeza de dados: diariamente às 3h');
}
