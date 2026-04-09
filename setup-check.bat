@echo off
REM UNO Online - Setup Validation Script for Windows
echo 🎮 UNO Online - Setup Validation
echo =================================

REM Check Node.js
echo 📦 Checking Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js installed: %NODE_VERSION%
) else (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)

REM Check npm
echo 📦 Checking npm...
where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm installed: %NPM_VERSION%
) else (
    echo ❌ npm not found
    exit /b 1
)

REM Check if .env.local exists
echo 🔧 Checking environment configuration...
if exist ".env.local" (
    echo ✅ .env.local found

    REM Check if Supabase URL is configured
    findstr /C:"YOUR_PROJECT_SLUG" .env.local >nul
    if %errorlevel% equ 0 (
        echo ⚠️  .env.local has placeholder values. Please update with your Supabase credentials
    ) else (
        echo ✅ .env.local appears to be configured
    )
) else (
    echo ❌ .env.local not found. Please copy .env.example to .env.local and configure
    exit /b 1
)

REM Check if dependencies are installed
echo 📦 Checking dependencies...
if exist "node_modules" (
    echo ✅ node_modules found
) else (
    echo ❌ node_modules not found. Run 'npm install'
    exit /b 1
)

REM Check if Supabase project is accessible
echo 🔗 Checking Supabase connection...
findstr /C:"supabase.co" .env.local >nul
if %errorlevel% equ 0 (
    echo ✅ Supabase credentials configured
) else (
    echo ❌ Supabase URL not found in .env.local
)

echo.
echo 🎯 Next Steps:
echo 1. Create a Supabase project at https://supabase.com
echo 2. Update .env.local with your project credentials
echo 3. Run the SQL migration in supabase/migrations/001_initial_schema.sql
echo 4. Run 'npm run dev' to start development
echo.
echo 🚀 Ready to build UNO Online!
pause