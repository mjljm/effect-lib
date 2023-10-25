import { FunctionPortError } from '@mjljm/effect-lib/errors';

import { Effect } from 'effect';

export const stringify = (value: unknown, replacer?: Parameters<typeof JSON.stringify>[1]) =>
	Effect.try({
		try: () => JSON.stringify(value, replacer),
		catch: (e) =>
			new FunctionPortError({
				originalError: e,
				originalFunctionName: 'JSON.stringify',
				moduleName: 'json.ts',
				libraryName: 'effect-lib'
			})
	});

export const parse = (text: string, reviver?: Parameters<typeof JSON.parse>[1]) =>
	Effect.try({
		try: () => JSON.parse(text, reviver) as unknown,
		catch: (e) =>
			new FunctionPortError({
				originalError: e,
				originalFunctionName: 'JSON.parse',
				moduleName: 'json.ts',
				libraryName: 'effect-lib'
			})
	});
