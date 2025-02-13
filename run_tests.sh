#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run tests
run_tests() {
    local test_type=$1
    echo "🧪 Running ${test_type} tests..."
    python -m tests.run_tests ${test_type}
    return $?
}

echo "🚀 Starting test environment..."

# Build and start Docker containers
docker-compose down -v
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run tests based on arguments
if [ $# -eq 0 ]; then
    # Run all tests if no arguments provided
    run_tests
    TEST_EXIT_CODE=$?
else
    # Run specific test types
    for test_type in "$@"
    do
        run_tests $test_type
        if [ $? -ne 0 ]; then
            TEST_EXIT_CODE=1
            break
        fi
    done
fi

# Stop Docker containers
echo "🧹 Cleaning up..."
docker-compose down -v

# Exit with the test exit code
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed!${NC}"
fi

exit $TEST_EXIT_CODE 