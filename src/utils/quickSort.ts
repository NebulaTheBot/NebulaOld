type Corresponding = [...any[]] | null;

function swap(
  sortItems: number[],
  corresponding: Corresponding,
  leftIndex: number,
  rightIndex: number
) {
  let temp = sortItems[leftIndex];
  sortItems[leftIndex] = sortItems[rightIndex];
  sortItems[rightIndex] = temp;

  if (!corresponding) return;
  for (let i = 0; i < corresponding.length; i++) {
    let subArray = corresponding[i];

    if (Array.isArray(subArray)) {
      let tempValue = subArray[leftIndex];
      subArray[leftIndex] = subArray[rightIndex];
      subArray[rightIndex] = tempValue;
    }
  }
}

/**
 * Sorts an array of items and returns the sorted items and corresponding items.
 * @param sortItems The items to sort.
 * @param corresponding The corresponding items to sort.
 * @param leftIndex The left index of the sortItems array.
 * @param rightIndex The right index of the sortItems array.
 * @returns The sorted items and corresponding items.
 */
export function quickSort(
  sortItems: number[],
  corresponding: Corresponding,
  leftIndex: number,
  rightIndex: number
): [number[], Corresponding] {
  let pivot = sortItems[Math.floor((rightIndex + leftIndex) / 2)];
  let leftPointer = leftIndex;
  let rightPointer = rightIndex;

  while (leftPointer <= rightPointer) {
    while (sortItems[leftPointer] < pivot) leftPointer++;
    while (sortItems[rightPointer] > pivot) rightPointer--;

    if (leftPointer <= rightPointer) {
      swap(sortItems, corresponding, leftPointer, rightPointer);
      leftPointer++;
      rightPointer--;
    }
  }

  if (sortItems.length > 1) {
    if (leftIndex < leftPointer - 1)
      quickSort(sortItems, corresponding, leftIndex, leftPointer - 1);
    if (leftPointer < rightIndex) quickSort(sortItems, corresponding, leftPointer, rightIndex);
  }

  return [sortItems, corresponding];
}
