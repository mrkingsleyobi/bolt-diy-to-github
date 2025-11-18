# Contributing to bolt-diy-to-github

Thank you for your interest in contributing to bolt-diy-to-github! We're excited to have you join our community of developers working on AI-powered development workflow automation.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Style Guides](#style-guides)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- Node.js (version 18.x or higher)
- npm package manager
- Chrome browser for testing the extension
- GitHub account for authentication

### Initial Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bolt-diy-to-github.git
   cd bolt-diy-to-github
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## Development Environment

### Project Structure

```
bolt-diy-to-github/
├── src/
│   ├── config/              # Configuration management and environment adapters
│   ├── github/              # GitHub API integration and services
│   ├── monitoring/          # Alerting and monitoring services
│   ├── security/            # Security services (encryption, authentication)
│   ├── services/            # Core services (auth, token validation)
│   ├── utils/               # Utility functions and helpers
│   └── types/               # Type definitions
├── tests/                   # All test files
├── docs/                    # Documentation
├── examples/                # Usage examples
└── dist/                    # Compiled output (not committed)
```

### Building the Extension

```bash
# Build the Chrome extension
npm run build:extension

# Development mode with hot reloading
npm run dev:extension
```

## How to Contribute

### Reporting Issues

- Use the issue templates when reporting bugs or requesting features
- Search existing issues before creating a new one
- Include environment information and steps to reproduce
- For security vulnerabilities, follow the security reporting process (not public issues)

### Suggesting Features

- Check if the feature already exists or is being worked on
- Open an issue to discuss your idea first
- Provide clear use cases and benefits
- Consider the project's scope and goals

### Code Contributions

#### Bug Fixes

1. Create an issue describing the bug (if one doesn't exist)
2. Fork the repository and create a branch
3. Write a failing test case demonstrating the bug
4. Fix the bug and ensure tests pass
5. Submit a pull request

#### New Features

1. Open an issue to discuss your feature idea
2. Wait for community feedback and maintainers' approval
3. Fork the repository and create a branch
4. Implement the feature with tests
5. Update documentation if needed
6. Submit a pull request

## Style Guides

### TypeScript Style Guide

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Maintain consistency with existing codebase
- Use JSDoc for public methods and classes
- Follow the established naming conventions

### Chrome Extension API Best Practices

- Use secure manifest version 3
- Implement proper error handling
- Follow Chrome Extension security best practices
- Use content security policy appropriately
- Store sensitive data securely using extension APIs

### Security Best Practices

- Implement proper input validation
- Use secure token handling
- Follow OWASP guidelines
- Encrypt sensitive data appropriately
- Implement rate limiting where appropriate

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test files
npm test -- tests/unit/monitoring/EnhancedConfigurationAlertingService.test.ts

# Run type checking
npm run typecheck
```

### Test Structure

- Write tests using Jest framework
- Follow the London School TDD methodology
- Mock external dependencies
- Test both happy path and error conditions
- Maintain high test coverage (>80%)
- Write integration and end-to-end tests in addition to unit tests

### Test Categories

- Unit tests for individual functions and classes
- Integration tests for service interactions
- End-to-end tests for complete workflows
- Security tests for authentication and data protection
- Performance tests for critical operations

## Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass: `npm test`
   - Run type checking: `npm run typecheck`
   - Update documentation if needed
   - Follow the code style of the project

2. **Creating the PR**
   - Use a clear title describing the changes
   - Include a detailed description explaining the changes
   - Reference any related issues
   - Add appropriate labels

3. **During Review**
   - Respond to feedback promptly
   - Make requested changes
   - Add reviewers if appropriate

4. **After Approval**
   - Your PR will be merged by maintainers
   - Thank you for your contribution!

### PR Checklist Template

```
## PR Checklist

- [ ] All tests pass locally
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Code follows the project style guide
- [ ] New features have corresponding tests
- [ ] Documentation updated (if applicable)
- [ ] Breaking changes are documented
- [ ] Security implications considered
- [ ] Code review completed
```

## Development Best Practices

### Architecture Patterns

- Follow the London School TDD approach with outside-in development
- Use dependency injection for better testability
- Implement proper separation of concerns
- Maintain loose coupling between components

### Performance Considerations

- Optimize for memory usage in ZIP processing
- Implement proper backpressure handling
- Use streaming APIs where appropriate
- Minimize extension bundle size

### Security Considerations

- Encrypt sensitive tokens using AES-256
- Implement proper validation for all inputs
- Use secure communication with APIs
- Follow Chrome extension security guidelines

## Code Review Process

- Changes to core functionality require review from maintainers
- Code should be clean, well-documented, and well-tested
- Performance and security implications should be considered
- Breaking changes should be justified and documented
- PRs should include appropriate test coverage

## Community

### Communication Channels

- Use GitHub Issues for bug reports and feature requests
- Join our discussions in the repository
- Check the repository for any community links as they're added

### Support

- For help with using the extension, check existing issues or create a new one
- For questions about contributing, start by reading these guidelines
- Be respectful and helpful to other community members

## Recognition

We appreciate all contributions, whether they're bug fixes, new features, documentation, or tests. Contributors will be recognized in our release notes and project documentation.

Thank you for contributing to bolt-diy-to-github and helping make AI-powered development workflow automation better for everyone!