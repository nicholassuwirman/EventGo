@echo off
echo Installing test dependencies...
cd backend
npm install

echo.
echo =====================================================
echo  Tags API Testing Setup Complete!
echo =====================================================
echo.
echo Available test commands:
echo.
echo 1. Unit Tests (fast, no database needed):
echo    npm run test
echo.
echo 2. Integration Tests (requires database):
echo    npm run test:integration
echo.
echo 3. All Tests:
echo    npm run test:all
echo.
echo 4. Tests with coverage report:
echo    npm run test:coverage
echo.
echo 5. Watch mode (runs tests on file changes):
echo    npm run test:watch
echo.
echo =====================================================
echo  Ready to test! Choose a command above.
echo =====================================================
pause