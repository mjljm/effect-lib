import { Equal, Equivalence, Hash } from 'effect';

/**
 * Used to encapsulate a value whose equal property we want to change. TO BE USED ONLY WITH MAPS BECAUSE OF TYPE ASSERTION IN EQUAL FUNCTION
 */
export class EqValue<in out A> implements Equal.Equal {
	constructor(
		public readonly value: A,
		public readonly Eq?: Equivalence.Equivalence<A> | undefined
	) {}
	[Equal.symbol] = (that: Equal.Equal): boolean =>
		that instanceof EqValue
			? this.Eq
				? this.Eq(this.value, that.value as A)
				: Equal.equals(this.value, that.value)
			: false;
	[Hash.symbol] = (): number => Hash.hash(this.value);
}
