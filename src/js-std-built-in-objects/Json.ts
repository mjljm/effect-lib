import { MError } from '#mjljm/effect-lib/index';
import { Effect } from 'effect';

export const stringify = (
	value: unknown,
	replacer?: Parameters<typeof JSON.stringify>[1]
) =>
	Effect.try({
		try: () => JSON.stringify(value, replacer),
		catch: (e) =>
			new MError.FunctionPort({
				originalError: e,
				originalFunctionName: 'JSON.stringify',
				moduleName: 'json.ts',
				libraryName: 'effect-lib'
			})
	});

export const parse = (
	text: string,
	reviver?: Parameters<typeof JSON.parse>[1]
) =>
	Effect.try({
		try: () => JSON.parse(text, reviver) as unknown,
		catch: (e) =>
			new MError.FunctionPort({
				originalError: e,
				originalFunctionName: 'JSON.parse',
				moduleName: 'json.ts',
				libraryName: 'effect-lib'
			})
	});
