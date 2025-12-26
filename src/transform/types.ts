import type { ProgramNode } from '@/ast/nodes';

export type TransformOptions = {
  camelCase?: boolean;
  includePattern?: string[];
  excludePattern?: string[];
};

export type TransformWarning = {
  type: 'unknown_type';
  pgType: string;
};

export type TransformResult = {
  program: ProgramNode;
  warnings: TransformWarning[];
};
