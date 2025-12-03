# Crypto Search Engine 🚀

Plataforma completa de análise e simulação de investimentos em criptomoedas com inteligência artificial.

## 📋 Funcionalidades

### 🔍 Engine de Pesquisa
- Busca automática de fontes de dados crypto (APIs públicas e agregadores)
- Integração com CoinGecko, Binance, CoinCap e outras APIs
- Descoberta automática de endpoints

### ✅ Validador de Fontes
- Verifica se fontes estão online e funcionais
- Monitora tempo de resposta
- Atualização automática de status

### 📊 Análise Inteligente
- Análise das top 25 criptomoedas mais promissoras
- Análise comportamental de subidas e quedas
- Score de 0-100 para cada crypto
- Identificação de tendências (bullish, bearish, neutral)
- Considera volatilidade, volume e momentum

### 💰 Simulador de Investimentos
- Simulação de investimento de $50 por crypto
- Análise de performance em 7 dias
- Portfolio simulado
- Relatório de ganhos/perdas
- Foco em oportunidades (não apenas cryptos conhecidas)

### 📈 Gráficos e Timeframes
Visualização de preços em múltiplos intervalos:
1. **1m**: Últimos 5 minutos, minuto a minuto
2. **5m**: Últimos 60 minutos, de 5 em 5 minutos
3. **15m**: Últimas 2 horas, de 15 em 15 minutos
4. **1h**: Últimas 5 horas, hora a hora
5. **2h**: Últimas 12 horas, de 2 em 2 horas

### 🔐 Sistema de Autenticação
- Cadastro por email e senha
- Login com CPF/RG
- OAuth Google (em desenvolvimento)
- OAuth Instagram (em desenvolvimento)

### 🖥️ Interface Web
- **Dashboard**: Visão geral do mercado com gráficos
- **Análises**: Top 25 cryptos com recomendações
- **Simulador**: Teste investimentos sem risco
- **Admin**: Gerenciamento de fontes e usuários

## 🛠️ Tecnologias

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Axios** - Requisições HTTP
- **Node-cron** - Jobs agendados
- **Zod** - Validação de dados

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **React Query** - Gerenciamento de estado
- **Recharts** - Gráficos
- **React Router** - Navegação

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/crypto-search-engine.git
cd crypto-search-engine
```

### 2. Instale as dependências
```bash
npm install
```

**Problemas na instalação?** Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 3. Configure o banco de dados
Crie um banco PostgreSQL:
```sql
CREATE DATABASE crypto_db;
```

### 4. Configure as variáveis de ambiente
```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` com suas configurações:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crypto_db
DB_USER=postgres
DB_PASSWORD=sua-senha

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# APIs (opcional)
COINGECKO_API_KEY=
BINANCE_API_KEY=
```

### 5. Inicie o projeto
```bash
# Desenvolvimento (backend + frontend)
npm run dev

# Ou separadamente:
cd backend && npm run dev
cd frontend && npm run dev
```

**Problemas ao iniciar?** O backend tem scripts alternativos:
```bash
cd backend

# Opção 1: ts-node-dev (padrão, mais estável)
npm run dev

# Opção 2: tsx (se funcionar no seu ambiente)
npm run dev:tsx

# Opção 3: nodemon + ts-node
npm run dev:nodemon
```

**Erro "Host version does not match binary version"?**
```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para mais soluções.

### 6. Acesse a aplicação
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🚀 Uso

### Primeiro Acesso

1. **Registre-se**: Acesse `/register` e crie uma conta
2. **Login**: Entre com suas credenciais
3. **Aguarde coleta inicial**: O sistema começará a coletar dados automaticamente

### Dashboard
- Visualize estatísticas gerais do mercado
- Veja as tendências (alta, baixa, neutro)
- Selecione cryptos para ver gráficos detalhados
- Alterne entre timeframes (1m, 5m, 15m, 1h, 2h)

### Análises
- Confira as top 25 cryptos mais promissoras
- Veja score, tendência e recomendações
- Analise simulações de investimento de $50/7 dias
- Leia justificativas da IA para cada recomendação

### Simulador
- Crie simulações personalizadas
- Teste diferentes valores e períodos
- Acompanhe seu portfolio simulado
- Veja lucros/prejuízos em tempo real

### Admin (apenas administradores)
- Adicione novas fontes de dados
- Force coleta de dados manual
- Valide fontes
- Execute análises sob demanda
- Gerencie usuários e permissões

## 🔄 Processos Automáticos

O sistema executa automaticamente:
- **A cada 5 minutos**: Coleta de dados de preços
- **A cada 30 minutos**: Validação de fontes
- **A cada hora**: Análise completa das cryptos
- **Diariamente às 3h**: Limpeza de dados antigos

## 📊 Fontes de Dados

O sistema coleta dados de múltiplas fontes:

### APIs Gratuitas
- **CoinGecko**: 10000+ cryptos, dados históricos
- **CoinCap**: Dados em tempo real
- **Binance**: Maior exchange do mundo
- **CryptoCompare**: Dados e análises
- **Messari**: Métricas avançadas

### Adicionando Novas Fontes
No painel admin, você pode adicionar URLs customizadas:
1. Clique em "Adicionar Fonte"
2. Informe nome, URL e tipo (API/Website)
3. O sistema validará automaticamente

## 🧪 Algoritmo de Análise

O sistema usa múltiplos indicadores para calcular o score:

- **Momentum**: Mudanças de preço 24h e 7 dias
- **Volume**: Liquidez e interesse do mercado
- **Volatilidade**: Risco e oportunidade
- **Market Cap**: Potencial de crescimento
- **Tendências**: Padrões de alta/baixa

Score final: 0-100 pontos
- **75-100**: FORTE COMPRA
- **60-74**: COMPRA
- **50-59**: MANTER
- **40-49**: CAUTELA
- **0-39**: VENDA

## 🔒 Segurança

- Senhas com hash bcrypt
- Autenticação JWT
- Rate limiting
- Helmet.js para headers seguros
- Validação de dados com Zod
- Prepared statements (SQL injection protection)

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

### Crypto
- `GET /api/crypto` - Listar criptomoedas
- `GET /api/crypto/:id` - Detalhes de uma crypto
- `GET /api/crypto/:id/history?timeframe=1h` - Histórico de preços

### Análises
- `GET /api/analysis/top25` - Top 25 análises
- `GET /api/analysis/:id/history` - Histórico de análises
- `POST /api/analysis/refresh` - Forçar nova análise

### Simulações
- `GET /api/simulation` - Listar simulações
- `POST /api/simulation` - Criar simulação
- `GET /api/simulation/top25` - Simulações das top 25
- `GET /api/simulation/portfolio` - Portfolio do usuário
- `POST /api/simulation/portfolio` - Adicionar ao portfolio

### Admin (requer privilégios)
- `GET /api/admin/stats` - Estatísticas do sistema
- `POST /api/admin/collect` - Forçar coleta de dados
- `POST /api/admin/validate-sources` - Validar fontes
- `POST /api/admin/analyze` - Executar análise
- `GET /api/admin/users` - Listar usuários
- `PATCH /api/admin/users/:id` - Atualizar usuário

### Fontes
- `GET /api/sources` - Listar fontes
- `GET /api/sources/search` - Buscar fontes
- `POST /api/sources/:id/validate` - Validar fonte
- `GET /api/sources/stats` - Estatísticas
- `POST /api/sources` - Adicionar fonte (admin)
- `DELETE /api/sources/:id` - Remover fonte (admin)

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- Desenvolvido para análise inteligente de criptomoedas

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma issue com:
- Descrição do problema
- Passos para reproduzir
- Comportamento esperado
- Screenshots (se aplicável)

## 💡 Roadmap

- [ ] OAuth Google e Instagram
- [ ] Notificações por email/push
- [ ] App mobile (React Native)
- [ ] Trading bots automatizados
- [ ] Integração com exchanges
- [ ] Machine Learning avançado
- [ ] Análise de sentimento (Twitter, Reddit)
- [ ] Alertas de preço
- [ ] WebSockets para dados em tempo real
- [ ] Modo escuro

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro: "Host version does not match binary version"
```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

#### Erro: PostgreSQL connection failed
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
services.msc  # Windows - procurar PostgreSQL

# Criar banco se não existir
createdb crypto_db
```

#### Erro: Port 3001 já em uso
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows (PowerShell Admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

#### APIs retornando erros de rede
✅ Isso não é crítico! O sistema usa múltiplas APIs. Se uma falhar, continua com as outras.

Para mais soluções detalhadas, consulte: **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

## ⚠️ Disclaimer

Este sistema é apenas para fins educacionais e informativos. Não constitui aconselhamento financeiro. Criptomoedas são investimentos de alto risco. Sempre faça sua própria pesquisa antes de investir.

---

Feito com ❤️ e TypeScript
