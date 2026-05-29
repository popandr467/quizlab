/**
 * Функция для перемешивания массива на месте
 * @param {Array} array
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
/**
 * Функция для кодирования URL-параметров
 * @param {string} strs - строковая часть
 * @param {...any} vals - часть, задаваемая через ${}
 * @returns {string}
 */
export function urlEncode(strs, ...vals) {
  return strs
    .map((i, n) =>
      n !== strs.length - 1 ? `${i}${encodeURIComponent(vals[n])}` : i,
    )
    .join("");
}

/**
 * Подбор окончания множественного числа
 * @param {number} n - число
 * @param {[string, string, string]} endings - 3 возможных окончания
 */
export function ending(n, endings) {
  return endings[
    ("20111222222222222222" +
      "20111222222011122222" +
      "20111222222011122222" +
      "20111222222011122222" +
      "20111222222011122222")[Math.abs(n) % 100]
  ];
}
