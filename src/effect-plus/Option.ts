import * as Monoid from '@effect/typeclass/Monoid';
import * as Semigroup from '@effect/typeclass/Semigroup';
import { Option } from 'effect';
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
export const getXorOptionSemigroupSameDisallowed = <A>(): Semigroup.Semigroup<Option.Option<A>> =>
	Semigroup.make((self: Option.Option<A>, that: Option.Option<A>) =>
		Option.match(self, {
			onNone: () => that,
			onSome: () => Option.match(that, { onNone: () => self, onSome: () => Option.none() })
		})
	);

/**
 * Monoid for options that returns a some only if there is one and one only some
 * in the list to concatenate
 *
 * @since 1.0.0
 */
export const getXorOptionMonoidSameDisallowed = <A>(): Monoid.Monoid<Option.Option<A>> =>
	Monoid.fromSemigroup(getXorOptionSemigroup(), Option.none());

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
export const getXorOptionSemigroupSameAllowed = <A>(): Semigroup.Semigroup<Option.Option<A>> =>
	Semigroup.make((self: Option.Option<A>, that: Option.Option<A>) =>
		Option.match(self, {
			onNone: () => that,
			onSome: (v1) =>
				Option.match(that, {
					onNone: () => self,
					onSome: (v2) => (v1 === v2 ? Option.some(v1) : Option.none())
				})
		})
	);

/**
 * Monoid for options that returns a some only if there is one and one only some
 * in the list to concatenate
 *
 * @since 1.0.0
 */
export const getXorOptionMonoidSameAllowed = <A>(): Monoid.Monoid<Option.Option<A>> =>
	Monoid.fromSemigroup(getXorOptionSemigroup(), Option.none());
