import { MFiberId, MFunction } from '#mjljm/effect-lib/index';
import { ANSI, StringUtils } from '@mjljm/js-lib';
import { Effect, Function, Logger, Option } from 'effect';

const moduleTag = '@mjljm/effect-lib/effect/IoLogger/';

const MessageTypeId: unique symbol = Symbol.for(moduleTag + 'MessageTypeId');
type MessageTypeId = typeof MessageTypeId;

type Importance = 'title' | 'subTitle' | 'normal';

interface Message {
	readonly [MessageTypeId]: MessageTypeId;
	readonly message: string;
	readonly importance: Importance;
	readonly object: Option.Option<MFunction.RecordOrArray>;
	readonly skipLineBefore: boolean;
	readonly skipLineAfter: boolean;
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
		importance: 'title',
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false
	});
const subTitleMessage = (text: string): Message =>
	Message({
		message: text,
		importance: 'subTitle',
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: false
	});
const subTitleMessageLineBreakAfter = (text: string): Message =>
	Message({
		message: text,
		importance: 'subTitle',
		object: Option.none(),
		skipLineBefore: false,
		skipLineAfter: true
	});
const subTitleMessageLineBreakBefore = (text: string): Message =>
	Message({
		message: text,
		importance: 'subTitle',
		object: Option.none(),
		skipLineBefore: true,
		skipLineAfter: false
	});

/**
 *
 * Logging functions
 */

export const infoTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logInfo(titleMessage(message));
export const infoSubTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logInfo(subTitleMessage(message));
export const infoEolSubTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logInfo(subTitleMessageLineBreakAfter(message));
export const infoSubTitleEol = (message: string): Effect.Effect<never, never, void> =>
	Effect.logInfo(subTitleMessageLineBreakBefore(message));

export const debugTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logDebug(titleMessage(message));
export const debugSubTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logDebug(subTitleMessage(message));
export const debugEolSubTitle = (message: string): Effect.Effect<never, never, void> =>
	Effect.logDebug(subTitleMessageLineBreakAfter(message));
export const debugSubTitleEol = (message: string): Effect.Effect<never, never, void> =>
	Effect.logDebug(subTitleMessageLineBreakBefore(message));

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

			const colorizeByImportance = (importance: Importance) => (importance === 'title' ? ANSI.yellow : ANSI.gray);

			try {
				const objectMessage = isMessage(message)
					? message
					: MFunction.isPrimitive(message) || MFunction.isFunction(message)
						? Message({
								message: String(message),
								importance: 'normal',
								object: Option.none(),
								skipLineBefore: false,
								skipLineAfter: false
							})
						: Message({
								message: '',
								importance: 'normal',
								object: Option.some(message as MFunction.RecordOrArray),
								skipLineBefore: false,
								skipLineAfter: false
							});

				console.log(
					(objectMessage.skipLineBefore ? '\n' : '') +
						(objectMessage.message === ''
							? ''
							: (objectMessage.importance === 'subTitle'
									? tabChar
									: colorizeByLogLevel(`${date.getTime() - startTime}ms `)) +
								colorizeByImportance(objectMessage.importance)(
									objectMessage.message + ' (' + MFiberId.toJson(fiberId) + ')'
								)) +
						Option.match(objectMessage.object, {
							onNone: () => '',
							onSome: (u) =>
								'\n' +
								(objectMessage.importance === 'subTitle' ? StringUtils.tabify(tabChar) : Function.identity)(
									ANSI.blue(stringify(u))
								)
						}) +
						(objectMessage.skipLineAfter ? '\n' : '')
				);
			} catch (e) {
				console.log(ANSI.red(`Logging error\n${stringify(e)}`));
			}
		})
	);
