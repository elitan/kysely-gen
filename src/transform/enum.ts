import type { TypeAliasNode } from '@/ast/nodes';
import type { EnumMetadata } from '@/introspect/types';
import { toPascalCase } from '@/transform/utils';

function getEnumKey(enumMeta: EnumMetadata): string {
  return `${enumMeta.schema}.${enumMeta.name}`;
}

function getBaseName(enumMeta: EnumMetadata, defaultSchema = 'public'): string {
  if (enumMeta.schema === defaultSchema) {
    return toPascalCase(enumMeta.name);
  }
  return toPascalCase(enumMeta.schema) + toPascalCase(enumMeta.name);
}

function getFullName(enumMeta: EnumMetadata): string {
  return toPascalCase(enumMeta.schema) + toPascalCase(enumMeta.name);
}

export class EnumNameResolver {
  private nameMap: Map<string, string>;

  constructor(enums: EnumMetadata[], defaultSchema = 'public') {
    this.nameMap = new Map();

    const baseNames = new Map<string, EnumMetadata[]>();
    for (const enumMeta of enums) {
      const baseName = getBaseName(enumMeta, defaultSchema);
      const existing = baseNames.get(baseName) ?? [];
      existing.push(enumMeta);
      baseNames.set(baseName, existing);
    }

    for (const [, enumsWithSameName] of baseNames) {
      if (enumsWithSameName.length === 1) {
        const enumMeta = enumsWithSameName[0];
        this.nameMap.set(getEnumKey(enumMeta), getBaseName(enumMeta, defaultSchema));
      } else {
        for (const enumMeta of enumsWithSameName) {
          this.nameMap.set(getEnumKey(enumMeta), getFullName(enumMeta));
        }
      }
    }
  }

  getName(enumMeta: EnumMetadata): string {
    return this.nameMap.get(getEnumKey(enumMeta))!;
  }
}

export function getEnumTypeName(enumMeta: EnumMetadata, defaultSchema = 'public'): string {
  return getBaseName(enumMeta, defaultSchema);
}

export function transformEnum(enumMetadata: EnumMetadata, resolver?: EnumNameResolver): TypeAliasNode {
  const name = resolver ? resolver.getName(enumMetadata) : getEnumTypeName(enumMetadata);
  return {
    kind: 'typeAlias',
    name,
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
