@echo off
REM OrgChat Docker Start Script for Windows
REM Usage: docker-start.bat [up|down|restart|logs]

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: docker-start.bat [up^|down^|restart^|logs^|build]
    echo.
    echo Commands:
    echo   up       - Start all services
    echo   down     - Stop all services
    echo   restart  - Restart all services
    echo   logs     - Show live logs
    echo   build    - Rebuild images
    echo.
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo Copying .env.example to .env...
    copy .env.example .env
    echo.
    echo Please update .env with your Google OAuth credentials
    echo Edit: .env
    exit /b 0
)

if "%1"=="up" (
    echo Starting OrgChat services...
    docker-compose up -d
    timeout /t 5
    echo.
    echo Services are starting...
    docker-compose ps
    echo.
    echo Access points:
    echo   Frontend: http://localhost
    echo   Backend:  http://localhost:8080
    echo   Logs:     docker-compose logs -f
    exit /b 0
)

if "%1"=="down" (
    echo Stopping OrgChat services...
    docker-compose down
    echo Services stopped.
    exit /b 0
)

if "%1"=="restart" (
    echo Restarting OrgChat services...
    docker-compose restart
    timeout /t 3
    docker-compose ps
    exit /b 0
)

if "%1"=="logs" (
    echo Showing live logs (press Ctrl+C to exit)...
    docker-compose logs -f
    exit /b 0
)

if "%1"=="build" (
    echo Building Docker images...
    docker-compose build --no-cache
    exit /b 0
)

echo Unknown command: %1
exit /b 1
