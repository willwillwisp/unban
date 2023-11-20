/**
 * The `groupBy` function takes an array and a key function, and returns an object where the keys are
 * the result of applying the key function to each item in the array, and the values are arrays of
 * items that have the same key.
 * @param {T[]} arr - The `arr` parameter is an array of elements of type `T`.
 * @param key - The `key` parameter is a function that takes an item from the `arr` array and returns a
 * key value. This key value is used to group the items in the array.
 */
export const groupBy = <T, K extends keyof never>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      (groups[key(item)] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
