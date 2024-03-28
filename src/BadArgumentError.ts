import * as MEither from '#src/Either';
import * as MFunction from '#src/Function';
import * as MReadonlyArray from '#src/ReadonlyArray';
import * as MString from '#src/String';
import { Data, Either, HashMap, HashSet, Number, Option, Predicate, ReadonlyArray, pipe } from 'effect';

/**
 * @category models
 */
interface BaseType {
	// Name of the argument that had the error
	readonly id: string;
	readonly positions: ReadonlyArray<number>;
	readonly moduleTag: string;
	readonly functionName: string;
}

/**
 * Returns a string indicating where the error occured
 * @category utils
 */
const baseString = (self: BaseType): string =>
	`${self.moduleTag}${self.functionName}: argument '${self.id}'` + pipe(self.positions);

/**
 * Maps the id of this error. The mapping function receives the position as second argument
 * @category setters
 */
/*export const mapId =
	(f: (id: string, position?: number) => string) =>
	<B extends BaseType>(self: B): B => ({ ...self, id: f(self.id, self.position) });*/

/**
 * Returns a copy of this error where moduleTag and functionName have been modified
 * @category setters
 */
export const setModuleTagAndFunctionName =
	(moduleTag: string, functionName: string) =>
	<B extends BaseType>(self: B): B => ({ ...self, moduleTag, functionName });

/**
 * Returns a copy of this error where the position has been modified
 * @category setters
 */
/*export const setPosition =
	(position?: number) =>
	<B extends BaseType>(self: B): B => ({ ...self, position });*/

/**
 * OutOfRange signals an out-of-range error
 * @category models
 */
export class OutOfRange extends Data.TaggedError('BadArgumentOutOfRange')<OutOfRangeType> {
	override get message() {
		return `${baseString(this)} is out of range. Actual:${this.actual}, expected: integer between ${this.min} included and ${this.max} included.`;
	}

	/**
	 * Returns actual if actual is within range. Otherwise, returns an OutOfRange error
	 * @category utils
	 */
	static check =
		({
			min,
			max,
			id,
			positions = [],
			moduleTag,
			functionName
		}: {
			min: number;
			max: number;
			id: string;
			positions?: ReadonlyArray<number>;
			moduleTag: string;
			functionName: string;
		}) =>
		(actual: number): Either.Either<number, OutOfRange> =>
			pipe(
				actual,
				MEither.liftPredicate(
					Predicate.and(Number.greaterThanOrEqualTo(min), Number.lessThanOrEqualTo(max)),
					() => new OutOfRange({ min, max, id, positions, moduleTag, functionName, actual })
				)
			);
}

interface OutOfRangeType extends BaseType {
	// Value of the argument
	readonly actual: number;
	// Lowest value accepted (included)
	readonly min: number;
	// Highest value accepted (included)
	readonly max: number;
}

/**
 * DisallowedValue signals a value that does not belong to a predefined set of values
 * @category models
 */
export class DisallowedValue<K extends string> extends Data.TaggedError('BadArgumentDisallowedValue')<
	DisallowedValueType<K>
> {
	override get message() {
		return `${baseString(this)} has disallowed value. Actual:${this.actual}, expected: one of ${ReadonlyArray.join(this.allowedValues, ', ')}.`;
	}

	/**
	 * Returns actual if actual belongs to the allowed values. Otherwise, returns an DisallowedValue error
	 * @category utils
	 */
	static check =
		<K extends string>({
			allowedValues,
			id,
			positions = [],
			moduleTag,
			functionName
		}: {
			allowedValues: HashSet.HashSet<K>;
			id: string;
			positions?: ReadonlyArray<number>;
			moduleTag: string;
			functionName: string;
		}) =>
		(actual: K): Either.Either<K, DisallowedValue<K>> =>
			pipe(
				actual,
				MEither.liftPredicate(
					MFunction.flipDual(HashSet.has<K>)(allowedValues),
					() => new DisallowedValue({ allowedValues, id, positions, moduleTag, functionName, actual })
				)
			);

	/**
	 * Returns the value associated to actual in the provided map if actual belongs to the map. Otherwise, returns an DisallowedValue error
	 * @category utils
	 */
	static checkAndMap =
		<K extends string, V>({
			allowedValues,
			id,
			positions = [],
			moduleTag,
			functionName
		}: {
			allowedValues: HashMap.HashMap<K, V>;
			id: string;
			positions?: ReadonlyArray<number>;
			moduleTag: string;
			functionName: string;
		}) =>
		(actual: K): Either.Either<V, DisallowedValue<K>> =>
			pipe(
				allowedValues,
				HashMap.get(actual),
				Either.fromOption(
					() =>
						new DisallowedValue({
							id,
							positions,
							moduleTag,
							functionName,
							actual,
							allowedValues: HashMap.keySet(allowedValues)
						})
				)
			);
}

interface DisallowedValueType<K extends string> extends BaseType {
	// Value of the argument
	readonly actual: K;
	// Array of allowed values
	readonly allowedValues: HashSet.HashSet<K>;
}

/**
 * BadLength signals an arraylike whose lentgth is incorrect
 * @category models
 */
export class BadLength extends Data.TaggedError('BadArgumentBadLength')<BadLengthType> {
	override get message() {
		return `${baseString(this)} does not have expected size'. Actual:${this.actual}, expected: ${this.expected}.`;
	}

	/**
	 * Returns target if target.length has the expected length. Otherwise returns a BadLength error
	 * @category utils
	 */
	static check =
		<T extends ArrayLike<unknown>>({
			expected,
			id,
			positions = [],
			moduleTag,
			functionName
		}: {
			expected: number;
			id: string;
			positions?: ReadonlyArray<number>;
			moduleTag: string;
			functionName: string;
		}) =>
		(target: T): Either.Either<T, BadLength> =>
			pipe(
				target,
				MEither.liftPredicate(
					(arrayLike) => pipe(arrayLike.length, MFunction.strictEquals(expected)),
					(arrayLike) =>
						new BadLength({ expected, id, positions = [], moduleTag, functionName, actual: arrayLike.length })
				)
			);
}

interface BadLengthType extends BaseType {
	// Current length
	readonly actual: number;
	// Expected length
	readonly expected: number;
}

/**
 * TwoMany signals an argument that receives more values than it expects
 * @category models
 */
export class TooMany<T> extends Data.TaggedError('BadArgumentTooMany')<TooManyType<T>> {
	override get message() {
		return `${baseString(this)} received too many values:${pipe(this.elements, ReadonlyArray.map(String), ReadonlyArray.join(', '))}.`;
	}
}

interface TooManyType<T> extends BaseType {
	// The list of received values
	readonly elements: ReadonlyArray<T>;
}

/**
 * BadFormat signals an argument that receives a value that does not match the expected format
 * @category models
 */
export class BadFormat extends Data.TaggedError('BadArgumentBadFormat')<BadFormatType> {
	override get message() {
		return `${baseString(this)} does not match expected format. Received:${this.actual}, expected format: ${this.expected}.`;
	}

	/**
	 * Returns target if target is strictly equal to expected. Otherwise, returns a BadFormat error
	 * @category utils
	 */
	static check =
		({
			expected,
			id,
			positions = [],
			moduleTag,
			functionName
		}: {
			expected: string;
			id: string;
			positions?: ReadonlyArray<number>;
			moduleTag: string;
			functionName: string;
		}) =>
		(target: string): Either.Either<string, BadFormat> =>
			pipe(
				target,
				MEither.liftPredicate(
					MFunction.strictEquals(expected),
					(actual) =>
						new BadFormat({
							expected,
							id,
							positions,
							moduleTag,
							functionName,
							actual
						})
				)
			);

	/**
	 * Returns the part of target that matches expected. If no match is found, returns a BadFormat error
	 * @category utils
	 */
	static extractMatch =
		({
			expected,
			id,
			positions = [],
			moduleTag,
			functionName
		}: {
			expected: RegExp;
			id: string;
			positions?: ReadonlyArray<number>;
			moduleTag: string;
			functionName: string;
		}) =>
		(target: string): Either.Either<string, BadFormat> =>
			pipe(
				target,
				MString.match(expected),
				Option.map(MReadonlyArray.unsafeGet(0)),
				Either.fromOption(
					() =>
						new BadFormat({
							id,
							positions,
							moduleTag,
							functionName,
							actual: target,
							expected: `RegExp(${expected.source})`
						})
				)
			);
}

interface BadFormatType extends BaseType {
	// Data received
	readonly actual: string;
	// Expected format
	readonly expected: string;
}

/**
 * General is to be used when nothing more specific matches
 * @category models
 */

export class General extends Data.TaggedError('BadArgumentGeneral')<GeneralType> {}

interface GeneralType extends BaseType {
	readonly message: string;
}
