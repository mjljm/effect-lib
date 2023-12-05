import { MFiberId, MFunction } from '#mjljm/effect-lib/index';
import { ANSI } from '@mjljm/js-lib';
import { Equal, Logger, Option, identity, pipe } from 'effect';

const TypeId: unique symbol = Symbol.for(
	'@mjljm/effect-lib/effect/IoLogger.ts'
);
type TypeId = typeof TypeId;

interface Message {
	readonly [TypeId]: TypeId;
	readonly message: string;
	readonly showDate: boolean;
	readonly skipMessageFormatting: boolean;
	readonly object: Option.Option<unknown>;
	readonly skipLineBefore: boolean;
	readonly skipLineAfter: boolean;
	readonly messageKey: Option.Option<string>;
}
const Message = MFunction.makeReadonly<Message>;
const isMessage = (u: unknown): u is Message =>
	MFunction.isRecord(u) && u[TypeId] === TypeId;
export const $ = (title: string): Message =>
	Message({
		message: ANSI.yellow(title),
		showDate: true,
		skipMessageFormatting: true,
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false,
		messageKey: Option.none(),
		[TypeId]: TypeId
	});
export const _ = (text: string): Message =>
	Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.none(),
		[TypeId]: TypeId
	});
export const _eol = (text: string): Message =>
	Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: true,
		messageKey: Option.none(),
		[TypeId]: TypeId
	});
export const eol_ = (text: string): Message =>
	Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false,
		messageKey: Option.none(),
		[TypeId]: TypeId
	});
export const messageWithObject = (text: string, object: unknown): Message =>
	Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.some(object),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.none(),
		[TypeId]: TypeId
	});
export const messageWithKey = (text: string, key: string): Message =>
	Message({
		message: text,
		showDate: false,
		skipMessageFormatting: false,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.some(key),
		[TypeId]: TypeId
	});
export const skipLine = (): Message =>
	Message({
		message: '',
		showDate: false,
		skipMessageFormatting: true,
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false,
		messageKey: Option.none(),
		[TypeId]: TypeId
	});

let previousKey = Option.none<string>();

export const live = (stringify: (u: unknown) => string) =>
	pipe(new Date().getTime(), (startTime) =>
		Logger.replace(
			Logger.defaultLogger,
			Logger.make(({ date, fiberId, logLevel, message }) => {
				try {
					const isObjectMessage = isMessage(message);
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
