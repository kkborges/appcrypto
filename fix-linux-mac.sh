#!/bin/bash

echo "========================================"
echo "Crypto Search Engine - Fix Script"
echo "========================================"
echo ""

echo "Parando processos na porta 3001..."
if lsof -ti:3001 > /dev/null 2>&1; then
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo "✅ Processos parados"
else
    echo "✅ Nenhum processo na porta 3001"
fi

echo ""
echo "Limpando cache do backend..."
cd backend
if [ -d "node_modules" ]; then
    echo "Removendo node_modules..."
    rm -rf node_modules
fi
if [ -f "package-lock.json" ]; then
    echo "Removendo package-lock.json..."
    rm -f package-lock.json
fi

echo ""
echo "Limpando cache do npm..."
npm cache clean --force

echo ""
echo "Reinstalando dependências do backend..."
npm install

cd ..

echo ""
echo "Limpando cache do frontend..."
cd frontend
if [ -d "node_modules" ]; then
    echo "Removendo node_modules..."
    rm -rf node_modules
fi
if [ -f "package-lock.json" ]; then
    echo "Removendo package-lock.json..."
    rm -f package-lock.json
fi

echo ""
echo "Reinstalando dependências do frontend..."
npm install

cd ..

echo ""
echo "========================================"
echo "✅ Correção concluída!"
echo "========================================"
echo ""
echo "Para iniciar o projeto:"
echo "  npm run dev"
echo ""
echo "Ou separadamente:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Se o erro persistir, tente:"
echo "  cd backend && npm run dev:nodemon"
echo ""
