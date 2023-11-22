import { MError } from '#mjljm/effect-lib/index';
import {
	Either,
	HashMap,
	MutableHashSet,
	Option,
	identity,
	pipe
} from 'effect';

export const templater =
	(
		target: RegExp,
		replacementMap: HashMap.HashMap<string, string>,
		checkAllUsed = true
	) =>
	(self: string) => {
		const foundSet = MutableHashSet.empty<string>();
		let notFound = '';
		const result = self.replace(target, (match) => {
			if (notFound !== '') return '';
			MutableHashSet.add(foundSet, match);
			return pipe(
				replacementMap,
				HashMap.get(match),
				Option.match({
					onNone: () => ((notFound = match), ''),
					onSome: identity
				})
			);
		});
		if (notFound !== '')
			return Either.left(
				new MError.General({
					message: `templateAllUsedNoExtra: ${notFound} not found in replacementMap`
				})
			);
		if (
			checkAllUsed &&
			HashMap.size(replacementMap) !== MutableHashSet.size(foundSet)
		)
			return Either.left(
				new MError.General({
					message:
						'templateAllUsedNoExtra: some replacements present in replacementMap were not used'
				})
			);
		else return Either.right(result);
	};
