import { Either, Equal, Predicate } from 'effect';

/**
 * Lifts a value r to a right if f applied to r returns true. If it returns false, it lifts r to a left
 */
export const either_liftPredicate: {
	// Note: I intentionally avoid using the NoInfer pattern here.
	<A, A1 extends A, L>(
		refinement: Predicate.Refinement<A, A1>,
		orLeftWith: (a: A) => L
	): (a: A) => Either.Either<A1, L>;
	<A, L>(predicate: Predicate.Predicate<A>, orLeftWith: (a: A) => L): (a: A) => Either.Either<A, L>;
} =
	<A, L>(predicate: Predicate.Predicate<A>, orLeftWith: (a: A) => L) =>
	(a: A): Either.Either<A, L> =>
		predicate(a) ? Either.right(a) : Either.left(orLeftWith(a));

/**
 * Flips a dual function
 */
export const function_flipDual =
	<A, B extends ReadonlyArray<unknown>, C>(f: {
		(...b: B): (self: A) => C;
		(self: A, ...b: B): C;
	}): ((self: A) => (...b: B) => C) =>
	(self) =>
	(...b) =>
		f(...b)(self);

/**
 * strict equality comparator
 */
export const function_strictEquals =
	<A>(that: A) =>
	(self: A): boolean =>
		self === that;

/**
 * Curried equality between elements having the same type
 */
export const function_isEquivalentTo =
	<A>(that: A) =>
	(self: A): boolean =>
		Equal.equals(that, self);
