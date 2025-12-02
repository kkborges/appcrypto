import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crypto_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export async function setupDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    await createTables();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        cpf VARCHAR(14) UNIQUE,
        rg VARCHAR(20),
        auth_provider VARCHAR(50) DEFAULT 'local',
        auth_provider_id VARCHAR(255),
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crypto sources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) UNIQUE NOT NULL,
        type VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        last_checked TIMESTAMP,
        status VARCHAR(50),
        response_time_ms INTEGER,
        added_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cryptocurrencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cryptocurrencies (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_tracked BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Price history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        crypto_id INTEGER REFERENCES cryptocurrencies(id),
        price DECIMAL(20, 8) NOT NULL,
        volume_24h DECIMAL(20, 2),
        market_cap DECIMAL(20, 2),
        change_1h DECIMAL(10, 4),
        change_24h DECIMAL(10, 4),
        change_7d DECIMAL(10, 4),
        source_id INTEGER REFERENCES crypto_sources(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Analysis results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id SERIAL PRIMARY KEY,
        crypto_id INTEGER REFERENCES cryptocurrencies(id),
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        score DECIMAL(5, 2),
        trend VARCHAR(50),
        volatility DECIMAL(10, 4),
        recommendation TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Investment simulations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        crypto_id INTEGER REFERENCES cryptocurrencies(id),
        initial_amount DECIMAL(10, 2),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        final_amount DECIMAL(10, 2),
        profit_loss DECIMAL(10, 2),
        profit_loss_percent DECIMAL(10, 4),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User portfolios table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        crypto_id INTEGER REFERENCES cryptocurrencies(id),
        amount DECIMAL(20, 8),
        buy_price DECIMAL(20, 8),
        buy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_simulation BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_price_history_crypto_timestamp
      ON price_history(crypto_id, timestamp DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analysis_crypto_date
      ON analysis_results(crypto_id, analysis_date DESC)
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created/verified');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
