const ENUM_REGEX = /^enum\((.+)\)$/i;
const SET_REGEX = /^set\((.+)\)$/i;

export function parseEnumValues(columnType: string): string[] | null {
  const match = columnType.match(ENUM_REGEX);
  if (!match) return null;

  return parseValues(match[1]);
}

export function parseSetValues(columnType: string): string[] | null {
  const match = columnType.match(SET_REGEX);
  if (!match) return null;

  return parseValues(match[1]);
}

function parseValues(valuesStr: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;

  while (i < valuesStr.length) {
    const char = valuesStr[i];

    if (char === "'" && !inQuote) {
      inQuote = true;
      i++;
      continue;
    }

    if (char === "'" && inQuote) {
      if (valuesStr[i + 1] === "'") {
        current += "'";
        i += 2;
        continue;
      }
      values.push(current);
      current = '';
      inQuote = false;
      i++;
      continue;
    }

    if (inQuote) {
      current += char;
    }

    i++;
  }

  return values;
}

export function isEnumType(columnType: string): boolean {
  return ENUM_REGEX.test(columnType);
}

export function isSetType(columnType: string): boolean {
  return SET_REGEX.test(columnType);
}
