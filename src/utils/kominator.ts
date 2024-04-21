/**
 * Splits a string using commas.
 * @param string String to split.
 * @returns An array of strings from the separated string.
 */
export function kominator(string: string): string[] {
  return string.split(",").map(str => str.trim());
}
