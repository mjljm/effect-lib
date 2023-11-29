import { MFunction } from '#mjljm/effect-lib/index';
import { Option, Predicate, String, pipe } from 'effect';

/**
 * Constructor that returns a Some of type Option.Some
 */
export const someAsConst = <A>(value: A): Option.Some<A> =>
	Option.some(value) as Option.Some<A>;

/**
 * Constructor that returns a None of type Option.None
 */
export const noneAsConst = <A>(): Option.None<A> =>
	Option.none() as Option.None<A>;

/**
 * Converts a string into an `Option`. Returns the string wrapped in a `Some` if the string is not empty, otherwise returns `None`.
 *
 * @category conversions
 */
export const fromString = (s: string): Option.Option<string> =>
	String.isEmpty(s) ? Option.none() : Option.some(s);

/**
 * A utility function that lifts a function that returns an unknown into a function that returns an `Option<B>`. The returned function returns none if it does not return a B. It returns a some of the result otherwise
 **/
export const liftUnknownResult =
	<B>(refinement: Predicate.Refinement<unknown, B>) =>
	<A extends ReadonlyArray<unknown>>(
		f: (...args: A) => unknown
	): ((...args: A) => Option.Option<B>) =>
	(...args) =>
		pipe(f(...args), (result) =>
			refinement(result) ? Option.some(result) : Option.none()
		);

/**
 * A utility function that lifts a function that throws exceptions and returns an unknown into a function that returns an `Option<B>`. The returned function returns none if it throws or does not return a B. It returns a some of the result otherwise
 **/
export const liftThrowableWithUnknownResult =
	<B>(refinement: Predicate.Refinement<unknown, B>) =>
	<A extends ReadonlyArray<unknown>>(
		f: (...args: A) => unknown
	): ((...args: A) => Option.Option<B>) =>
	(...args) =>
		pipe(
			Option.liftThrowable(f)(...args),
			Option.flatMap((result) =>
				refinement(result) ? Option.some(result) : Option.none()
			)
		);

/**
 * A utility function that lifts an unknown into a function that does not throw and returns an `Option<B>`. The returned function returns none if f is not a function, or if it is a function that throws or does not return a B. It returns a some of the result otherwise
 **/
export const liftUnknown =
	<B>(refinement: Predicate.Refinement<unknown, B>) =>
	(f: unknown): ((...args: ReadonlyArray<never>) => Option.Option<B>) =>
		MFunction.isFunction(f)
			? liftThrowableWithUnknownResult(refinement)(f)
			: () => Option.none();

/**
 * Semigroup for options that returns a some only if there is one and one only some
 * in the list to concatenate
 *
 * none + none = none
 * none + some(a) = some(a)
 * some(a) + none = some(a)
 * some(a) + some(b) = none
 *
 * @since 1.0.0
 */
/*export const getXorOptionSemigroupSameDisallowed = <A>(): Semigroup.Semigroup<Option.Option<A>> =>
	Semigroup.make((self: Option.Option<A>, that: Option.Option<A>) =>
		Option.match(self, {
			onNone: () => that,
			onSome: () => Option.match(that, { onNone: () => self, onSome: () => Option.none() })
		})
	);*/

/**
 * Monoid for options that returns a some only if there is one and one only some
 * in the list to concatenate
 *
 * @since 1.0.0
 */
/*export const getXorOptionMonoidSameDisallowed = <A>(): Monoid.Monoid<Option.Option<A>> =>
	Monoid.fromSemigroup(getXorOptionSemigroup(), Option.none());*/

/**
 * Semigroup for options that returns a some only if there is one and one only some
 * in the list to concatenate
 *
 * none + none = none
 * none + some(a) = some(a)
 * some(a) + none = some(a)
 * some(a) + some(a) = some(a)
 * some(a) + Some(b) = none (a not equal to b)
 *
 * @since 1.0.0
 */
/*export const getXorOptionSemigroupSameAllowed = <A>(): Semigroup.Semigroup<Option.Option<A>> =>
	Semigroup.make((self: Option.Option<A>, that: Option.Option<A>) =>
		Option.match(self, {
			onNone: () => that,
			onSome: (v1) =>
				Option.match(that, {
					onNone: () => self,
					onSome: (v2) => (v1 === v2 ? Option.some(v1) : Option.none())
				})
		})
	);*/

/**
 * Monoid for options that returns a some only if there is one and one only some
 * in the list to concatenate
 *
 * @since 1.0.0
 */
/*export const getXorOptionMonoidSameAllowed = <A>(): Monoid.Monoid<Option.Option<A>> =>
	Monoid.fromSemigroup(getXorOptionSemigroup(), Option.none());*/
