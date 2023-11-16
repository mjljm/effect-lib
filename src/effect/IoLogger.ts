import * as ANSI from '@mjljm/js-lib/ansi';
import { Console, Effect, Logger } from 'effect';
export class MessageWithObject {
	constructor(
		public message: string,
		public object: unknown
	) {}
}

export const live = (stringify: (u: unknown) => string) =>
	Logger.replace(
		Logger.defaultLogger,
		Logger.make(({ date, message, logLevel }) => {
			try {
				const dateColor =
					logLevel._tag === 'Error' || logLevel._tag === 'Fatal'
						? ANSI.red
						: logLevel._tag === 'Warning'
						  ? ANSI.yellow
						  : ANSI.green;

				Effect.runSync(
					Console.log(
						dateColor(date.toISOString()) +
							(message instanceof MessageWithObject
								? ': ' + ANSI.gray(message.message) + '\n' + ANSI.blue(stringify(message.object))
								: typeof message === 'string'
								  ? ': ' + ANSI.gray(message)
								  : '\n' + ANSI.blue(stringify(message)))
					)
				);
			} catch (e) {
				Effect.runSync(Console.log(ANSI.red(`Logging error\n${stringify(e)}`)));
			}
		})
	);
