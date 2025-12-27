import { MysqlDialect as KyselyMysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import type { Kysely, Dialect as KyselyDialect } from 'kysely';
import type { Dialect, IntrospectOptions, MapTypeOptions } from '@/dialects/types';
import type { DatabaseMetadata } from '@/introspect/types';
import type { TypeNode } from '@/ast/nodes';
import { introspectMysql } from './introspect';
import { mapMysqlType } from './type-mapper';

export class MysqlDialect implements Dialect {
  readonly name = 'mysql' as const;

  async createKyselyDialect(connectionString: string): Promise<KyselyDialect> {
    const pool = createPool(connectionString);
    return new KyselyMysqlDialect({ pool });
  }

  async introspect(db: Kysely<any>, options: IntrospectOptions): Promise<DatabaseMetadata> {
    return introspectMysql(db, options);
  }

  mapType(dataType: string, options: MapTypeOptions): TypeNode {
    return mapMysqlType(dataType, options);
  }
}
