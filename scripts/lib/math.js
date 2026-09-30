export const rand     = (min, max) => min + Math.random() * (max - min);
export const coin     = (p = 0.5) => Math.random() < p;
export const pickSide = () => (coin() ? 'left' : 'right');
export const skew     = (power) => Math.pow(Math.random(), power);

export function cubicBezier(t, p1x, p1y, p2x, p2y) {
  const bez = (a, b, u) =>
    3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3;

  let lo = 0;
  let hi = 1;
  let mid = 0.5;

  for (let i = 0; i < 20; i++) {
    mid = (lo + hi) / 2;
    if (bez(p1x, p2x, mid) < t) lo = mid;
    else hi = mid;
  }
  return bez(p1y, p2y, mid);
}