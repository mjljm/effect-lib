import { Data } from 'effect';

/**
 * Cause.NoSuchElementException can be viewed as an empty array. Cause.TooManyElementException can be viewed as an array containing more than one value. See Either.fromArray
 *
 * @category models
 */

export class TooManyElementsException<A> extends Data.TaggedError('TooManyElementsException')<{
	readonly elements: ReadonlyArray<A>;
}> {}
