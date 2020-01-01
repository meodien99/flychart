export function assert(condition: boolean, message?: string): void {
    if(!condition) {
        throw new Error(`Assert failed! ${message ? `: ${message}` : ''}`);
    }
}

/**
 * Ensures that value is defined and not null.
 * Throws if the value is undefined or null, returns the original value otherwise.
 * @returns the passed value, if it is not undefined and not null
 */
export function ensure(value: undefined | null): never;
export function ensure<T>(value: T | undefined | null): T;
export function ensure<T>(value: T | undefined | null): T {
    return ensureNotNull(ensureDefined(value));
}

export function ensureNotNull(value: unknown): never;
export function ensureNotNull<T>(value: T | null): T;
export function ensureNotNull<T>(value: T | null): T {
    if(value === null) {
        throw new Error(`Value is null`);
    }

    return value;
}

/**
  * Ensures that value is defined.
  * Throws if the value is undefined, returns the original value otherwise.
  * @returns the passed value, if it is not undefined
  */
export function ensureDefined(value: undefined): never;
export function ensureDefined<T>(value: T | undefined): T;
export function ensureDefined<T>(value: T | undefined): T {
    if (value === undefined) {
        throw new Error('Value is undefined');
    }

    return value;
}