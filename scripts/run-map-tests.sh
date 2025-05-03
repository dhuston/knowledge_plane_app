#!/bin/bash
# Script to run tests for the new map components

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Map Component Tests${NC}"
echo "====================================="

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit 1

# Function to run tests for a specific component
run_test() {
  local component_name=$1
  local test_path=$2
  
  echo -e "${BLUE}Testing ${component_name}${NC}"
  echo "------------------------------------"
  
  if [ -f "$test_path" ]; then
    npm test -- "$test_path" --watchAll=false
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}${component_name} tests passed!${NC}"
    else
      echo -e "${RED}${component_name} tests failed!${NC}"
    fi
  else
    echo -e "${RED}Test file not found at: ${test_path}${NC}"
  fi
  echo ""
}

# List of components to test
run_test "MapDataProvider" "src/components/map/providers/__tests__/MapDataProvider.test.tsx"
run_test "EnhancedSigmaGraph" "src/components/map/graph/__tests__/EnhancedSigmaGraph.test.tsx"

# Run all tests in map directory
echo -e "${YELLOW}Running all map component tests${NC}"
echo "------------------------------------"
npm test -- src/components/map --watchAll=false

echo ""
echo -e "${GREEN}Test Runner Complete${NC}"
echo "====================================="
echo -e "${YELLOW}Summary:${NC}"
echo "- Test files ran: $(find src/components/map -name '*.test.tsx' | wc -l | xargs)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add more tests for remaining components"
echo "2. Fix any failing tests"
echo "3. Run visual regression tests"
echo ""