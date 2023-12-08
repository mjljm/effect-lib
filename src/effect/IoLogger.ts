import { MFiberId } from '#mjljm/effect-lib/index';
import { ANSI } from '@mjljm/js-lib';
import { Data, Equal, Logger, Option, identity, pipe } from 'effect';

//const moduleTag = '@mjljm/effect-lib/effect/IoLogger/';

class Message extends Data.Class<{
	readonly message: string;
	readonly showDate: boolean;
	readonly skipMessageFormatting: boolean;
	readonly object: Option.Option<unknown>;
	readonly skipLineBefore: boolean;
	readonly skipLineAfter: boolean;
	readonly messageKey: Option.Option<string>;
}> {}

export const $ = (title: string): Message =>
	new Message({
		message: ANSI.yellow(title),
		showDate: true,
		skipMessageFormatting: true,
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false,
		messageKey: Option.none()
	});
export const _ = (text: string): Message =>
	new Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.none()
	});
export const _eol = (text: string): Message =>
	new Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: true,
		messageKey: Option.none()
	});
export const eol_ = (text: string): Message =>
	new Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false,
		messageKey: Option.none()
	});
export const messageWithObject = (text: string, object: unknown): Message =>
	new Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.some(object),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.none()
	});
export const messageWithKey = (text: string, key: string): Message =>
	new Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.some(key)
	});
export const skipLine = (): Message =>
	new Message({
		message: '',
		showDate: false,
		skipMessageFormatting: true,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.none()
	});

let previousKey = Option.none<string>();

export const live = (stringify: (u: unknown) => string) =>
	pipe(new Date().getTime(), (startTime) =>
		Logger.replace(
			Logger.defaultLogger,
			Logger.make(({ date, fiberId, logLevel, message }) => {
				try {
					const isObjectMessage = message instanceof Message;
					const currentKey = isObjectMessage
						? message.messageKey
						: Option.none<string>();
					const skipMessage =
						Option.isSome(currentKey) && Equal.equals(currentKey, previousKey);
					previousKey = skipMessage ? Option.none() : currentKey;

					if (!skipMessage)
						console.log(
							(isObjectMessage && message.skipLineBefore ? '\n' : '') +
								(isObjectMessage && !message.showDate
									? ''
									: (logLevel._tag === 'Error' || logLevel._tag === 'Fatal'
											? ANSI.red
											: logLevel._tag === 'Warning'
											  ? ANSI.yellow
											  : ANSI.green)(
											MFiberId.toJson(fiberId) +
												` ${date.getTime() - startTime}ms `
									  )) +
								(isObjectMessage
									? (message.message === ''
											? '' // Don't show fiberId when skipping line
											: (message.skipMessageFormatting ? identity : ANSI.gray)(
													message.message +
														(!message.showDate
															? '(' + MFiberId.toJson(fiberId) + ')'
															: '')
											  )) +
									  Option.match(message.object, {
											onNone: () => '',
											onSome: (u) => '\n' + ANSI.blue(stringify(u))
									  }) +
									  (message.skipLineAfter ? '\n' : '')
									: typeof message === 'string'
									  ? ': ' + ANSI.gray(message)
									  : '\n' + ANSI.blue(stringify(message)))
						);
				} catch (e) {
					console.log(ANSI.red(`Logging error\n${stringify(e)}`));
				}
			})
		)
	);
