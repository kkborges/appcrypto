# Troubleshooting - Crypto Search Engine

## Erro: "Host version does not match binary version" (esbuild/tsx)

### Problema
```
X [ERROR] Cannot start service: Host version "0.27.0" does not match binary version "0.25.12"
Error: The service was stopped
```

Este erro acontece quando há incompatibilidade entre versões do esbuild usado pelo `tsx`.

### Soluções

#### Solução 1: Limpar cache e reinstalar (Recomendado)
```bash
cd backend

# Remover node_modules e cache
rm -rf node_modules package-lock.json
# No Windows: rmdir /s /q node_modules && del package-lock.json

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
npm install

# Testar
npm run dev
```

#### Solução 2: Usar ts-node-dev ao invés de tsx
```bash
cd backend

# Instalar dependências
npm install

# Usar script alternativo (já configurado)
npm run dev
```

O script `npm run dev` agora usa `ts-node-dev` por padrão, que é mais estável.

#### Solução 3: Usar nodemon + ts-node
```bash
npm run dev:nodemon
```

#### Solução 4: Continuar usando tsx
```bash
npm run dev:tsx
```

### Scripts Disponíveis

- `npm run dev` - Desenvolvimento com ts-node-dev (recomendado)
- `npm run dev:tsx` - Desenvolvimento com tsx (se funcionar)
- `npm run dev:nodemon` - Desenvolvimento com nodemon + ts-node
- `npm run build` - Build para produção
- `npm run start` - Iniciar produção (requer build)
- `npm run start:prod` - Build + iniciar produção

## Erro: "Cannot find module" ou imports não funcionando

### Solução
```bash
cd backend
npm install
npx tsc --noEmit  # Verifica erros de tipo
```

## Erro: PostgreSQL Connection

### Problema
```
❌ Database connection failed
```

### Solução

1. **Verificar se PostgreSQL está rodando:**
```bash
# Linux/Mac
sudo systemctl status postgresql
# ou
pg_isready

# Windows
services.msc  # Procurar por PostgreSQL
```

2. **Verificar credenciais no `.env`:**
```bash
cd backend
cat .env  # Linux/Mac
type .env  # Windows

# Verificar:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crypto_db
DB_USER=postgres
DB_PASSWORD=sua-senha-aqui
```

3. **Criar banco de dados:**
```bash
# Linux/Mac
createdb crypto_db

# Windows (no psql)
psql -U postgres
CREATE DATABASE crypto_db;
\q
```

4. **Testar conexão:**
```bash
psql -h localhost -U postgres -d crypto_db
# Se conectar com sucesso, Ctrl+D para sair
```

## Erro: "ENOTFOUND" APIs

### Problema
```
Error: getaddrinfo ENOTFOUND api.coincap.io
```

### Causa
- Problema de rede/DNS
- Firewall bloqueando
- API temporariamente fora

### Solução
✅ **Isso não é crítico!** O sistema usa múltiplas APIs. Se uma falhar, continua com as outras.

Para testar conectividade:
```bash
# Linux/Mac
ping api.coincap.io
curl https://api.coincap.io/v2/assets

# Windows
ping api.coincap.io
curl https://api.coincap.io/v2/assets
# ou use navegador
```

Se nenhuma API funcionar:
1. Verifique firewall
2. Verifique proxy/VPN
3. Tente em outra rede

## Erro: Port 3001 já em uso

### Problema
```
Error: listen EADDRINUSE: address already in use :::3001
```

### Solução

**Opção 1: Matar processo na porta**
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows (PowerShell como Admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# Windows (cmd como Admin)
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

**Opção 2: Mudar porta**
```bash
# Edite backend/.env
PORT=3002
```

## Erro: bcrypt compilation

### Problema
```
Error: node-gyp rebuild failed
```

### Solução
```bash
# Linux
sudo apt-get install build-essential python3

# Mac
xcode-select --install

# Windows
npm install --global windows-build-tools

# Depois reinstale
cd backend
npm rebuild bcrypt
```

## Erro: Frontend não conecta ao backend

### Problema
Frontend mostra erros de rede ou 404.

### Solução

1. **Verificar backend está rodando:**
```bash
curl http://localhost:3001/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

2. **Verificar proxy no Vite:**
```javascript
// frontend/vite.config.ts deve ter:
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

3. **Limpar cache do Vite:**
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

## Performance: Sistema lento

### Otimizações

1. **Reduzir frequência dos cron jobs:**
```typescript
// backend/src/services/cron.ts
// Mudar de */5 para */15 (15 minutos)
cron.schedule('*/15 * * * *', ...)
```

2. **Reduzir limite de cryptos coletadas:**
```typescript
// backend/src/services/dataCollector.ts
// Linha ~24, mudar de 250 para 100
per_page: 100,
```

3. **Aumentar RAM do PostgreSQL:**
```sql
-- No psql
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

## Logs excessivos

### Solução
```bash
# Adicione ao backend/.env
LOG_LEVEL=warn
# ou
LOG_LEVEL=error
```

## Limpar dados antigos manualmente

```sql
-- Conectar ao banco
psql -U postgres -d crypto_db

-- Limpar dados antigos
DELETE FROM price_history WHERE timestamp < NOW() - INTERVAL '7 days';
DELETE FROM analysis_results WHERE analysis_date < NOW() - INTERVAL '7 days';

-- Verificar espaço liberado
SELECT pg_size_pretty(pg_database_size('crypto_db'));

-- Vacuum para liberar espaço
VACUUM FULL;
```

## Reset completo (último recurso)

```bash
# 1. Parar tudo
# Ctrl+C nos terminais

# 2. Limpar dados
dropdb crypto_db
createdb crypto_db

# 3. Limpar node_modules
cd backend && rm -rf node_modules package-lock.json
cd ../frontend && rm -rf node_modules package-lock.json
cd ..

# 4. Reinstalar tudo
npm install

# 5. Reconfigurar .env
cp backend/.env.example backend/.env
# Editar backend/.env com suas credenciais

# 6. Reiniciar
npm run dev
```

## Ainda com problemas?

Crie uma issue com:
- Descrição do erro
- Logs completos
- Sistema operacional
- Versões: `node --version`, `npm --version`, `psql --version`
- Arquivo `.env` (SEM senhas!)
