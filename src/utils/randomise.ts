/**
 * Randomises array values.
 * @param array Array to randomise.
 * @returns Randomised value from within the array.
 */

export function randomise(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}
