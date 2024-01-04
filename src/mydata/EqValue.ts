import { Equal, Equivalence, Hash } from 'effect';

const moduleTag = '@mjljm/effect-lib/mydata/EqValue/';

const TypeId: unique symbol = Symbol.for(moduleTag + 'TypeId');
type TypeId = typeof TypeId;

/**
 * MODEL
 * Container used to overload the equal property of an object. TO BE USED ONLY WITH COLLECTIONS BECAUSE AN EQUIVALENCE COMPARES ONLY ELEMENTS OF SAME TYPE
 */
export interface Type<in out A> extends Equal.Equal {
	readonly [TypeId]: TypeId;
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

export const make = <A>({
	Eq,
	value
}: Readonly<Omit<Type<A>, TypeId | typeof Equal.symbol | typeof Hash.symbol>>): Type<A> =>
	Object.create(prototype, {
		[TypeId]: { value: TypeId },
		value: { value },
		Eq: { value: Eq }
	}) as Type<A>;
