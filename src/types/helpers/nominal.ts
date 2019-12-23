/**
 * The generic type useful for declaring a nominal type
 * https://medium.com/better-programming/nominal-typescript-eee36e9432d2
 * 
 * Usage:
 * @example
 * type A = Nominal<number, 'A'>
 * let a: A = 42; // -> fails to compile
 * let a: A = 42 as A; // -> ok
 */
export type Nominal<T, Name extends string> = T & {[Symbol.species]: Name}