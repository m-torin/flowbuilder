# Security Cleanup Summary

## Overview
This document summarizes the security cleanup changes made to replace hardcoded tokens and sensitive information with environment variables.

## Changes Made

### 1. Replaced Hardcoded Vercel Tokens and Project IDs

**File**: `platform/flows/src/lib/domainActions.ts`

**Changes**:
- Replaced hardcoded Vercel project ID `'prj_6imjw8MltW65OAxBhrDy7waV71BD'` with `process.env.VERCEL_PROJECT_ID`
- Replaced hardcoded Vercel bearer token `'AYmHOKHYQwAS1EQrEeZULyI0'` with `process.env.VERCEL_AUTH_BEARER_TOKEN`
- Added validation to ensure required environment variables are present

**Before**:
```typescript
const projectId = 'prj_6imjw8MltW65OAxBhrDy7waV71BD';
const token = 'AYmHOKHYQwAS1EQrEeZULyI0';
```

**After**:
```typescript
const projectId = process.env.VERCEL_PROJECT_ID;
const token = process.env.VERCEL_AUTH_BEARER_TOKEN;

if (!projectId || !token) {
  throw new Error('VERCEL_PROJECT_ID and VERCEL_AUTH_BEARER_TOKEN must be configured');
}
```

### 2. Replaced Hardcoded AWS Account IDs

**Files**:
- `platform/flows/src/integrations/aws/eventbridge/shared.ts`
- `platform/flows/src/integrations/aws/sqs/validation.ts`
- `platform/flows/src/integrations/aws/eventbridge/validation.ts`
- `platform/flows/src/integrations/aws/s3/client.ts`

**Changes**:
- Replaced hardcoded AWS account ID `'123456789012'` with `process.env.AWS_ACCOUNT_ID`
- Updated validation logic to use environment variables

**Before**:
```typescript
const allowedAccounts = ['123456789012'];
const allowedPrincipals = ['arn:aws:iam::123456789012:root'];
```

**After**:
```typescript
const allowedAccounts = process.env.AWS_ACCOUNT_ID ? [process.env.AWS_ACCOUNT_ID] : [];
const allowedPrincipals = process.env.AWS_ACCOUNT_ID ? [`arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:root`] : [];
```

### 3. Created Environment Variables Template

**File**: `platform/flows/env.example`

**Added**: Comprehensive environment variables template with:
- Database configuration
- Authentication & security settings
- GitHub integration credentials
- AWS integration credentials
- Vercel integration credentials
- OpenAI integration credentials
- Cache & Redis configuration
- Domain & deployment settings
- Service configuration options

### 4. Updated Documentation

**File**: `platform/flows/README.md`

**Changes**:
- Updated environment setup instructions
- Added warning about required environment variables
- Listed all required environment variables with descriptions
- Updated file reference from `.env.local.example` to `env.example`

## Security Improvements

### Before Cleanup
- Hardcoded Vercel bearer token exposed in source code
- Hardcoded Vercel project ID exposed in source code
- Hardcoded AWS account IDs in multiple files
- No clear documentation of required environment variables

### After Cleanup
- All sensitive tokens and IDs moved to environment variables
- Added validation to ensure required variables are present
- Comprehensive environment variables template created
- Updated documentation with security requirements
- No hardcoded secrets remain in the codebase

## Required Environment Variables

The following environment variables must be configured:

### Critical Security Variables
- `AUTH_SECRET` / `NEXTAUTH_SECRET` - NextAuth.js encryption
- `ENCRYPTION_SECRET` - Custom data encryption
- `GITHUB_ID` / `GITHUB_SECRET` - GitHub OAuth
- `GITHUB_TOKEN` - GitHub API access
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `VERCEL_AUTH_BEARER_TOKEN` - Vercel API access
- `OPENAI_API_KEY` - OpenAI API access

### Database & Infrastructure
- `PRISMA_DB_URL` - Database connection
- `AWS_REGION` / `AWS_ACCOUNT_ID` - AWS configuration
- `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` - Vercel configuration
- `REDIS_URL` / `CACHE_STORE` - Cache configuration

### Application Configuration
- `NEXT_PUBLIC_ROOT_DOMAIN` - Domain configuration
- `VALID_SUBDOMAINS` - Subdomain validation
- Various service configuration options

## Next Steps

1. **Create `.env.local`**: Copy `env.example` to `.env.local` and fill in actual values
2. **Set up services**: Configure AWS, Vercel, GitHub, and OpenAI accounts
3. **Test functionality**: Verify all integrations work with environment variables
4. **Deploy securely**: Ensure environment variables are properly set in production

## Security Notes

- Never commit `.env.local` or any file containing actual secrets
- Use different credentials for development and production
- Rotate secrets regularly
- Consider using a secrets management service for production
- Review access permissions for all integrated services