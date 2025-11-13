# GitHub Environment Configuration

## Environments

### Development
- Branch: `develop`
- No special protection rules
- Automated testing only

### Staging
- Branch: `staging`
- Protection rules:
  - Require pull request reviews
  - Require status checks to pass
  - Require branches to be up to date before merging

### Production
- Branch: `main`
- Protection rules:
  - Require pull request reviews (minimum 2 reviewers)
  - Require status checks to pass
  - Require branches to be up to date before merging
  - Require linear history
  - Allow force pushes: false
  - Allow deletions: false

## Required Status Checks

For all protected branches:
- `test-environment-config (18.x)`
- `test-environment-config (20.x)`
- `security-scan`
- `code-quality`
- `dependency-check`

## Required Reviews

Production branch requires:
- Minimum 2 reviewers
- Dismiss stale pull request approvals when new commits are pushed
- Require review from Code Owners

## Secrets Required

- `NPM_TOKEN` - For publishing to npm registry
- `SNYK_TOKEN` - For security scanning with Snyk
- `CODECOV_TOKEN` - For uploading coverage reports to Codecov
- `SLACK_WEBHOOK` - For notifications (optional)

## Deployment Process

1. All changes must be made through pull requests
2. Pull requests must pass all required status checks
3. Pull requests must be reviewed and approved
4. Changes are automatically deployed to staging on merge to `staging` branch
5. Changes are automatically deployed to production on merge to `main` branch or release creation