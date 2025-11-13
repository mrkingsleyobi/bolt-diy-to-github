# Task 00a: Setup Development Environment

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. This task establishes the foundational development environment needed for working with both the bolt-to-github Chrome extension and bolt.diy platform.

## Current System State
- Node.js needs to be installed
- pnpm package manager required
- Chrome/Chromium browser for extension testing
- Git for version control

## Your Task
Setup the development environment with all required tools and verify they work correctly.

## Test First (RED Phase)
```bash
# Check if Node.js is installed
node --version
# Should fail if not installed

# Check if pnpm is installed
pnpm --version
# Should fail if not installed

# Check if Git is installed
git --version
# Should fail if not installed
```

Minimal Implementation (GREEN Phase)
```bash
# Install Node.js (using nvm for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart terminal or source .bashrc
source ~/.bashrc
# Install latest LTS Node.js
nvm install --lts
nvm use --lts

# Install pnpm globally
npm install -g pnpm

# Install Git (if not already installed)
# Ubuntu/Debian: sudo apt-get install git
# macOS: brew install git
# Windows: Download from https://git-scm.com/
```

Refactored Solution (REFACTOR Phase)
```bash
#!/bin/bash
# setup-dev-env.sh

echo "Setting up development environment..."

# Check and install Node.js with nvm
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
    nvm install --lts
    nvm use --lts
else
    echo "Node.js already installed: $(node --version)"
fi

# Check and install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
else
    echo "pnpm already installed: $(pnpm --version)"
fi

# Check and install Git
if ! command -v git &> /dev/null; then
    echo "Please install Git manually from https://git-scm.com/"
    exit 1
else
    echo "Git already installed: $(git --version)"
fi

echo "Development environment setup complete!"
```

Verification Commands
```bash
# Run the setup script
chmod +x setup-dev-env.sh
./setup-dev-env.sh

# Verify installations
node --version
pnpm --version
git --version
```

Success Criteria
- [ ] Node.js installed and accessible
- [ ] pnpm installed and accessible
- [ ] Git installed and accessible
- [ ] Setup script runs without errors
- [ ] All tools are functional

Dependencies Confirmed
- Internet connection for downloading packages
- Appropriate permissions for installing software
- Compatible operating system (Windows, macOS, or Linux)

Next Task
task_00b_clone_repositories.md