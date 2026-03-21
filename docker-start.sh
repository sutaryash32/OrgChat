#!/bin/bash

# OrgChat Docker Start Script for macOS/Linux
# Usage: ./docker-start.sh [up|down|restart|logs]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "Usage: ./docker-start.sh [up|down|restart|logs|build]"
    echo ""
    echo "Commands:"
    echo "  up       - Start all services"
    echo "  down     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show live logs"
    echo "  build    - Rebuild images"
    echo ""
}

# Check if command provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Copying .env.example to .env...${NC}"
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}Please update .env with your Google OAuth credentials${NC}"
    echo "Edit: .env"
    exit 0
fi

# Process commands
case "$1" in
    up)
        echo -e "${GREEN}Starting OrgChat services...${NC}"
        docker-compose up -d
        sleep 3
        echo ""
        echo -e "${GREEN}Services status:${NC}"
        docker-compose ps
        echo ""
        echo "Access points:"
        echo "  Frontend: http://localhost"
        echo "  Backend:  http://localhost:8080"
        echo "  Logs:     ./docker-start.sh logs"
        ;;
    down)
        echo -e "${YELLOW}Stopping OrgChat services...${NC}"
        docker-compose down
        echo -e "${GREEN}Services stopped.${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Restarting OrgChat services...${NC}"
        docker-compose restart
        sleep 2
        docker-compose ps
        ;;
    logs)
        echo -e "${GREEN}Showing live logs (press Ctrl+C to exit)...${NC}"
        docker-compose logs -f
        ;;
    build)
        echo -e "${GREEN}Building Docker images...${NC}"
        docker-compose build --no-cache
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
