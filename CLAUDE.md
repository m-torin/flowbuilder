# CLAUDE.md

Guidance for Claude Code (claude.ai/code) - optimized for autonomous operation.

## 🎯 Primary Goal

Enable fully autonomous operation with explicit rules, self-correction, and
minimal user intervention.

## 🚨 Critical Rules - Always Apply

### NEVER Do:

- Run `pnpm dev` or `npm dev` (user only)
- Use localStorage/sessionStorage in artifacts
- Create bulk fix scripts
- Use file extensions in imports
- Create files unless absolutely necessary
- Use non-Next.js imports in Next.js apps
- Use `parameters` in AI SDK v5 tools (use `inputSchema`)

### ALWAYS Do:

- Use Grep tool instead of `grep` command
- Use Context7 MCP for latest library documentation
- For web search: Context7 MCP > Perplexity MCP > Official WebSearch (in
  priority order)
- Use `/next` imports in Next.js, `/edge` in edge runtime
- Run `pnpm typecheck` and `pnpm lint` before commits
- Use TodoWrite for multi-step tasks

## 📋 Essential Commands

```bash
# Setup (one-time)
pnpm install

# Build & Test
pnpm build                            # Local build
pnpm test                             # Run tests
pnpm typecheck && pnpm lint           # Code quality

# Repo Management
pnpm repo:ci                          # Full CI pipeline
pnpm repo:clean                       # Clean all artifacts
```

**⚠️ NEVER run `pnpm dev` - user only**

## 🛠 Technology Stack

| Category            | Technology                           | Notes                                  |
| ------------------- | ------------------------------------ | -------------------------------------- |
| **Core**            | Next.js, React, TypeScript          | App Router, typed routes               |
| **Package Manager** | pnpm                                 | Workspaces                             |
| **Build**           | Turborepo, Node 20+                  | ESM                                    |
| **Infrastructure**  | Vercel                               | Deployment                             |

## 📦 Module System

- **ESM only** - No CommonJS
- **Imports**: Always relative or package imports
- **No .cjs/.mjs**: Use .ts/.tsx only

## 🚀 Development Workflows

### Documentation First

Always check Context7 MCP for latest library docs:

```bash
1. mcp__context7__resolve-library-id("library-name")
2. mcp__context7__get-library-docs("/org/lib", topic="feature")
3. Implement with latest APIs
```

### New Feature Workflow

1. **Search** existing code with Grep tool
2. **Docs** via Context7 MCP
3. **Implement** with proper TypeScript types
4. **Test** with existing test framework
5. **Verify** → `pnpm typecheck && pnpm lint`

### Debug Checklist

- `pnpm typecheck` - Type errors
- `pnpm lint` - Code style issues
- Check imports are valid
- Verify build passes

## 🧪 Testing

### Test Structure

- **Location**: `__tests__/` or `*.test.{ts,tsx}`
- **Naming**: `*.test.{ts,tsx}` 
- **Imports**: Relative imports preferred
- **Assertions**: `.toBe()` for primitives, `.toStrictEqual()` for objects

## 📝 Git & Package Architecture

### Git Workflow

- Branch from `main`
- Conventional commits: `feat`, `fix`, `docs`, `style`, `refactor`, `test`,
  `chore`
- Pre-commit: `pnpm typecheck && pnpm lint`
- Never commit secrets

## 💻 Code Patterns

### AI SDK v5 Tools (Always use `inputSchema`)

```typescript
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Tool description",
  inputSchema: z.object({
    query: z.string().describe("Query parameter"),
    limit: z.number().optional().default(10)
  }),
  execute: async ({ query, limit }) => {
    // Implementation
  }
});
```

**Critical**: AI SDK v5 uses `inputSchema` (NOT `parameters`). Never use
`parameters` - it will break type inference and runtime execution.

### Config Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Standard configuration
- **Prettier**: Consistent formatting

## 🔧 Troubleshooting

### Quick Anti-Pattern Reference

| Category         | ❌ Wrong               | ✅ Right                           |
| ---------------- | ---------------------- | ---------------------------------- |
| **Imports**      |
|                  | File extensions        | No extensions                      |
|                  | Absolute paths         | Relative imports                   |
| **Patterns**     |
|                  | `useEffect` + fetch    | Server components                  |
| **Testing**      |
|                  | `.toEqual()` objects   | `.toStrictEqual()`                 |

### Common Fixes

1. **Module not found** → Check import paths
2. **Type errors** → `pnpm typecheck` + fix issues
3. **Build fails** → Check for circular dependencies
4. **Lint issues** → `pnpm lint` + fix style issues

## 📚 Documentation & Resources

### Documentation Locations

- **README**: Project root documentation
- **Package Docs**: Individual package documentation

---

## 🎯 Final Reminders

- Do only what's asked, nothing more
- Prefer editing over creating files
- Never create docs unless explicitly requested
- Always use proper TypeScript types
- Check Context7 MCP for latest library documentation
- Use TodoWrite for multi-step tasks