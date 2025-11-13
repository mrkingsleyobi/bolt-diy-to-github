# Environment Configuration Management CI/CD Workflows - Usage Guide

## Overview

This guide explains how to use the CI/CD workflows implemented for the Environment Configuration Management feature.

## Workflow Triggers

### Automatic Triggers

1. **CI Workflows** (`ci-environment-config.yml`, `ci-cd-environment-config-complete.yml`)
   - Triggered on push to `main` or `develop` branches
   - Triggered on pull requests to `main` branch
   - Only runs when files in `src/config/`, `src/security/`, or test directories are changed

2. **Security Scanning** (`security-scan.yml`)
   - Triggered on push to `main` or `develop` branches
   - Triggered on pull requests to `main` branch
   - Runs daily at 2 AM UTC via scheduled trigger

3. **Code Review** (`code-review.yml`)
   - Triggered on pull requests to `main` branch
   - Only runs when relevant files are changed

4. **Monitoring** (`monitoring.yml`)
   - Runs hourly via scheduled trigger
   - Can be manually triggered via GitHub UI

### Manual Triggers

All workflows can be manually triggered from the GitHub Actions UI.

## Required Repository Setup

### Secrets

Configure the following secrets in your GitHub repository settings:

1. `NPM_TOKEN` - For publishing to npm registry (required for deployment)
2. `SNYK_TOKEN` - For security scanning with Snyk (recommended)
3. `CODECOV_TOKEN` - For uploading coverage reports (optional)

### Branch Protection Rules

Set up the following branch protection rules:

#### Main Branch
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

#### Develop Branch
- Require status checks to pass
- Require branches to be up to date before merging

### Environments

Set up the following environments in GitHub:

1. **Production**
   - Protection: Full
   - Deployment: Automatic on merge to main or release publication

2. **Staging**
   - Protection: Moderate
   - Deployment: Automatic on merge to staging branch

3. **Development**
   - Protection: Minimal
   - Deployment: For testing only

## Workflow Descriptions

### Continuous Integration (ci-environment-config.yml)

This workflow runs tests for the Environment Configuration Management feature:

1. Checks out the code
2. Sets up Node.js (versions 18.x and 20.x)
3. Installs dependencies
4. Runs unit tests for Environment Configuration Service
5. Runs integration tests for Environment Configuration Management
6. Runs security tests
7. Runs all config-related tests
8. Performs type checking
9. Uploads test results as artifacts

### Security Scanning (security-scan.yml)

This workflow performs security scanning:

1. Checks out the code
2. Sets up Node.js
3. Installs dependencies
4. Runs ESLint security plugin
5. Runs Snyk vulnerability scanning
6. Runs npm audit
7. Checks for hardcoded secrets
8. Runs CodeQL analysis
9. Performs dependency checks

### Deployment (deploy-environment-config.yml)

This workflow handles deployment:

1. Builds and tests the project on push to main
2. Publishes to npm on release publication
3. Deploys documentation

### Complete CI/CD Pipeline (ci-cd-environment-config-complete.yml)

This is a comprehensive workflow that covers all CI/CD aspects:

1. Sets up matrix testing across Node.js versions
2. Runs all tests
3. Performs security analysis
4. Checks code quality
5. Builds the project
6. Deploys to staging (develop branch) or production (main branch/release)
7. Sends notifications on failures

### Code Review (code-review.yml)

This workflow performs automated code review for pull requests:

1. Runs linting
2. Performs security checks
3. Runs tests with coverage
4. Performs dependency review

### Monitoring (monitoring.yml)

This workflow performs scheduled monitoring:

1. Runs health checks
2. Performs performance monitoring
3. Checks for outdated dependencies
4. Runs security audits
5. Sends alerts on failures

## Monitoring and Alerting

The monitoring workflow runs hourly and:

1. Checks the health of the Environment Configuration Management system
2. Monitors performance
3. Checks for dependency updates
4. Runs security audits
5. Sends alerts on failures

## Contributing

See [CONTRIBUTING_ENV_CONFIG.md](../CONTRIBUTING_ENV_CONFIG.md) for guidelines on contributing to these workflows.

## Troubleshooting

### Common Issues

1. **Workflow fails due to missing secrets**
   - Ensure all required secrets are configured in repository settings

2. **Tests fail to compile**
   - Check that all dependencies are properly installed
   - Verify TypeScript configuration

3. **Security scanning fails**
   - Check Snyk token validity
   - Review security vulnerabilities found

### Getting Help

If you encounter issues with the workflows:

1. Check the workflow logs for specific error messages
2. Verify that all required secrets are configured
3. Ensure branch protection rules are properly set up
4. Contact the code owners listed in [CODEOWNERS](../CODEOWNERS)