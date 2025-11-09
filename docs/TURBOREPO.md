# Turborepo Guide

This project uses [Turborepo](https://turbo.build/repo) to manage the monorepo build system.

## Why Turborepo?

Turborepo provides significant performance improvements over traditional monorepo tools:

- **Smart Caching**: Never build the same thing twice
- **Parallel Execution**: Maximum CPU utilization
- **Dependency Awareness**: Builds things in the right order
- **Remote Caching**: Share cache across team (optional)

## Performance

**Without Turbo (traditional):**
- First build: ~15s
- Rebuild: ~15s (everything rebuilds)

**With Turbo:**
- First build: ~13s
- Cached rebuild: **~300ms** (100% cache hit)
- Partial rebuild: ~3-5s (only changed packages)

## Configuration

The monorepo is configured in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Task Definitions

- **build**: Builds packages in dependency order, caches dist/ output
- **lint**: Runs linting, no output to cache
- **test**: Runs tests after building, caches coverage/
- **dev**: Development mode, doesn't cache (persistent processes)

## Commands

### Build Everything

```bash
npm run build
```

This runs `turbo run build` which:
1. Analyzes the dependency graph
2. Builds `shared` first (dependency of backend/frontend)
3. Builds `backend` and `frontend` in parallel
4. Caches all outputs

### Build Specific Package

```bash
# Backend only (and its dependencies)
npm run backend:dev

# Frontend only (and its dependencies)
npm run frontend:dev
```

### Lint All Packages

```bash
npm run lint
```

### Run All Tests

```bash
npm run test
```

### Clean Everything

```bash
npm run clean
```

This removes:
- All `node_modules/`
- All `.turbo/` cache
- All build outputs

## Cache Behavior

Turbo caches tasks based on:
- File contents (via git)
- Environment variables
- Task configuration
- Dependency outputs

When nothing changes, Turbo replays the cached output instantly.

### What Gets Cached?

**Build task:**
- `dist/**` directories
- Console output (logs)

**Test task:**
- `coverage/**` directories
- Test results and logs

### Cache Location

Local cache: `.turbo/`

This directory is ignored by git and can be safely deleted.

## Filtering Tasks

Turbo supports filtering to run tasks on specific packages:

```bash
# Run build only for backend package
turbo run build --filter=@notification-service/backend

# Run tests only for frontend package
turbo run test --filter=@notification-service/frontend

# Run lint on all packages except frontend
turbo run lint --filter=!@notification-service/frontend
```

## CI/CD Integration

The GitHub Actions workflow uses Turbo for faster CI builds:

```yaml
- name: Build all packages
  run: npm run build  # Uses turbo automatically

- name: Run all tests
  run: npm run test   # Uses turbo automatically
```

## Remote Caching (Optional)

Turborepo supports remote caching to share build artifacts across your team and CI:

1. Sign up at [Vercel](https://vercel.com)
2. Link your repo: `npx turbo login`
3. Enable remote caching: `npx turbo link`

With remote caching:
- Team members share cache
- CI pulls from cache
- Builds become even faster

## Troubleshooting

### Force rebuild (bypass cache)

```bash
turbo run build --force
```

### View what Turbo is doing

```bash
turbo run build --dry-run
```

### Debug cache hits/misses

```bash
turbo run build --summarize
```

## Best Practices

1. **Keep tasks pure**: Don't rely on side effects
2. **Define outputs**: Tell Turbo what files to cache
3. **Use dependencies**: Link tasks with `dependsOn`
4. **Commit turbo.json**: Keep configuration in version control
5. **Ignore .turbo/**: Add to .gitignore

## Learn More

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
