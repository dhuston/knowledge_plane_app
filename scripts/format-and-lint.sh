#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Export PYTHONPATH to include backend directory
export PYTHONPATH="$PYTHONPATH:$(pwd)/backend"

echo -e "${BLUE}=== Biosphere Alpha Code Quality Tool ===${NC}"

# Check if we're formatting frontend, backend, or both
target=${1:-all}
fix_mode=${2:-check}

if [ "$fix_mode" == "fix" ]; then
  fix_flag="--fix"
  auto_flag="--in-place"
  echo -e "${YELLOW}Running in FIX mode - will automatically fix issues where possible${NC}"
else
  fix_flag=""
  auto_flag="--check"
  echo -e "${YELLOW}Running in CHECK mode - will report issues but not fix them${NC}"
  echo -e "Run with 'fix' as the second argument to automatically fix issues: ./scripts/format-and-lint.sh all fix"
fi

# Frontend formatting and linting
if [ "$target" == "frontend" ] || [ "$target" == "all" ]; then
  echo -e "\n${BLUE}=== Frontend Code Quality Checks ===${NC}"
  
  if [ -d "./frontend" ]; then
    cd frontend
    
    echo -e "\n${GREEN}Running Prettier format check...${NC}"
    if [ "$fix_mode" == "fix" ]; then
      npm run format
    else
      npm run format:check || true
    fi
    
    echo -e "\n${GREEN}Running ESLint...${NC}"
    if [ "$fix_mode" == "fix" ]; then
      npm run lint:fix || true
    else
      npm run lint || true
    fi
    
    echo -e "\n${GREEN}Running TypeScript check...${NC}"
    npm run build --noEmit || true
    
    cd ..
  else
    echo -e "${RED}Frontend directory not found${NC}"
  fi
fi

# Backend formatting and linting
if [ "$target" == "backend" ] || [ "$target" == "all" ]; then
  echo -e "\n${BLUE}=== Backend Code Quality Checks ===${NC}"
  
  if [ -d "./backend" ]; then
    cd backend
    
    # Check if required Python tools are available
    pip3 install autopep8 flake8 autoflake isort black || true
    
    echo -e "\n${GREEN}Running Flake8 linting...${NC}"
    python3 -m flake8 app/ || true
    
    if [ "$fix_mode" == "fix" ]; then
      echo -e "\n${GREEN}Running autopep8 formatting...${NC}"
      python3 -m autopep8 --recursive --aggressive --aggressive --max-line-length 100 $auto_flag app/
      
      echo -e "\n${GREEN}Running autoflake to remove unused imports...${NC}"
      python3 -m autoflake --remove-all-unused-imports --recursive $auto_flag app/
      
      echo -e "\n${GREEN}Running isort to sort imports...${NC}"
      python3 -m isort app/
    fi
    
    cd ..
  else
    echo -e "${RED}Backend directory not found${NC}"
  fi
fi

echo -e "\n${BLUE}=== Code Quality Check Complete ===${NC}"
if [ "$fix_mode" == "check" ]; then
  echo -e "Run with 'fix' as the second argument to automatically fix issues: ./scripts/format-and-lint.sh all fix"
fi