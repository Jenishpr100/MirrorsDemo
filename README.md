# What it is:
- An AI slop and an animation attempt that was kinda sucessful:
- Made by GPT 6 Luna High power in 4 minutes and 57 seconds

# How to run this
- Clone this repo
- In `Mirrors Cartoon Video` run the `Start Preview.bat`
- The one which has this

```bat
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
```
- Or just run this in the terminal I don't give a fuck but whatever you use make sure it works

- This is for windows, If you use a Mac, fuck you and if you're on linux and need a tutorial, fuck you too.
- The port used by this is `5173` so thing thing should be avilabe in [Local Host](http://localhost:5173/) or [Local IP](http://127.0.0.1:5173/) Incuding your internet IP
