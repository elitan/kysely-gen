import type { TypeAliasNode } from '@/ast/nodes';
import type { EnumMetadata } from '@/introspect/types';
import { toPascalCase } from '@/transform/utils';

export function getEnumTypeName(enumMeta: EnumMetadata, defaultSchema = 'public'): string {
  if (enumMeta.schema === defaultSchema) {
    return toPascalCase(enumMeta.name);
  }
  return toPascalCase(enumMeta.schema) + toPascalCase(enumMeta.name);
}

export function transformEnum(enumMetadata: EnumMetadata, defaultSchema = 'public'): TypeAliasNode {
  return {
    kind: 'typeAlias',
    name: getEnumTypeName(enumMetadata, defaultSchema),
    type: {
      kind: 'union',
      types: enumMetadata.values.map((value) => ({
        kind: 'literal',
        value,
      })),
    },
    exported: true,
  };
}
