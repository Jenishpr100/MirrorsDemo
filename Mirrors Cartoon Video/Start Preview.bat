@echo off
cd /d "%~dp0app"
if not exist node_modules\vite\bin\vite.js (
  echo Installing TypeScript, Vite, and Three.js dependencies...
  call bun install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
start "Mirrors Vite preview" cmd /k "bun run dev"
timeout /t 3 /nobreak >nul
start "" http://localhost:5173
