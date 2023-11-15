import * as PrettyPrint from '@mjljm/effect-pretty-print/index';

import {
	blueString,
	grayString,
	greenString,
	redString,
	yellowString
} from '@mjljm/js-lib/Strings';
import { Console, Effect, Logger } from 'effect';
export class MessageWithObject {
	constructor(
		public message: string,
		public object: unknown
	) {}
}

const _ = PrettyPrint._;

const prettyPrintOptions: PrettyPrint.Options = {
	stringOrSymbolProperties: 'both',
	enumerableOrNonEnumarableProperties: 'both',
	showInherited: true,
	initialTab: _('  '),
	noLineBreakIfShorterThan: 40
};

export const live = Logger.replace(
	Logger.defaultLogger,
	Logger.make(({ date, message, logLevel }) => {
		try {
			const dateColor =
				logLevel._tag === 'Error' || logLevel._tag === 'Fatal'
					? redString
					: logLevel._tag === 'Warning'
					  ? yellowString
					  : greenString;

			Effect.runSync(
				Console.log(
					dateColor(date.toISOString()) +
						(message instanceof MessageWithObject
							? ': ' +
							  grayString(message.message) +
							  '\n' +
							  blueString(PrettyPrint.stringify(message.object, prettyPrintOptions).value)
							: typeof message === 'string'
							  ? ': ' + grayString(message)
							  : '\n' + blueString(PrettyPrint.stringify(message, prettyPrintOptions).value))
				)
			);
		} catch (e) {
			Effect.runSync(
				Console.log(
					redString(`Logging error\n${PrettyPrint.stringify(e, prettyPrintOptions).value}`)
				)
			);
		}
	})
);
