export function normalizeOperatorActive(value: string | boolean | undefined) {
  if (value === true || value === String(true)) {
    return true;
  }
  if (value === false || value === String(false)) {
    return false;
  }
  return undefined;
}
