import { MError } from '#mjljm/effect-lib/index';
import { Cause, FiberId, Function, HashSet, ReadonlyArray, pipe } from 'effect';

export const isGeneralCause = (
	c: Cause.Cause<unknown>
): c is Cause.Cause<MError.General<unknown>> =>
	Cause.isFailType(c) && c.error instanceof MError.General;

const formatInternal = <E>(
	self: Cause.Cause<E>,
	stringify: (u: unknown) => string,
	onFail: (error: E) => string
): string =>
	Cause.match(self, {
		onEmpty: '',
		onFail: (error) => onFail(error),
		onDie: (defect) => `SCRIPT DIED WITH DEFECT:\n${stringify(defect)}`,
		onInterrupt: (fiberId) =>
			'FIBERS ' +
			pipe(
				FiberId.ids(fiberId),
				HashSet.map((n) => n.toString()),
				ReadonlyArray.join(',')
			) +
			' WERE INTERRUPTED',
		onSequential: (left, right) =>
			left === '' ? right : right === '' ? left : `${left}\n${right}`,
		onParallel: (left, right) =>
			left === '' ? right : right === '' ? left : `${left}\n\n${right}`
	});

export const format: {
	(
		stringify: (u: unknown) => string
	): <T, E extends MError.General<T>>(self: Cause.Cause<E>) => string;
	<T, E extends MError.General<T>>(
		self: Cause.Cause<E>,
		stringify: (u: unknown) => string
	): string;
} = Function.dual(
	2,
	<T, E extends MError.General<T>>(
		self: Cause.Cause<E>,
		stringify: (u: unknown) => string
	): string =>
		formatInternal(self, stringify, (error) => {
			const o = error.originalCause;
			return (
				'SCRIPT FAILED WITH ERROR: ' +
				error.message +
				(typeof o === 'undefined'
					? ''
					: '\n' +
					  (isGeneralCause(o)
							? format(o, stringify)
							: formatInternal(o, stringify, (error) => stringify(error))))
			);
		})
);
