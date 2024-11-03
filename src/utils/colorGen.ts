/**
 * Randomises a color and outputs HEX.
 * @param hue Color to randomise.
 * @returns Color in HEX.
 */

export function genColor(hue: number) {
  const h = hue + 15 * Math.random();
  let s = 100;
  let l = 50 + 25 * Math.random();

  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color);
  };

  return f(0) * 65536 + f(8) * 256 + f(4);
}

/**
 * Takes RGB and outputs HEX.
 * @param r Red.
 * @param g Green.
 * @param b Blue.
 * @returns Color in HEX.
 */

export function genRGBColor(r: any, g: any, b: any) {
  r = r.toString(16);
  g = g.toString(16);
  b = b.toString(16);

  if (r.length == 1) r = `0${r}`;
  if (g.length == 1) g = `0${g}`;
  if (b.length == 1) b = `0${b}`;

  return `#${r}${g}${b}`;
}
