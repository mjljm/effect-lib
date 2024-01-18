import { MFiberId, MFunction } from '#mjljm/effect-lib/index';
import { ANSI, StringUtils } from '@mjljm/js-lib';
import { Effect, Logger, Option, String, pipe } from 'effect';

const moduleTag = '@mjljm/effect-lib/effect/IoLogger/';

const MessageTypeId: unique symbol = Symbol.for(moduleTag + 'MessageTypeId');
type MessageTypeId = typeof MessageTypeId;

interface Message {
	readonly [MessageTypeId]: MessageTypeId;
	readonly message: string;
	readonly color: (m: string) => string;
	readonly showTime: boolean;
	readonly object: Option.Option<unknown>;
	readonly skipLineBefore: boolean;
	readonly skipLineAfter: boolean;
	readonly indent: number; // Number of tabs
}

const tabChar = '  ';
/**
 * Type guards
 */
const isMessage = MFunction.isOfId<Message>(MessageTypeId);

/**
 * Constructors
 */
const Message = MFunction.makeWithId<Message>(MessageTypeId);

const titleMessage = (title: string): Message =>
	Message({
		message: title,
		color: ANSI.yellow,
		showTime: true,
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false,
		indent: 0
	});
const subTitleMessage = (text: string, indent: number, skipLineBefore: boolean, skipLineAfter: boolean): Message =>
	Message({
		message: text,
		color: ANSI.gray,
		showTime: false,
		object: Option.none(),
		skipLineBefore,
		skipLineAfter,
		indent
	});

/**
 *
 * Logging functions
 */

export const infoTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logInfo(titleMessage(message));
export const infoSubTitle = (message: string, indent = 1): Effect.Effect<never, never, void> =>
	Effect.logInfo(subTitleMessage(message, indent, false, false));
export const infoEolSubTitle = (message: string, indent = 1): Effect.Effect<never, never, void> =>
	Effect.logInfo(subTitleMessage(message, indent, true, false));
export const infoSubTitleEol = (message: string, indent = 1): Effect.Effect<never, never, void> =>
	Effect.logInfo(subTitleMessage(message, indent, false, true));

export const debugTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logDebug(titleMessage(message));
export const debugSubTitle = (message: string, indent = 1): Effect.Effect<never, never, void> =>
	Effect.logDebug(subTitleMessage(message, indent, false, false));
export const debugEolSubTitle = (message: string, indent = 1): Effect.Effect<never, never, void> =>
	Effect.logDebug(subTitleMessage(message, indent, true, false));
export const debugSubTitleEol = (message: string, indent = 1): Effect.Effect<never, never, void> =>
	Effect.logDebug(subTitleMessage(message, indent, false, true));

export const live = (stringify: (u: unknown) => string, startTime: number) =>
	Logger.replace(
		Logger.defaultLogger,
		Logger.make(({ date, fiberId, logLevel, message }) => {
			const colorizeByLogLevel =
				logLevel._tag === 'Error' || logLevel._tag === 'Fatal'
					? ANSI.red
					: logLevel._tag === 'Warning'
						? ANSI.yellow
						: ANSI.green;

			try {
				const objectMessage = isMessage(message)
					? message
					: MFunction.isString(message)
						? Message({
								message,
								color: ANSI.gray,
								showTime: true,
								object: Option.none(),
								skipLineBefore: false,
								skipLineAfter: false,
								indent: 0
							})
						: Message({
								message: 'The following error value was returned',
								color: ANSI.gray,
								showTime: true,
								object: Option.some(message),
								skipLineBefore: false,
								skipLineAfter: false,
								indent: 0
							});

				const tab = pipe(tabChar, String.repeat(objectMessage.indent));
				console.log(
					(objectMessage.skipLineBefore ? '\n' : '') +
						(objectMessage.message === ''
							? ''
							: tab +
								(objectMessage.showTime ? colorizeByLogLevel(`${date.getTime() - startTime}ms `) : '') +
								objectMessage.color(objectMessage.message + ' (' + MFiberId.toJson(fiberId) + ')')) +
						Option.match(objectMessage.object, {
							onNone: () => '',
							onSome: (u) => '\n' + StringUtils.tabify(tab)(objectMessage.color(stringify(u)))
						}) +
						(objectMessage.skipLineAfter ? '\n' : '')
				);
			} catch (e) {
				console.log(ANSI.red(`Logging error\n${stringify(e)}`));
			}
		})
	);
