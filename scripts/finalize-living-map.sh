#!/bin/bash
# Script to finalize the LivingMap component decomposition implementation

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Finalizing LivingMap Component Decomposition${NC}"
echo "====================================="

# Navigate to the project directory
cd "$(dirname "$0")/.." || exit 1

# Create a backup of the original LivingMap component
echo -e "${BLUE}Creating backup of the original LivingMap component...${NC}"
if [ -f "frontend/src/components/map/LivingMap.tsx" ] && [ ! -f "frontend/src/components/map/LivingMap.tsx.original" ]; then
  cp "frontend/src/components/map/LivingMap.tsx" "frontend/src/components/map/LivingMap.tsx.original"
  echo -e "${GREEN}Backup created at: frontend/src/components/map/LivingMap.tsx.original${NC}"
else
  echo -e "${YELLOW}Backup already exists or original file not found${NC}"
fi

# Move the new implementation in place
echo -e "${BLUE}Moving new implementation into place...${NC}"
if [ -f "frontend/src/components/map/LivingMap.tsx.new" ]; then
  mv "frontend/src/components/map/LivingMap.tsx.new" "frontend/src/components/map/LivingMap.tsx"
  echo -e "${GREEN}New implementation installed successfully${NC}"
else
  echo -e "${RED}New implementation file not found! Implementation incomplete.${NC}"
  exit 1
fi

# Run tests
echo -e "${BLUE}Running tests...${NC}"
cd frontend && npm test -- src/components/map --watchAll=false

# Success message
echo ""
echo -e "${GREEN}LivingMap component decomposition completed successfully!${NC}"
echo "====================================="
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run the application to verify the implementation works as expected"
echo "2. Review the documentation in docs/LIVING_MAP_IMPLEMENTATION_PROGRESS.md"
echo "3. Begin work on the next item in the frontend backlog"
echo ""