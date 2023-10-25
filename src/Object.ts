import { iterate } from '@mjljm/effect-lib/effect-plus/Function';
import { Option, ReadonlyArray, pipe } from 'effect';

//eslint-disable-next-line @typescript-eslint/ban-types
type primitiveTypes = string | number | bigint | boolean | symbol | undefined | Function;
type allTypes = primitiveTypes | { [key: string | symbol]: allTypes } | Array<allTypes>;

interface PrettyPrintOptions {
	fractionDigits: number;
	tab: string;
	linebreak: string;
	showNonEnumerableProperties: boolean;
	showSymbolProperties: boolean;
	showFunctions: boolean;
	showInherited: boolean;
}

const primitiveToString = (u: primitiveTypes, fractionDigits = 2) => {
	switch (typeof u) {
		case 'string':
			return u;
		case 'boolean':
		case 'bigint':
		case 'symbol':
			return u.toString();
		case 'function':
			return 'Function()';
		case 'number':
			return u.toFixed(fractionDigits);
		case 'undefined':
			return 'undefined';
		default:
			u satisfies never;
			return '';
	}
};

const openObject = (u: { [key: string | symbol]: allTypes }, options: PrettyPrintOptions) =>
	pipe(
		u,
		Reflect.ownKeys,
		ReadonlyArray.map((key) => ({
			key,
			keyType: typeof key,
			descriptor: Reflect.getOwnPropertyDescriptor(u, key) as TypedPropertyDescriptor<allTypes>
		})),
		ReadonlyArray.filterMap((keyDetails) =>
			(keyDetails.descriptor.enumerable || options.showNonEnumerableProperties) &&
			(keyDetails.keyType === 'string' || options.showSymbolProperties) &&
			((keyDetails.keyType !== 'function' &&
				keyDetails.descriptor.get === undefined &&
				keyDetails.descriptor.set === undefined) ||
				options.showFunctions)
				? Option.some([keyDetails.key, ':', u[keyDetails.key]])
				: Option.none()
		),
		ReadonlyArray.intersperse(',')
	);

/**
 * Pretty print an abject. Uses \n as newline character
 *
 * @param u The object to print
 *
 */
export const objectToString = (
	u: allTypes,
	options: PrettyPrintOptions = {
		fractionDigits: 2,
		tab: '\t',
		linebreak: '\n',
		showNonEnumerableProperties: false,
		showSymbolProperties: false,
		showFunctions: false,
		showInherited: true
	}
) =>
	pipe(
		iterate(
			{ arr: ReadonlyArray.of(u), tab: options.tab },
			{
				while: (sCurrent) =>
					sCurrent.arr.length > 1 && typeof ReadonlyArray.headNonEmpty(sCurrent.arr) !== 'string',
				body: (sIn) =>
					pipe(
						sIn.arr,
						ReadonlyArray.reduce(ReadonlyArray.empty<allTypes>(), (acc, u) =>
							typeof u === 'object'
								? Array.isArray(u)
									? pipe(
											acc,
											ReadonlyArray.append(`[${options.linebreak}`),
											ReadonlyArray.appendAll(ReadonlyArray.intersperse(u, ',')),
											ReadonlyArray.append(`${options.linebreak}]`)
									  )
									: pipe(
											acc,
											ReadonlyArray.append(`{${options.linebreak}`),
											ReadonlyArray.appendAll(openObject(u, options)),
											ReadonlyArray.append(`${options.linebreak}}`)
									  )
								: ReadonlyArray.append(acc, primitiveToString(u, options.fractionDigits))
						),
						(arr) => ({
							arr: arr as ReadonlyArray.NonEmptyArray<allTypes>,
							tab: sIn.tab + options.tab
						})
					)
			}
		),
		(z) => z
	);
