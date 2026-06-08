#!/bin/bash

##############################################################################
# Pre-Deployment Checklist Script
# Vérifie que tous les prérequis sont remplis avant déploiement production
##############################################################################

set -e

echo "🚀 Sojori Vente - Pre-Deployment Checklist"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

echo "📋 1. Environment Variables"
echo "----------------------------"

# Check .env.local exists
if [ -f ".env.local" ]; then
    check_pass ".env.local file exists"

    # Check critical variables
    if grep -q "NEXT_PUBLIC_API_BASE_URL" .env.local; then
        check_pass "NEXT_PUBLIC_API_BASE_URL is set"
    else
        check_fail "NEXT_PUBLIC_API_BASE_URL is missing"
    fi

    if grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local; then
        if grep -q "REPLACE_WITH_ACTUAL_KEY" .env.local; then
            check_warn "Clerk publishable key needs to be updated"
        else
            check_pass "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set"
        fi
    else
        check_warn "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing (optional)"
    fi
else
    check_fail ".env.local file is missing"
fi

echo ""
echo "📦 2. Dependencies"
echo "------------------"

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version >= 18 (current: $(node --version))"
else
    check_fail "Node.js version < 18 (current: $(node --version))"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    check_pass "pnpm is installed ($(pnpm --version))"
else
    check_fail "pnpm is not installed"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_warn "node_modules not found. Run: pnpm install"
fi

echo ""
echo "🔨 3. Build Check"
echo "------------------"

# Try to build
echo "Building application..."
if pnpm build > /tmp/sojori-build.log 2>&1; then
    check_pass "Build succeeded"
else
    check_fail "Build failed. Check /tmp/sojori-build.log"
    cat /tmp/sojori-build.log | tail -20
fi

echo ""
echo "🧪 4. Tests"
echo "-----------"

# Check if Playwright is installed
if [ -d "node_modules/@playwright" ]; then
    check_pass "Playwright is installed"

    # Run tests
    # echo "Running E2E tests..."
    # if pnpm exec playwright test > /tmp/sojori-tests.log 2>&1; then
    #     check_pass "All E2E tests passed"
    # else
    #     check_fail "Some E2E tests failed. Check /tmp/sojori-tests.log"
    # fi
    check_warn "E2E tests not run (uncomment to enable)"
else
    check_warn "Playwright not installed"
fi

echo ""
echo "🔍 5. Code Quality"
echo "------------------"

# TypeScript check
if pnpm type-check > /tmp/sojori-typecheck.log 2>&1; then
    check_pass "TypeScript check passed"
else
    check_fail "TypeScript errors found. Check /tmp/sojori-typecheck.log"
fi

# Linting
if pnpm lint > /tmp/sojori-lint.log 2>&1; then
    check_pass "ESLint check passed"
else
    check_warn "Linting issues found. Run: pnpm lint:fix"
fi

echo ""
echo "📄 6. Required Files"
echo "--------------------"

# Check critical files
FILES=(
    "app/page.tsx"
    "app/layout.tsx"
    "app/sitemap.ts"
    "app/robots.ts"
    "next.config.ts"
    "package.json"
    "tsconfig.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file is missing"
    fi
done

echo ""
echo "🌐 7. API Connectivity"
echo "----------------------"

# Check backend API
API_URL="${NEXT_PUBLIC_API_BASE_URL:-https://dev.sojori.com}"
if curl -s -f "$API_URL/api/v1/listing/public/listings" > /dev/null 2>&1; then
    check_pass "Backend API is reachable ($API_URL)"
else
    check_warn "Backend API unreachable or returned error"
fi

echo ""
echo "🔒 8. Security"
echo "--------------"

# Check for hardcoded secrets (basic check)
if grep -r "sk_live_" --include="*.ts" --include="*.tsx" app/ 2>/dev/null | grep -v node_modules; then
    check_fail "Found hardcoded Clerk secret keys in code!"
else
    check_pass "No hardcoded secrets found in app/"
fi

# Check for console.log in production code
LOG_COUNT=$(grep -r "console.log" --include="*.ts" --include="*.tsx" app/ 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -gt 50 ]; then
    check_warn "Found $LOG_COUNT console.log statements (consider removing for production)"
else
    check_pass "Console.log usage is reasonable ($LOG_COUNT occurrences)"
fi

echo ""
echo "📊 9. Performance"
echo "-----------------"

# Check bundle size (if .next exists)
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next | cut -f1)
    check_pass "Build output size: $BUNDLE_SIZE"

    # Check for large pages
    LARGE_PAGES=$(find .next/static -name "*.js" -size +500k 2>/dev/null | wc -l)
    if [ "$LARGE_PAGES" -gt 0 ]; then
        check_warn "Found $LARGE_PAGES JavaScript files > 500KB (consider code splitting)"
    else
        check_pass "No oversized JavaScript bundles detected"
    fi
else
    check_warn ".next directory not found (run build first)"
fi

echo ""
echo "📚 10. Documentation"
echo "--------------------"

DOCS=(
    "docs/AUDIT_COMPLET_2026-05-30.md"
    "docs/DEPLOYMENT_GUIDE.md"
    "docs/FINAL_DELIVERY_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc not found"
    fi
done

echo ""
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! Ready for deployment!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  All critical checks passed, but there are $WARNINGS warnings.${NC}"
        echo "Review warnings above before deploying to production."
        exit 0
    fi
else
    echo -e "${RED}❌ $FAILED critical checks failed. Fix issues before deploying.${NC}"
    exit 1
fi
