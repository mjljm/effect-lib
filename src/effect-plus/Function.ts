import { Predicate } from 'effect';
export const iterate: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly while: Predicate.Refinement<A, B>;
			readonly body: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly while: Predicate.Predicate<A>;
			readonly body: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly while: Predicate.Predicate<A>;
		readonly body: (a: A) => A;
	}
) => {
	let a = initial;
	while (options.while(a)) a = options.body(a);
	return a;
};
