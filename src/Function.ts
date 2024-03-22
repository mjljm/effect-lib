import { Function, Option, Predicate, flow } from 'effect';

//const moduleTag = '@mjljm/effect-lib/Function/';

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the while condition (while condition is executed at start of loop). The final state is returned. Exists in predicate and refinement version.
 */
/*export const whileDoRecursive: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Refinement<A, B>;
			readonly step: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Predicate<A>;
			readonly step: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly predicate: Predicate.Predicate<A>;
		readonly step: (a: A) => A;
	}
): A =>
	options.predicate(initial) ? whileDoRecursive(options.step(initial), options) : initial;*/

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the predicate (the predicate is executed at start of loop). The final state is returned. Exists in predicate and refinement version. DO NOT USE
 */
/*export const whileDo: {
	<A, B extends A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Refinement<A, B>;
			readonly step: (b: B) => A;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly predicate: Predicate.Predicate<A>;
			readonly step: (a: A) => A;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly predicate: Predicate.Predicate<A>;
		readonly step: (a: A) => A;
	}
): A => {
	let loop = initial;
	while (options.predicate(loop)) loop = options.step(loop);
	return loop;
};*/

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version.
 */
/*export const whileDoAccumRecursive: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly predicate: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): Array<A> =>
	Array.from(
		whileDoAccumRecursiveInternal(initial, options.predicate, options.step, options.body)
	);

const whileDoAccumRecursiveInternal = <A, B>(
	initial: B,
	cont: Predicate.Predicate<B>,
	step: (b: B) => B,
	body: (b: B) => A
): List.List<A> =>
	cont(initial)
		? List.prepend(
			whileDoAccumRecursiveInternal(step(initial), cont, step, body),
				body(initial)
		  )
		: List.empty();*/

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version. Same as loop but coded without recursion. DO NOT USE
 */
/*export const whileDoAccum: {
	<A, B, C extends B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
			readonly step: (c: C) => B;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly predicate: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
			readonly step: (b: B) => B;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly predicate: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
		readonly step: (b: B) => B;
	}
): Array<A> => {
	let loop = initial;
	const result = MutableList.empty<A>();
	while (options.predicate(loop)) {
		MutableList.append(result, options.body(loop));
		loop = options.step(loop);
	}
	return Array.from(result);
};*/

/**
 * Function that takes an initial state and runs it through a step until the result stops meeting the predicate (the predicate is executed at start of loop). The final state is returned. Exists in predicate and refinement version. DO NOT USE
 */
/*export const doWhile: {
	<A, B extends A>(
		initial: B,
		options: {
			readonly step: (a: B) => A;
			readonly predicate: Predicate.Refinement<A, B>;
		}
	): A;
	<A>(
		initial: A,
		options: {
			readonly step: (a: A) => A;
			readonly predicate: Predicate.Predicate<A>;
		}
	): A;
} = <A>(
	initial: A,
	options: {
		readonly step: (a: A) => A;
		readonly predicate: Predicate.Predicate<A>;
	}
): A => {
	let loop = initial;
	do {
		loop = options.step(loop);
	} while (options.predicate(loop));
	return loop;
};*/

/**
 * Function that takes an initial state and, on the one hand, runs it through a body keeping each result and, on the other and, runs it through a step function until the result stops meeting the predicate. The array of all body results is returned. Exists in predicate and refinement version. DO NOT USE
 */
/*export const doWhileAccum: {
	<A, B, C extends B>(
		initial: C,
		options: {
			readonly step: (b: C) => B;
			readonly predicate: Predicate.Refinement<B, C>;
			readonly body: (c: C) => A;
		}
	): Array<A>;
	<A, B>(
		initial: B,
		options: {
			readonly step: (b: B) => B;
			readonly predicate: Predicate.Predicate<B>;
			readonly body: (b: B) => A;
		}
	): Array<A>;
} = <A, B>(
	initial: B,
	options: {
		readonly step: (b: B) => B;
		readonly predicate: Predicate.Predicate<B>;
		readonly body: (b: B) => A;
	}
): Array<A> => {
	let loop = initial;
	let cont: boolean;
	const result = MutableList.empty<A>();
	do {
		loop = options.step(loop);
		cont = options.predicate(loop);
		if (cont) MutableList.append(result, options.body(loop));
	} while (cont);
	return Array.from(result);
};*/

/**
 * Function to memoize a function that takes no argument. Useful to lazy initialize constants
 */

export const once = <A>(f: Function.LazyArg<A>): Function.LazyArg<A> => {
	let store = Option.none<A>();
	const cached: Function.LazyArg<A> = () => {
		if (Option.isNone(store)) {
			const result = f();
			store = Option.some(result);
			return result;
		} else return store.value;
	};
	return cached;
};

/**
 * Generic type guard for object with Id
 */
export const isOfId =
	<Type>(TypeId: symbol) =>
	(u: unknown): u is Type =>
		Predicate.hasProperty(u, TypeId);

/**
 * Pipable if
 */
export const iif: {
	<A, B extends A>(cond: Predicate.Refinement<A, B>, onTrue: (b: B) => A): (a: A) => A;
	<A>(cond: Predicate.Predicate<A>, onTrue: (a: A) => A): (a: A) => A;
} =
	<A>(cond: Predicate.Predicate<A>, onTrue: (a: A) => A) =>
	(a: A) =>
		cond(a) ? onTrue(a) : a;

/**
 * Pipable if else
 */
export const ifElse: {
	<A, B extends A, C>(
		cond: Predicate.Refinement<A, B>,
		options: { onTrue: (b: B) => C; onFalse: (a: A) => C }
	): (a: A) => C;
	<A, B>(cond: Predicate.Predicate<A>, options: { onTrue: (a: A) => B; onFalse: (a: A) => B }): (a: A) => B;
} =
	<A, B>(cond: Predicate.Predicate<A>, options: { onTrue: (a: A) => B; onFalse: (a: A) => B }) =>
	(a: A) =>
		cond(a) ? options.onTrue(a) : options.onFalse(a);

/**
 * Function composition in reverse order: self is executed after bc.
 */
// Flipping the Function.compose function will not work
export const preComposeWith =
	<B, C>(bc: (b: B) => C) =>
	<A>(self: (c: C) => A): ((b: B) => A) =>
		flow(bc, self);

/**
 * Type that expands a type
 */
/*export type Develop<P> = P extends TypedPath<infer X, infer Y>
	? Y extends unknown
			? X extends unknown
				? TypedPath<X, Y>
				: never
			: never
		: never*/

export * from '#src/internal/function';
