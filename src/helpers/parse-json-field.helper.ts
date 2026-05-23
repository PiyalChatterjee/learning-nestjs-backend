/**
 * Parses a JSON string field and returns the parsed object.
 * If parsing fails or the value is null/undefined, returns the original value.
 * 
 * @param jsonString - The JSON string to parse
 * @returns Parsed object or the original value if parsing fails
 */
export function parseJsonField(jsonString: string | null | undefined): any {
  if (!jsonString) {
    return null;
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
}

/**
 * Parses multiple JSON fields in an object.
 * Useful for formatting entity responses with JSON fields.
 * 
 * @param obj - The object containing fields to parse
 * @param fieldNames - Array of field names to parse as JSON
 * @returns New object with parsed fields
 */
export function parseJsonFields<T extends Record<string, any>>(
  obj: T,
  fieldNames: (keyof T)[],
): T {
  const result = { ...obj };

  fieldNames.forEach((fieldName) => {
    const value = result[fieldName];
    if (value && typeof value === 'string') {
      result[fieldName] = parseJsonField(value) as T[keyof T];
    }
  });

  return result;
}
