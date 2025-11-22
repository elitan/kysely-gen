# kysely-typegen

Modern PostgreSQL type generator for Kysely, built with Bun and TDD principles.

A modern alternative to [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen), focused exclusively on PostgreSQL with a simpler, faster implementation.

## Features

- ✅ **PostgreSQL-focused** - Built specifically for PostgreSQL, no multi-database complexity
- ✅ **Solid foundations** - AST-based code generation ensures valid TypeScript
- ✅ **Type-safe** - Full TypeScript types throughout
- ✅ **Well-tested** - 109 passing tests with TDD approach
- ✅ **Fast** - Built with Bun for excellent performance
- ✅ **ColumnType support** - Proper types for select/insert/update operations
- ✅ **CamelCase plugin** - Optional camelCase conversion
- ✅ **PostgreSQL enums** - Properly maps enum columns to enum types
- ✅ **Table filtering** - Include/exclude tables with glob patterns
- ✅ **Materialized views** - Full support for PostgreSQL materialized views
- ✅ **Domains & partitions** - Handles PostgreSQL domain types and partitioned tables

## Installation

```sh
bun install kysely-typegen kysely pg
```

## Usage

### Basic usage

```sh
DATABASE_URL=postgres://user:password@localhost:5432/db kysely-typegen
```

### Specify output file

```sh
DATABASE_URL=postgres://localhost/db kysely-typegen --out ./src/db.d.ts
```

### Multiple schemas

```sh
DATABASE_URL=postgres://localhost/db kysely-typegen --schema public --schema auth
```

### CamelCase plugin support

Generate camelCase column and table names (for use with Kysely's CamelCasePlugin):

```sh
kysely-typegen --camel-case
```

This converts:
- Column names: `created_at` → `createdAt`
- Table names in DB interface: `user_profiles` → `userProfiles`
- Interface names stay PascalCase: `UserProfile`

### Filter tables

Only include specific tables:

```sh
kysely-typegen --include-pattern="public.user*"
kysely-typegen --include-pattern="public.users" --include-pattern="auth.*"
```

Exclude tables matching a pattern:

```sh
kysely-typegen --exclude-pattern="*_internal"
kysely-typegen --exclude-pattern="*.migrations"
```

Combine include and exclude:

```sh
kysely-typegen --include-pattern="public.*" --exclude-pattern="*_backup"
```

Pattern format is `schema.table` and supports glob syntax (`*`, `?`, `+(...)`, etc.).

## Example Output

```typescript
import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

// PostgreSQL enums are mapped to TypeScript union types
export type StatusEnum = 'pending' | 'approved' | 'rejected';

export interface User {
  id: Generated<number>;
  email: string;
  // Timestamps use ColumnType for flexible insert/update
  created_at: ColumnType<Date, Date | string, Date | string>;
  updated_at: ColumnType<Date, Date | string, Date | string> | null;
  is_active: boolean;
}

export interface Comment {
  id: Generated<number>;
  user_id: number;
  content: string;
  status: StatusEnum;  // ← Enum columns properly typed
  created_at: ColumnType<Date, Date | string, Date | string>;
}

export interface DB {
  users: User;
  comments: Comment;
}
```

### With --camel-case

```typescript
export interface User {
  id: Generated<number>;
  email: string;
  createdAt: ColumnType<Date, Date | string, Date | string>;  // ← camelCase!
  updatedAt: ColumnType<Date, Date | string, Date | string> | null;
  isActive: boolean;
}

export interface DB {
  users: User;  // ← camelCase table names
  comments: Comment;
}
```

## Development

### Setup

```sh
bun install
bun run db:up  # Start test database
```

### Testing

```sh
bun test              # Run all tests
bun test --watch      # Watch mode (TDD)
bun run db:logs       # View database logs
```

### Architecture

```
Database → Metadata → AST → TypeScript
```

- **Introspect** - Query `information_schema` for metadata
- **Transform** - Convert metadata to type-safe AST nodes
- **Serialize** - Generate clean TypeScript code

### Publishing

This section is for maintainers who publish new versions to npm.

**One-time setup:**

1. Create npm account and join the package (if not already)
2. Generate automation token at [npmjs.com](https://www.npmjs.com/settings/~/tokens)
   - Click "Generate New Token" → "Automation"
   - Copy the token
3. Add token to GitHub repository:
   - Go to repo Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: paste your token
   - Click "Add secret"

**Publishing a new version:**

1. Go to GitHub repository → Actions tab
2. Click "Publish to npm" workflow (left sidebar)
3. Click "Run workflow" button (right side)
4. Enter version number (e.g., `0.0.1`, `0.1.0`, `1.0.0`)
5. Click green "Run workflow" button

The workflow will automatically:
- Run all 109 tests
- Build the package
- Update package.json version
- Commit and push changes
- Create git tag
- Publish to npm with provenance
- Create GitHub Release with auto-generated notes

**View releases:** Check the [Releases page](https://github.com/elitan/kysely-typegen/releases) to see all published versions and changelogs.

## Project Structure

```
src/
├── ast/
│   ├── nodes.ts          # AST node types
│   └── serialize.ts      # AST → TypeScript serializer
├── introspect/
│   ├── types.ts          # Metadata types
│   └── postgres.ts       # PostgreSQL introspector
├── transform.ts          # Metadata → AST transformation
├── cli.ts               # CLI with commander + chalk + ora
└── index.ts             # Public API

test/
├── ast/
│   ├── nodes.test.ts
│   └── serialize.test.ts
├── introspect/
│   └── postgres.test.ts
├── transform.test.ts
└── integration.test.ts
```

### Key Features

- **PostgreSQL-Only** - No multi-database complexity, focused on doing PostgreSQL right
- **@/ Path Alias** - Clean imports without relative path hell
- **Professional CLI** - Built with commander, chalk, and ora
- **Test-Driven** - 109 tests, all passing (100% parity with kysely-codegen core features)
- **Type-Safe** - Full TypeScript throughout
- **ColumnType Support** - Proper types for select/insert/update differences
- **CamelCase Plugin** - Optional camelCase conversion
- **Enum Support** - PostgreSQL enums map to TypeScript types
- **Table Filtering** - Powerful glob-based filtering with micromatch
- **Advanced PostgreSQL** - Materialized views, domain types, partitions, array columns
