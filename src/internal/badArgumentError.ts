import * as common from '#src/internal/common';
import { Data, Either, HashMap, HashSet, Number, Predicate, ReadonlyArray, pipe } from 'effect';

interface BaseType {
	// Name of the argument that had the error
	readonly id: string;
	readonly position?: number;
	readonly moduleTag: string;
	readonly functionName: string;
}

const argumentString = (self: BaseType): string =>
	`${self.moduleTag}${self.functionName}: argument '${self.id}'` +
	(self.position === undefined ? '' : ` at position ${self.position}`);

export const mapId =
	(f: (id: string) => string) =>
	<B extends BaseType>(self: B): B => ({ ...self, id: f(self.id) });
/**
 * OutOfRange signals an out-of-range error
 */

export interface OutOfRangeType extends BaseType {
	// Value of the argument
	readonly actual: number;
	// Lowest value accepted (included)
	readonly min: number;
	// Highest value accepted (included)
	readonly max: number;
}

export class OutOfRange extends Data.TaggedError('Effect-lib_BadArgument_OutOfRange')<OutOfRangeType> {
	override get message() {
		return `${argumentString(this)} is out of range. Actual:${this.actual}, expected: integer between ${this.min} included and ${this.max} included.`;
	}
}

export const checkRange =
	(params: { min: number; max: number; id: string; position?: number; moduleTag: string; functionName: string }) =>
	(actual: number): Either.Either<number, OutOfRange> =>
		pipe(
			actual,
			common.either_liftPredicate(
				Predicate.and(Number.greaterThanOrEqualTo(params.min), Number.lessThanOrEqualTo(params.max)),
				() => new OutOfRange({ ...params, actual })
			)
		);

export interface DisallowedValueType<K extends string> extends BaseType {
	// Value of the argument
	readonly actual: K;
	// Array of allowed values
	readonly allowedValues: HashSet.HashSet<K>;
}

export class DisallowedValue<K extends string> extends Data.TaggedError('Effect-lib_BadArgument_DisallowedValue')<
	DisallowedValueType<K>
> {
	override get message() {
		return `${argumentString(this)} has disallowed value. Actual:${this.actual}, expected: one of ${ReadonlyArray.join(this.allowedValues, ', ')}.`;
	}
}

export const checkValue =
	<K extends string>(params: {
		allowedValues: HashSet.HashSet<K>;
		id: string;
		position?: number;
		moduleTag: string;
		functionName: string;
	}) =>
	(actual: K): Either.Either<K, DisallowedValue<K>> =>
		pipe(
			actual,
			common.either_liftPredicate(
				common.function_flipDual(HashSet.has<K>)(params.allowedValues),
				() => new DisallowedValue({ ...params, actual })
			)
		);

export const checkAndMapValue =
	<K extends string, V>(params: {
		allowedValues: HashMap.HashMap<K, V>;
		id: string;
		position?: number;
		moduleTag: string;
		functionName: string;
	}) =>
	(actual: K): Either.Either<V, DisallowedValue<K>> =>
		pipe(
			params.allowedValues,
			HashMap.get(actual),
			Either.fromOption(
				() => new DisallowedValue({ ...params, actual, allowedValues: HashMap.keySet(params.allowedValues) })
			)
		);
/**
 * BadLength signals an arraylike whose lentgth is incorrect
 */
export interface BadLengthType extends BaseType {
	// Current length
	readonly actual: number;
	// Expected length
	readonly expected: number;
}

export class BadLength extends Data.TaggedError('Effect-lib_BadArgument_BadLength')<BadLengthType> {
	override get message() {
		return `${argumentString(this)} does not have expected size'. Actual:${this.actual}, expected: ${this.expected}.`;
	}
}

export const checkLength =
	<T extends ArrayLike<unknown>>(params: {
		expected: number;
		id: string;
		position?: number;
		moduleTag: string;
		functionName: string;
	}) =>
	(target: T): Either.Either<T, BadLength> =>
		pipe(
			target,
			common.either_liftPredicate(
				(arrayLike) => pipe(arrayLike.length, common.function_strictEquals(params.expected)),
				(arrayLike) => new BadLength({ ...params, actual: arrayLike.length })
			)
		);

/**
 * TwoMany signals an argument that receives more values than it expects
 */

export interface TooManyType<T> extends BaseType {
	// The latest value received
	readonly actual: T;
	// The previous value received
	readonly expected: T;
}

export class TooMany<T> extends Data.TaggedError('Effect-lib_BadArgument_TooMany')<TooManyType<T>> {
	override get message() {
		return `${argumentString(this)} received value:${String(this.actual)} that contradicts previously received value:${String(this.expected)}.`;
	}
}

/**
 * BadFormat signals an argument that receives a value that does not match the expected format
 */

export interface BadFormatType extends BaseType {
	// Data received
	readonly actual: string;
	// Expected format
	readonly expected: string;
}

export class BadFormat extends Data.TaggedError('Effect-lib_BadArgument_BadFormat')<BadFormatType> {
	override get message() {
		return `${argumentString(this)} does not match expected format. Received:${this.actual}, expected format: ${this.expected}.`;
	}
}

/**
 * General is to be used when nothing more specific matches
 */

export interface GeneralType extends BaseType {
	readonly message: string;
}

export class General extends Data.TaggedError('Effect-lib_BadArgument_General')<GeneralType> {}
