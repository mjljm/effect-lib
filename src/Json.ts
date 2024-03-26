import * as MFunctionPortError from '#src/FunctionPortError';
import { Effect } from 'effect';

/**
 * Replacer function to make Json stringify support bigints
 */
export const bigintReplacer =
	(bigIntMark = 'n') =>
	(_: string, value: unknown) =>
		typeof value === 'bigint' ? value.toString() + bigIntMark : value;

/**
 * Port of Json stringify
 */
export const stringify = (value: unknown, replacer?: Parameters<typeof JSON.stringify>[1]) =>
	Effect.try({
		try: () => JSON.stringify(value, replacer),
		catch: (e) =>
			new MFunctionPortError.Type({
				originalError: e,
				originalFunctionName: 'JSON.stringify',
				moduleName: 'json.ts',
				libraryName: 'effect-lib'
			})
	});

/**
 * Reviver function to make Json parse support bigints
 */
export const bigintReviver =
	(bigIntMark = 'n') =>
	(_: string, value: unknown) => {
		if (typeof value === 'string' && new RegExp(`^\\d+${bigIntMark}$`).test(value)) {
			return BigInt(value.substring(0, value.length - bigIntMark.length));
		}
		return value;
	};

/**
 * Port of Json parse
 */
export const parse = (text: string, reviver?: Parameters<typeof JSON.parse>[1]) =>
	Effect.try({
		try: () => JSON.parse(text, reviver) as unknown,
		catch: (e) =>
			new MFunctionPortError.Type({
				originalError: e,
				originalFunctionName: 'JSON.parse',
				moduleName: 'json.ts',
				libraryName: 'effect-lib'
			})
	});
