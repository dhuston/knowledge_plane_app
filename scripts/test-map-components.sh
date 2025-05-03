#!/bin/bash
# Script to test the new map components implementation

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Map Component Decomposition${NC}"
echo "====================================="

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit 1

# Create directories if they don't exist
echo -e "${GREEN}Creating test directories...${NC}"
mkdir -p src/components/map/providers/__tests__

# Run tests if they exist
echo -e "${GREEN}Running component tests...${NC}"
if [ -f "src/components/map/providers/__tests__/MapDataProvider.test.tsx" ]; then
  npm test -- src/components/map/providers/__tests__/MapDataProvider.test.tsx
else
  echo -e "${RED}Tests not found. Please make sure test files are in the correct location.${NC}"
fi

# Create a backup of the original LivingMap component
echo -e "${GREEN}Creating backup of original LivingMap component...${NC}"
if [ -f "src/components/map/LivingMap.tsx" ] && [ ! -f "src/components/map/LivingMap.tsx.bak" ]; then
  cp "src/components/map/LivingMap.tsx" "src/components/map/LivingMap.tsx.bak"
  echo -e "${GREEN}Backup created at src/components/map/LivingMap.tsx.bak${NC}"
fi

# Move the new implementation in place (uncomment when ready)
# echo -e "${GREEN}Activating new implementation...${NC}"
# mv "src/components/map/LivingMap.tsx.new" "src/components/map/LivingMap.tsx"
echo -e "${YELLOW}New implementation ready at src/components/map/LivingMap.tsx.new${NC}"
echo -e "${YELLOW}To activate, run:${NC}"
echo -e "  mv \"src/components/map/LivingMap.tsx.new\" \"src/components/map/LivingMap.tsx\""

# Summary
echo -e "${GREEN}Test Script Complete${NC}"
echo "====================================="
echo -e "${YELLOW}Implementation Status:${NC}"
echo "- New contexts created: MapDataProvider, MapFiltersManager, MapViewportProvider"
echo "- New components created: MapContainer, MapInteractionHandler, MapControlsContainer"
echo "- Tests created for MapDataProvider"
echo "- Backward compatibility layer created"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Complete implementation of SigmaGraphLoader integration"
echo "2. Add more tests for remaining components"
echo "3. Run visual regression tests"
echo "4. Activate the new implementation when ready"
echo ""