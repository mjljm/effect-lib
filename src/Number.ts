/**
 * Constructor
 */

import { JsPatches } from '@mjljm/js-lib';

export const unsafeIntFromString = (s: string): number => parseInt(s);

/**
 * Constructor
 */

export const unsafeFromString = (s: string): number => +s;

/**
 * Modulo - Use only with integers - Divisor must be positive. This implementation is slightly faster than ((self % divisor) + divisor) % divisor
 */

export const intModulo = JsPatches.intModulo;

/**
 * strict equality comparator
 */
export const equals =
	(that: number) =>
	(self: number): boolean =>
		self === that;
