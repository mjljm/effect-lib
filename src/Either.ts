import * as MCause from '#src/Cause';
import * as MTuple from '#src/Tuple';
import { Cause, Either, Function, Number, Option, Predicate, ReadonlyArray, Tuple, flow, pipe } from 'effect';

/**
 * Lifts a value r to a right if f applied to r returns true. If it returns false, it lifts r to a left
 */
export const liftPredicate: {
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
 * Lifts a value r to a right if f applied to r returns a none. If it returns a some(c), it lifts r to a left that is calculated from itself and c
 */
// Note: I intentionally avoid using the NoInfer pattern here.
export const liftOptionalPredicate =
	<R, L, C>(f: (r: R) => Option.Option<C>, orLeftWith: (right: R, calculation: C) => L) =>
	(r: R): Either.Either<R, L> =>
		pipe(
			r,
			f,
			Option.map((c) => orLeftWith(r, c)),
			Either.fromOption(() => r),
			Either.flip
		);

/**
 * Returns left(`NoSuchElementException`) if as contains no element, left(`TooManyElementsException`) if as contains more than one element, otherwise returns a right of the only element in as.
 */
export const fromArray: <A>(
	as: ReadonlyArray<A>
) => Either.Either<A, MCause.TooManyElementsException<A> | Cause.NoSuchElementException> = flow(
	liftPredicate(
		flow(ReadonlyArray.length, Number.lessThanOrEqualTo(1)),
		(elements) => new MCause.TooManyElementsException({ elements })
	),
	Either.flatMap(
		flow(
			ReadonlyArray.get(0),
			Either.fromOption(() => new Cause.NoSuchElementException())
		)
	)
);

/**
 * Returns left(`NoSuchElementException`) if as contains no element, left(`TooManyElementsException`) if as contains more than one distinct element, otherwise returns a right of the only distinct element in as.
 */
export const fromUniqueArray: <A>(
	as: ReadonlyArray<A>
) => Either.Either<A, MCause.TooManyElementsException<A> | Cause.NoSuchElementException> = flow(
	ReadonlyArray.dedupe,
	fromArray
);

/**
 * Same as Effect.optionFromOptional
 */
export const optionFromOptional = <A, E>(
	self: Either.Either<A, E>
): Either.Either<Option.Option<A>, Exclude<E, Cause.NoSuchElementException>> =>
	pipe(
		self,
		Either.map(Option.some),
		Either.orElse((e) =>
			e instanceof Cause.NoSuchElementException
				? Either.right(Option.none<A>())
				: Either.left(e as Exclude<E, Cause.NoSuchElementException>)
		)
	);

/**
 * Flattens two eithers into a single one
 */
export const flatten: <R, L1, L2>(self: Either.Either<Either.Either<R, L1>, L2>) => Either.Either<R, L1 | L2> =
	Either.flatMap(Function.identity);

/**
 * Same as Either.filterOrLeft but we pass the details of the filtering calculation to the orLeftWithFunction. If the filtering function returns a none, the either is validated. If it returns a some(c), the either is not validated and c is passed to the orLeftWith function
 */
export const filterOptionalPredicate =
	<R, L2, C>(f: (r: NoInfer<R>) => Option.Option<C>, orLeftWith: (right: NoInfer<R>, calculation: C) => L2) =>
	<L>(self: Either.Either<R, L>): Either.Either<R, L2 | L> =>
		Either.flatMap(self, liftOptionalPredicate(f, orLeftWith));

/**
 * gets the value of the Either when it can never be a left
 */
export const getRightWhenNoLeft = <A>(self: Either.Either<A, never>): A => (self as Either.Right<never, A>).right;

/**
 * Transforms an either of a tuple into a tuple of either's. Useful for instance for error management in reduce or mapAccum
 */
export const traverseTuple = <A, B, L>(
	self: Either.Either<[A, B], L>
): [Either.Either<A, L>, Either.Either<B, L>] =>
	pipe(
		self,
		Either.map(Tuple.mapBoth({ onFirst: Either.right, onSecond: Either.right })),
		Either.getOrElse(MTuple.makeBothBy({ toFirst: Either.left, toSecond: Either.left }))
	);

/**
 * Recovers from the specified tagged error.
 *
 * @category error handling
 */
export const catchTag =
	<K extends E extends { _tag: string } ? E['_tag'] : never, E, E1>(k: K, f: (e: Extract<E, { _tag: K }>) => E1) =>
	<A>(self: Either.Either<A, E>): Either.Either<A, E1 | Exclude<E, { _tag: K }>> =>
		Either.mapLeft(self, (e) =>
			Predicate.isTagged(e, k) ? f(e as Extract<E, { _tag: K }>) : (e as Exclude<E, { _tag: K }>)
		);
