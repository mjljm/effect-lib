export const iterate = <Z>(
	initial: Z,
	options: {
		readonly while: (z: Z) => boolean;
		readonly body: (z: Z) => Z;
	}
) => {
	let z = initial;
	while (options.while(z)) z = options.body(z);
	return z;
};

export function isObject(o: unknown): o is object {
	return typeof o === 'object';
}
