import { Equal, Equivalence, Hash } from 'effect';

const moduleTag = '@mjljm/effect-lib/mydata/EqValue/';

/**
 * MODEL
 * Container used to overload the equal property of an object. TO BE USED ONLY WITH COLLECTIONS BECAUSE AN EQUIVALENCE COMPARES ONLY ELEMENTS OF SAME TYPE
 */
export interface Type<in out A> extends Equal.Equal {
	readonly value: A;
	readonly Eq?: Equivalence.Equivalence<A> | undefined;
}

/**
 * Type guard
 */
//const isEqValue = (u: unknown): u is EqValue<unknown> => Predicate.hasProperty(u, TypeId);

/**
 * Constructors
 */

const prototype = {
	[Equal.symbol](this: Type<unknown>, that: Equal.Equal): boolean {
		return this.Eq
			? this.Eq(this.value, (that as Type<unknown>).value)
			: Equal.equals(this.value, (that as Type<unknown>).value);
	},
	[Hash.symbol](this: Type<unknown>): number {
		return Hash.hash(this.value);
	}
};

export const make = <A>(params: Readonly<Omit<Type<A>, symbol>>): Readonly<Type<A>> =>
	Object.assign(Object.create(prototype), params) as Type<A>;
