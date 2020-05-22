export function isFunction(func) {
  return typeof func === 'function';
}

export const inBrowser = typeof window !== 'undefined' && Object.prototype.toString.call(window) !== '[object Object]';
