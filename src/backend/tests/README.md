# Tags API Testing Documentation

This directory contains comprehensive test coverage for the Tags API endpoints, including both automated tests and Postman collections for manual/automated API testing.

## Test Structure

### 1. Unit Tests (`tests/tags.test.ts`)
- **Purpose**: Test individual route handlers in isolation using mocked dependencies
- **Coverage**: All CRUD operations (CREATE, READ, UPDATE, DELETE)
- **Mocking**: Uses Jest mocks for Prisma Client to avoid database dependencies
- **Focus**: Business logic, error handling, response formatting

### 2. Integration Tests (`tests/tags.integration.test.ts`)
- **Purpose**: Test complete API workflows with real database interactions
- **Coverage**: Full CRUD lifecycle, data persistence verification
- **Database**: Uses test database or separate schema
- **Focus**: End-to-end functionality, data consistency, real-world scenarios

### 3. Postman Collection (`postman/Tags-API-Tests.postman_collection.json`)
- **Purpose**: Manual testing and API documentation
- **Coverage**: All endpoints with various scenarios (success/error cases)
- **Features**: Automated test scripts, dynamic data generation, environment variables
- **Focus**: API contract validation, user acceptance testing

## Running Tests

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up test database (for integration tests):
   ```bash
   # Copy environment template
   cp .env.test.example .env.test
   
   # Edit .env.test with your test database credentials
   # Example: TEST_DATABASE_URL="postgresql://user:password@localhost:5432/eventgo_test"
   ```

3. Run database migrations on test database:
   ```bash
   # Set TEST_DATABASE_URL in your environment or .env.test file
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```

### Running Different Test Types

#### Unit Tests Only
```bash
npm run test
```
- Fast execution (mocked dependencies)
- No database required
- Focuses on business logic

#### Integration Tests Only
```bash
npm run test:integration
```
- Requires test database
- Tests real database interactions
- Slower but more comprehensive

#### All Tests
```bash
npm run test:all
```
- Runs both unit and integration tests
- Provides complete coverage

#### Test with Coverage Report
```bash
npm run test:coverage
```
- Generates coverage report in `coverage/` directory
- Opens HTML report in browser

#### Watch Mode (Development)
```bash
npm run test:watch
```
- Runs tests automatically when files change
- Great for TDD workflow

### Postman Testing

#### Import Collection and Environment
1. Open Postman
2. Import `postman/Tags-API-Tests.postman_collection.json`
3. Import `postman/Tags-API.postman_environment.json`
4. Select the "Tags API Environment" in Postman

#### Update Environment Variables
- Set `baseUrl` to your server URL (default: `http://localhost:3001`)
- The `tagId` variable will be automatically populated during test execution

#### Run Collection
1. **Manual Testing**: Execute requests individually to test specific scenarios
2. **Automated Run**: Use Collection Runner to execute all tests automatically
3. **Newman CLI**: Run from command line using Newman

#### Newman CLI (Command Line Postman)
```bash
# Install Newman
npm install -g newman

# Run collection
newman run postman/Tags-API-Tests.postman_collection.json \
  -e postman/Tags-API.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export newman-report.html
```

## Test Coverage

### API Endpoints Tested

#### POST /api/tags
- ✅ Create tag with valid data
- ✅ Handle creation errors
- ✅ Validate required fields
- ✅ Test with missing/invalid data

#### GET /api/tags
- ✅ Fetch all tags successfully
- ✅ Handle database errors
- ✅ Return empty array when no tags exist
- ✅ Verify ordering (by ID ascending)

#### PUT /api/tags/:id
- ✅ Update existing tag
- ✅ Handle non-existent tag updates
- ✅ Validate ID format
- ✅ Test with invalid/missing data

#### DELETE /api/tags/:id
- ✅ Delete existing tag
- ✅ Handle non-existent tag deletion
- ✅ Validate ID format
- ✅ Verify cascade deletion (if applicable)

### Error Scenarios Tested
- Database connection errors
- Invalid input data
- Non-existent resource operations
- Invalid ID formats (NaN handling)
- Missing required fields
- Constraint violations

### Data Validation Tested
- Required field presence
- Data type validation
- Response structure validation
- Database constraint handling

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Preset**: ts-jest for TypeScript support
- **Environment**: Node.js
- **Coverage**: Routes directory only
- **Timeout**: 30 seconds (unit tests)
- **Setup**: Custom setup file for mocking

### Integration Test Configuration (`jest.integration.config.js`)
- **Timeout**: 60 seconds (longer for database operations)
- **Database**: Uses TEST_DATABASE_URL environment variable
- **Cleanup**: Automatic cleanup after each test

### Environment Variables
- `TEST_DATABASE_URL`: Separate database for integration tests
- `NODE_ENV`: Set to "test" during test execution
- `DATABASE_URL`: Fallback database URL

## Best Practices Followed

### Test Organization
- Descriptive test names
- Grouped by functionality (describe blocks)
- Clear arrange-act-assert structure
- Isolated test cases (no dependencies between tests)

### Data Management
- Automatic cleanup after integration tests
- Mock data for unit tests
- Dynamic test data generation (Postman)
- No shared state between tests

### Error Handling Testing
- Both expected and unexpected error scenarios
- Error message validation
- HTTP status code verification
- Edge case coverage

### Performance Considerations
- Unit tests run quickly (mocked dependencies)
- Integration tests use transactions where possible
- Parallel test execution where safe
- Minimal database interactions per test

## Continuous Integration

### GitHub Actions / CI Pipeline
```yaml
# Example CI configuration
- name: Run Unit Tests
  run: npm run test

- name: Run Integration Tests
  run: npm run test:integration
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

- name: Run Postman Tests
  run: newman run postman/Tags-API-Tests.postman_collection.json
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Test Database Connection**
   - Verify TEST_DATABASE_URL is correctly set
   - Ensure test database exists and is accessible
   - Check database permissions

2. **Jest Module Resolution**
   - Verify ts-jest configuration
   - Check TypeScript configuration
   - Ensure all dependencies are installed

3. **Postman Environment**
   - Verify server is running on expected port
   - Check environment variable configuration
   - Ensure collection and environment are properly imported

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm run test

# Run specific test file
npx jest tests/tags.test.ts --verbose
```

## Extending Tests

### Adding New Test Cases
1. **Unit Tests**: Add to `tests/tags.test.ts`
2. **Integration Tests**: Add to `tests/tags.integration.test.ts`
3. **Postman**: Add new request to collection

### Testing New Endpoints
1. Create new test file: `tests/[endpoint].test.ts`
2. Follow existing patterns and naming conventions
3. Update Jest configuration if needed
4. Create corresponding Postman collection

### Custom Matchers
```typescript
// Example custom Jest matcher
expect.extend({
  toBeValidTag(received) {
    const pass = received && 
                 typeof received.id === 'number' &&
                 typeof received.name === 'string' &&
                 typeof received.color === 'string';
    
    return {
      message: () => `expected ${received} to be a valid tag`,
      pass,
    };
  },
});
```