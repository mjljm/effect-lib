import {
	blueString,
	grayString,
	greenString,
	objectToString,
	redString,
	tabify,
	yellowString
} from '@mjljm/js-lib/Strings';
import { Console, Effect, Logger } from 'effect';

export class LoggerError {
	constructor(
		public message: string,
		public object: unknown
	) {}
}

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
						(message instanceof LoggerError
							? ': ' +
							  grayString(message.message) +
							  '\n' +
							  blueString(tabify(objectToString(message.object)))
							: typeof message === 'string'
							? ': ' + grayString(message)
							: '\n' + blueString(tabify(objectToString(message))))
				)
			);
		} catch (e) {
			Effect.runSync(Console.log(redString(`Logging error\n${tabify(objectToString(e))}`)));
		}
	})
);
