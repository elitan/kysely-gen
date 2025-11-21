# Changelog

All notable changes to kysely-typegen will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha.1] - 2025-01-21

### Added

- PostgreSQL database introspection for tables, columns, enums
- TypeScript type generation for Kysely with AST-based code generation
- `ColumnType<Select, Insert, Update>` support for timestamps, bigint, and numeric types
- `Generated<T>` wrapper for auto-increment and default value columns
- `--camel-case` flag to convert snake_case to camelCase (works with Kysely's CamelCasePlugin)
- Multiple schema support via `--schema` flag
- Table filtering with `--include-pattern` and `--exclude-pattern` (glob patterns)
- Materialized view introspection
- PostgreSQL domain type resolution to base types
- Partitioned table detection
- Array column support (e.g., text[], int4[])
- Column comment introspection
- CLI with helpful error messages, spinners, and colored output
- Comprehensive test suite with 109 passing tests

### Features

- **PostgreSQL-focused**: Built specifically for PostgreSQL, no multi-database complexity
- **Modern DX**: Built with Bun, uses TDD methodology
- **Type-safe generation**: AST-based code generation ensures valid TypeScript output
- **Fast**: Bun runtime provides excellent performance
- **Well-tested**: 100% integration test parity with kysely-codegen core features

## [Unreleased]

Check our [GitHub repository](https://github.com/elitan/kysely-typegen) for planned features.
