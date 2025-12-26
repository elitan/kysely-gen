import { describe, test } from 'bun:test';
import { Kysely, PostgresDialect, type Insertable } from 'kysely';
import { Pool } from 'pg';
import type { DB, User, StatusEnum } from '../fixtures/generated-types';

const TEST_DATABASE_URL = 'postgres://test_user:test_password@localhost:5433/test_db';

describe('E2E: Type errors caught at compile time', () => {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: TEST_DATABASE_URL }),
    }),
  });

  test('invalid table name rejected', () => {
    // @ts-expect-error - 'nonexistent' is not a valid table
    db.selectFrom('nonexistent');
  });

  test('invalid column name rejected', () => {
    db.selectFrom('users')
      // @ts-expect-error - 'nonexistent_column' does not exist on users
      .select('nonexistent_column');
  });

  test('wrong type for boolean column rejected', () => {
    const badInsert: Insertable<User> = {
      email: 'test@example.com',
      username: 'test',
      // @ts-expect-error - is_active should be boolean, not string
      is_active: 'yes',
    };
    void badInsert;
  });

  test('wrong type for string column rejected', () => {
    const badInsert: Insertable<User> = {
      // @ts-expect-error - email should be string, not number
      email: 123,
      username: 'test',
    };
    void badInsert;
  });

  test('missing required field rejected', () => {
    // @ts-expect-error - email is required
    const badInsert: Insertable<User> = {
      username: 'test',
    };
    void badInsert;
  });

  test('wrong enum value rejected', () => {
    // @ts-expect-error - 'invalid_status' is not in StatusEnum
    const status: StatusEnum = 'invalid_status';
    void status;
  });

  test('wrong array element type rejected', () => {
    const badInsert: Insertable<User> = {
      email: 'test@example.com',
      username: 'test',
      // @ts-expect-error - scores should be number[], not string[]
      scores: ['a', 'b', 'c'],
    };
    void badInsert;
  });

  test('wrong join column rejected', () => {
    db.selectFrom('users')
      // @ts-expect-error - 'posts.nonexistent' is not a valid column
      .innerJoin('posts', 'posts.nonexistent', 'users.id');
  });

  test('Generated column cannot be required in insert', () => {
    const validInsert: Insertable<User> = {
      email: 'test@example.com',
      username: 'test',
      id: 1, // id is Generated<number>, so this is optional - no error
    };
    void validInsert;
  });
});
