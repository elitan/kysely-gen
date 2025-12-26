import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { serialize } from '@/ast/serialize';
import { introspectDatabase } from '@/introspect/postgres';
import { transformDatabase } from '@/transform';

const TEST_DATABASE_URL = 'postgres://test_user:test_password@localhost:5433/test_db';

describe('E2E: Types sync', () => {
  let db: Kysely<any>;

  beforeAll(async () => {
    const pool = new Pool({ connectionString: TEST_DATABASE_URL });
    db = new Kysely({ dialect: new PostgresDialect({ pool }) });
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('generated-types.ts matches current tool output', async () => {
    const metadata = await introspectDatabase(db, { schemas: ['public'] });
    const { program } = transformDatabase(metadata);
    const freshOutput = serialize(program);

    const committedTypes = await Bun.file('test/fixtures/generated-types.ts').text();

    expect(freshOutput.trim()).toBe(committedTypes.trim());
  });

  test('generated-types-camel.ts matches current tool output', async () => {
    const metadata = await introspectDatabase(db, { schemas: ['public'] });
    const { program } = transformDatabase(metadata, { camelCase: true });
    const freshOutput = serialize(program);

    const committedTypes = await Bun.file('test/fixtures/generated-types-camel.ts').text();

    expect(freshOutput.trim()).toBe(committedTypes.trim());
  });
});
