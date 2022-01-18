/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */

export function sortStrings(arr, param = 'asc') {
  let direction = param === 'desc' ? -1 : 1;
  let result = arr.slice();

  return result.sort((a, b) => direction * a.localeCompare(b, ['ru', 'en'], { caseFirst: 'upper' }));
}
