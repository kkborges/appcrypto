@echo off
echo ========================================
echo Crypto Search Engine - Fix Script
echo ========================================
echo.

echo Parando processos na porta 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Matando processo %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Limpando cache do backend...
cd backend
if exist node_modules (
    echo Removendo node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removendo package-lock.json...
    del /f package-lock.json
)

echo.
echo Limpando cache do npm...
call npm cache clean --force

echo.
echo Reinstalando dependencias do backend...
call npm install

cd ..

echo.
echo Limpando cache do frontend...
cd frontend
if exist node_modules (
    echo Removendo node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removendo package-lock.json...
    del /f package-lock.json
)

echo.
echo Reinstalando dependencias do frontend...
call npm install

cd ..

echo.
echo ========================================
echo Correcao concluida!
echo ========================================
echo.
echo Para iniciar o projeto:
echo   npm run dev
echo.
echo Ou separadamente:
echo   Terminal 1: cd backend ^&^& npm run dev
echo   Terminal 2: cd frontend ^&^& npm run dev
echo.
echo Se o erro persistir, tente:
echo   cd backend ^&^& npm run dev:nodemon
echo.
pause
