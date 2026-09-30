export const state = {
  progress: 0  // 0..1 normalizado
};

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const progress = () => clamp(state.progress, 0, 1);