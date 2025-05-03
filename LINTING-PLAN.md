# Biosphere Alpha Linting Improvement Plan

## Overview

After analyzing the codebase, we've identified several linting issues that need to be addressed in both frontend and backend code. This document outlines a comprehensive plan to fix these issues and improve code quality.

## Frontend Issues (699 problems: 657 errors, 42 warnings)

### High Priority

#### 1. TypeScript `no-explicit-any` Errors (~234 occurrences)
- Replace `any` types with appropriate interface types or use more specific types 
- For example, use `Record<string, unknown>` or `unknown` instead of `any` when exact type is not known
- Create appropriate interfaces for data structures and API responses
- Focus first on core components and critical functionality

#### 2. Unused Variables and Imports (~210 occurrences)
- Remove unused imports and variables across the codebase
- Consider implementing ESLint auto-fix when appropriate
- Focus first on primary components and critical code paths
- Check for commented code that should be removed

#### 3. React Hooks Rules Violations (~25 occurrences)
- Fix conditional hook calls in components like `WorkspaceDashboard.tsx`
- Ensure hooks are always called at the top level
- Add missing dependencies to dependency arrays
- Fix `exhaustive-deps` warnings with proper cleanup functions

### Medium Priority

#### 4. Install and Configure Prettier
- Install Prettier as a dev dependency
- Create configuration file `.prettierrc` with project styling rules
- Integrate with ESLint using `eslint-config-prettier` and `eslint-plugin-prettier`
- Add npm script for formatting code

#### 5. Ban ts-ignore Comments
- Replace `@ts-ignore` with `@ts-expect-error` with explanatory comments
- Address the underlying type issues where possible

#### 6. Fix Test Files
- Update test import styles (replace `require()` style imports)
- Add proper typing for test data and mocks

#### 7. Other Issues
- Remove unnecessary escape characters in regular expressions
- Fix no-case-declarations errors

## Backend Issues (Many Python style issues)

### Medium Priority

#### 1. Python Unused Imports
- Remove unused imports from python files
- Use tools like `autoflake` to automatically remove unused imports
- Focus first on API routes and core functionality

#### 2. Line Length and Trailing Whitespace
- Configure and run `autopep8` to fix line length issues (limit to 100 characters)
- Remove all trailing whitespace
- Add a pre-commit hook to prevent future occurrences

### Low Priority 

#### 3. Python Whitespace and Blank Line Issues
- Fix inconsistent indentation
- Add appropriate blank lines between functions and classes
- Fix line spacing inside functions

## Automation

### 1. Create Automated Formatting Scripts

#### Frontend
```bash
#!/bin/bash
cd frontend
echo "Linting frontend code..."
npm run lint -- --fix
echo "Installing and running Prettier..."
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
echo "Formatting frontend code with Prettier..."
npx prettier --write "src/**/*.{ts,tsx}"
```

#### Backend
```bash
#!/bin/bash
cd backend
echo "Installing Python linting tools..."
pip3 install autopep8 flake8 autoflake
echo "Fixing Python formatting issues..."
python3 -m autopep8 --in-place --aggressive --aggressive --max-line-length 100 --recursive app/
python3 -m autoflake --in-place --remove-all-unused-imports --recursive app/
```

### 2. CI/CD Integration

- Add linting checks to the CI pipeline
- Fail builds that introduce new linting errors
- Add pre-commit hooks to prevent committing non-compliant code

## Implementation Timeline

1. **Week 1**: Address high-priority frontend issues
   - Fix React Hooks errors
   - Fix most critical `no-explicit-any` issues in core components
   - Remove unused variables/imports in main application files

2. **Week 2**: Set up automation and continue frontend fixes
   - Install and configure Prettier
   - Create linting scripts
   - Continue fixing TypeScript typing issues

3. **Week 3**: Backend improvements and remaining frontend issues
   - Fix Python unused imports
   - Fix line length and whitespace issues
   - Complete remaining frontend linting fixes

4. **Week 4**: Quality assurance and documentation
   - Verify all critical linting issues are resolved
   - Document coding standards for future development
   - Add pre-commit hooks and CI checks

## Conclusion

This plan provides a structured approach to improving code quality by addressing linting issues in the Biosphere Alpha project. Addressing these issues will improve code maintainability, prevent bugs, and make future development more efficient.