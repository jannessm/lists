// in polyfills.ts
window.global = window;
window.process = {
    env: { DEBUG: undefined },
    nextTick: (fn, ...args) => setTimeout(() => fn(...args)),
};