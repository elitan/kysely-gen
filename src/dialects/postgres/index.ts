import { PostgresDialect as KyselyPostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Kysely, Dialect as KyselyDialect } from 'kysely';
import type { Dialect, IntrospectOptions, MapTypeOptions } from '@/dialects/types';
import type { DatabaseMetadata } from '@/introspect/types';
import type { TypeNode } from '@/ast/nodes';
import { introspectPostgres } from './introspect';
import { mapPostgresType } from './type-mapper';

export class PostgresDialect implements Dialect {
  readonly name = 'postgres' as const;

  async createKyselyDialect(connectionString: string): Promise<KyselyDialect> {
    const pool = new Pool({ connectionString });
    return new KyselyPostgresDialect({ pool });
  }

  async introspect(db: Kysely<any>, options: IntrospectOptions): Promise<DatabaseMetadata> {
    return introspectPostgres(db, options);
  }

  mapType(dataType: string, options: MapTypeOptions): TypeNode {
    return mapPostgresType(dataType, options);
  }
}
