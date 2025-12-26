# kysely-gen

Generate TypeScript types from your PostgreSQL database for [Kysely](https://kysely.dev/).

## Install

```sh
npm install kysely-gen kysely pg
```

## Usage

```sh
DATABASE_URL=postgres://user:pass@localhost:5432/db npx kysely-gen
```

## Options

| Option | Description |
|--------|-------------|
| `--out <path>` | Output file (default: `./db.d.ts`) |
| `--schema <name>` | Schema to introspect (repeatable) |
| `--url <string>` | Database URL (overrides `DATABASE_URL`) |
| `--camel-case` | Convert names to camelCase |
| `--include-pattern <glob>` | Only include matching tables |
| `--exclude-pattern <glob>` | Exclude matching tables |

## Example

```sh
kysely-gen --out ./src/db.d.ts --camel-case
```

Generates:

```typescript
import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Status = 'pending' | 'approved' | 'rejected';

export interface User {
  id: Generated<number>;
  email: string;
  status: Status;
  createdAt: ColumnType<Date, Date | string, Date | string>;
}

export interface DB {
  users: User;
}
```

## Features

- PostgreSQL enums mapped to union types
- `ColumnType` for select/insert/update type differences
- `Generated<T>` for auto-increment and default columns
- Materialized views, domains, partitioned tables
- Glob patterns for table filtering

## License

MIT
