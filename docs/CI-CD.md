# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment setup for the Notification Service.

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

The CI workflow runs on every push to main branches and pull requests. It performs the following steps:

#### Build and Test Job

1. **Environment Setup**
   - Runs on Ubuntu latest
   - Tests against Node.js 18.x and 20.x
   - Spins up PostgreSQL 14 service for integration tests

2. **Linting**
   - Lints all three packages (shared, backend, frontend)
   - Uses ESLint with TypeScript support
   - Enforces code quality standards

3. **Building**
   - Builds shared package first
   - Builds backend package
   - Builds frontend package
   - Ensures TypeScript compilation succeeds

4. **Testing**
   - Runs backend unit tests with Jest
   - Runs frontend unit tests with Vitest
   - Uses test database for backend tests

#### Docker Build Job

1. **Docker Image Build**
   - Builds production Docker image
   - Multi-stage build for optimization
   - Only runs if build-and-test job succeeds

2. **Image Verification**
   - Tests that the Docker image can run
   - Verifies Node.js is available

## Running Tests Locally

### Backend Tests

```bash
# Run all backend tests
npm run test -w packages/backend

# Run with watch mode
npm run test:watch -w packages/backend

# Run with coverage
npm run test:coverage -w packages/backend
```

### Frontend Tests

```bash
# Run all frontend tests
npm run test -w packages/frontend

# Run with watch mode
npm run test:watch -w packages/frontend

# Run with coverage
npm run test:coverage -w packages/frontend
```

### All Tests

```bash
# Run all tests in all packages
npm test
```

## Linting Locally

### Lint All Packages

```bash
npm run lint
```

### Lint Individual Packages

```bash
# Backend
npm run lint -w packages/backend

# Frontend
npm run lint -w packages/frontend

# Shared
npm run lint -w packages/shared
```

### Auto-fix Linting Issues

```bash
# All packages
npm run lint --workspaces --if-present -- --fix

# Individual package
npm run lint:fix -w packages/backend
```

## Building Locally

### Build All Packages

```bash
npm run build
```

### Build Individual Packages

```bash
# Shared (build this first)
npm run build -w packages/shared

# Backend
npm run build -w packages/backend

# Frontend
npm run build -w packages/frontend
```

## Docker

### Build Docker Image

```bash
docker build -t notification-service:latest -f docker/Dockerfile .
```

### Run Docker Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e APNS_KEY_ID=your-key-id \
  notification-service:latest
```

### Docker Compose (Development)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: notification
      POSTGRES_PASSWORD: notification
      POSTGRES_DB: notification_service
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://notification:notification@postgres:5432/notification_service
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Test Coverage

The project aims for:
- **Backend**: >80% code coverage
- **Frontend**: >70% code coverage

View coverage reports:

```bash
# Backend coverage
npm run test:coverage -w packages/backend
open packages/backend/coverage/index.html

# Frontend coverage
npm run test:coverage -w packages/frontend
open packages/frontend/coverage/index.html
```

## Pre-commit Hooks (Optional)

To run linting and tests before every commit, install Husky:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm test
```

## Continuous Deployment

For continuous deployment, you can extend the CI workflow:

### Deploy to Production

Add a deploy job to `.github/workflows/ci.yml`:

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: docker-build
  if: github.ref == 'refs/heads/main'

  steps:
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        # e.g., kubectl apply, docker push, etc.
```

### Environment Secrets

Add the following secrets to your GitHub repository:

- `DATABASE_URL` - Production database URL
- `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_PATH` - Apple Push credentials
- `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` - Firebase credentials
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - Twilio credentials
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` - Email credentials

## Monitoring

Consider adding these monitoring tools:

1. **Code Coverage**: Codecov or Coveralls
2. **Code Quality**: SonarCloud or CodeClimate
3. **Dependency Scanning**: Dependabot or Snyk
4. **Performance Monitoring**: New Relic or DataDog

## Troubleshooting

### Tests Failing Locally But Passing in CI

- Ensure you have the correct Node.js version
- Check that PostgreSQL is running locally
- Verify environment variables are set

### Linting Errors

- Run `npm run lint:fix` to auto-fix issues
- Check ESLint configuration matches CI

### Docker Build Failures

- Ensure all dependencies are in package.json
- Check that build scripts work locally
- Verify Dockerfile paths are correct
