# GitHub Workflows for Environment Configuration Management

This directory contains all the GitHub Actions workflows for the Environment Configuration Management feature.

## Workflows Overview

### Continuous Integration (CI)

1. **[ci-environment-config.yml](workflows/ci-environment-config.yml)**
   - Runs tests for Environment Configuration Management
   - Executes on push and pull request to main/develop branches
   - Tests Node.js versions 18.x and 20.x
   - Includes unit, integration, and security tests

2. **[ci-cd-environment-config-complete.yml](workflows/ci-cd-environment-config-complete.yml)**
   - Complete CI/CD pipeline for Environment Configuration Management
   - Comprehensive testing, security analysis, and deployment
   - Runs on push and pull request to main/develop branches

### Security

1. **[security-scan.yml](workflows/security-scan.yml)**
   - Security scanning for the Environment Configuration Management feature
   - Runs Snyk, npm audit, and CodeQL analysis
   - Executes on push, pull request, and daily schedule

### Code Review

1. **[code-review.yml](workflows/code-review.yml)**
   - Automated code review for pull requests
   - Linting, security checks, and dependency review
   - Runs on pull requests to main branch

### Deployment

1. **[deploy-environment-config.yml](workflows/deploy-environment-config.yml)**
   - Deployment workflow for Environment Configuration Management
   - Builds, tests, and deploys the feature
   - Runs on push to main branch and release publication

### Monitoring

1. **[monitoring.yml](workflows/monitoring.yml)**
   - Scheduled monitoring of the Environment Configuration Management system
   - Health checks, performance monitoring, and dependency updates
   - Runs hourly

## Configuration Files

- **[CODEOWNERS](CODEOWNERS)** - Code ownership definitions
- **[environment-config.md](environment-config.md)** - Environment configuration guidelines
- **[CONTRIBUTING_ENV_CONFIG.md](CONTRIBUTING_ENV_CONFIG.md)** - Contributing guidelines for Environment Configuration Management

## Required Secrets

For these workflows to function properly, the following secrets must be configured in the repository:

| Secret Name | Purpose | Required |
|-------------|---------|----------|
| `NPM_TOKEN` | Publishing to npm registry | Only for deployment |
| `SNYK_TOKEN` | Security scanning with Snyk | Recommended |
| `CODECOV_TOKEN` | Uploading coverage reports | Optional |

## Branch Protection Rules

The following branch protection rules are recommended:

### Main Branch
- Require pull request reviews (minimum 2 reviewers)
- Require status checks to pass:
  - `test-environment-config (18.x)`
  - `test-environment-config (20.x)`
  - `security-scan`
  - `code-quality`
- Require branches to be up to date before merging
- Require linear history
- Prevent force pushes
- Prevent deletions

### Develop Branch
- Require status checks to pass
- Require branches to be up to date before merging

## Environments

### Production
- Branch: `main`
- Protection: Full
- Deployment: Automatic on merge or release

### Staging
- Branch: `staging`
- Protection: Moderate
- Deployment: Automatic on merge

### Development
- Branch: `develop`
- Protection: Minimal
- Deployment: For testing only

## Monitoring and Alerting

The monitoring workflow runs hourly and performs:

1. Health checks of the Environment Configuration Management system
2. Performance monitoring
3. Dependency update checks
4. Security audits

Failures in monitoring will trigger alerts to the development team.

## Contributing

See [CONTRIBUTING_ENV_CONFIG.md](CONTRIBUTING_ENV_CONFIG.md) for guidelines on contributing to these workflows.