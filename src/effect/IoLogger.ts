import { MFunction } from '#mjljm/effect-lib/index';
import { ANSI } from '@mjljm/js-lib';
import { FiberId, HashSet, Logger, Option, ReadonlyArray, identity, pipe } from 'effect';

const TypeId: unique symbol = Symbol.for('@mjljm/effect-lib/effect/IoLogger.ts');
type TypeId = typeof TypeId;

interface Message {
	readonly [TypeId]: TypeId;
	readonly message: string;
	readonly showDate: boolean;
	readonly skipMessageFormatting: boolean;
	readonly object: Option.Option<unknown>;
	readonly skipLineBefore: boolean;
	readonly skipLineAfter: boolean;
}
//const Message = MStruct.make<Message>;
const isMessage = (u: unknown): u is Message => MFunction.isRecord(u) && u[TypeId] === TypeId;
export const $ = (title: string, skipLineBefore = true, skipLineAfter = false): Message => ({
	message: ANSI.yellow(title),
	showDate: true,
	skipMessageFormatting: true,
	object: Option.none(),
	skipLineBefore,
	skipLineAfter,
	[TypeId]: TypeId
});
export const _ = (text: string, skipLineBefore = false, skipLineAfter = false, object: unknown = null): Message => ({
	message: text,
	showDate: false,
	skipMessageFormatting: false,
	object: Option.fromNullable(object),
	skipLineBefore,
	skipLineAfter,
	[TypeId]: TypeId
});
export const skipLine = (): Message => ({
	message: '',
	showDate: false,
	skipMessageFormatting: true,
	object: Option.none(),
	skipLineBefore: false,
	skipLineAfter: false,
	[TypeId]: TypeId
});

export const live = (stringify: (u: unknown) => string) =>
	pipe(new Date().getTime(), (startTime) =>
		Logger.replace(
			Logger.defaultLogger,
			Logger.make(({ fiberId, date, message, logLevel }) => {
				try {
					console.log(
						(isMessage(message) && message.skipLineBefore ? '\n' : '') +
							(isMessage(message) && !message.showDate
								? ''
								: (logLevel._tag === 'Error' || logLevel._tag === 'Fatal'
										? ANSI.red
										: logLevel._tag === 'Warning'
										  ? ANSI.yellow
										  : ANSI.green)(
										pipe(
											FiberId.ids(fiberId),
											HashSet.map((n) => n.toString()),
											ReadonlyArray.join('-')
										) + ` ${date.getTime() - startTime}ms `
								  )) +
							(isMessage(message)
								? (message.message === ''
										? '' // Don't show fiberId when skipping line
										: (message.skipMessageFormatting ? identity : ANSI.gray)(
												message.message +
													(!message.showDate
														? '(' +
														  pipe(
																FiberId.ids(fiberId),
																HashSet.map((n) => n.toString()),
																ReadonlyArray.join('-')
														  ) +
														  ')'
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
