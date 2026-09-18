/** Recursively freeze an object and all nested objects. */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === 'object' && !Object.isFrozen(child)) deepFreeze(child);
    }
  }
  return value as Readonly<T>;
}
