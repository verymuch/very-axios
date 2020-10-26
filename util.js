export function isFunction(func) {
  return typeof func === 'function';
}
// TODO:临时去除window
// export const inBrowser = typeof window !== 'undefined' && Object.prototype.toString.call(window) !== '[object Object]';
