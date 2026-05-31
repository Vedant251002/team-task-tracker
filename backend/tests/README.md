# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the Team Task Tracker backend.

## Test Structure

```
tests/
├── unit/                      # Unit tests for individual components
│   ├── analytics.service.test.ts
│   ├── auth.service.test.ts
│   ├── cache.service.test.ts
│   ├── jwt.service.test.ts
│   ├── password.service.test.ts
│   ├── task.service.test.ts
│   └── user.service.test.ts
├── integration/               # Integration tests for API endpoints
│   ├── analytics.test.ts
│   ├── rbac.test.ts
│   ├── refresh-token.test.ts
│   ├── task-filters.test.ts
│   └── user.test.ts
├── auth.test.ts              # Authentication integration tests
├── task.test.ts              # Task management integration tests
├── setup.ts                  # Global test configuration
└── README.md                 # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- auth.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run only unit tests
```bash
npm test -- tests/unit
```

### Run only integration tests
```bash
npm test -- tests/integration
```

## Test Coverage

The test suite aims for the following coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Unit Tests

Unit tests focus on testing individual components in isolation with mocked dependencies.

### Services Tested:
- **AuthService**: User registration, login, token management
- **TaskService**: Task CRUD operations, status transitions
- **UserService**: User management operations
- **AnalyticsService**: Overdue tasks and completion time analytics
- **CacheService**: Redis caching operations
- **PasswordService**: Password hashing and comparison
- **JWTService**: Token generation and verification

## Integration Tests

Integration tests verify the complete request-response cycle with real database interactions.

### Test Suites:
- **Authentication**: Registration, login, logout, token refresh
- **Task Management**: CRUD operations, status transitions, filtering
- **User Management**: User CRUD, role updates
- **Analytics**: Overdue tasks, completion time metrics
- **RBAC**: Role-based access control for different user roles
- **Task Filters**: Filtering by status, priority, assignee, pagination

## Test Environment

Tests run in an isolated environment with:
- Separate test database (`tasktracker_test`)
- In-memory or test Redis instance
- Mock JWT secrets
- Extended timeout (30 seconds) for integration tests

## Prerequisites

Before running tests, ensure:
1. PostgreSQL is running with a test database
2. Redis is running (or mocked)
3. Environment variables are set (handled by `setup.ts`)

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeAll`, `afterAll`, `beforeEach`, `afterEach` for setup/teardown
3. **Mocking**: Mock external dependencies in unit tests
4. **Assertions**: Use descriptive expect statements
5. **Coverage**: Aim for high coverage but focus on meaningful tests

## Continuous Integration

Tests should be run in CI/CD pipeline before deployment:
```bash
npm test -- --ci --coverage --maxWorkers=2
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `setup.ts`
- Verify test database exists

### Redis Connection Issues
- Ensure Redis is running
- Check Redis configuration
- Consider using mock Redis for unit tests

### Timeout Issues
- Increase timeout in `setup.ts`
- Check for hanging database connections
- Ensure proper cleanup in `afterAll` hooks
