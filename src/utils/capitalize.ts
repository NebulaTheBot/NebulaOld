/**
 * Outputs the string with the first letter capitalized.
 * @param string String, the first letter of which should be capitalized.
 */

export function capitalize(string: string) {
  if (!string) return;
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}
