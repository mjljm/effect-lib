/**
 * Constructor
 */

export const unsafeIntFromString = (s: string): number => parseInt(s);

/**
 * Constructor
 */

export const unsafeFromString = (s: string): number => +s;

/**
 * Modulo - Use only with integers - Divisor must be positive. This implementation is slightly faster than ((self % divisor) + divisor) % divisor
 */

export const intModulo =
	(divisor: number) =>
	(self: number): number =>
		self >= 0 ? self % divisor : (self % divisor) + divisor;
