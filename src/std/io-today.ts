//export const isoToday = new Date().toISOString();
//export const YYYYMMddToday = isoToday.slice(0, 4) + isoToday.slice(5, 7) + isoToday.slice(8, 10);

import { isoToYyyymmdd } from '@mjljm/js-lib/strings';
import { Context, Layer } from 'effect';

export interface Interface {
	readonly asDate: () => Date;
	readonly asIsoString: () => string;
	readonly asYyyymmdd: () => string;
}

export const ServiceTag = Context.Tag<Interface>();

export const implementation: Interface = {
	asDate: () => new Date(),
	asIsoString: () => new Date().toISOString(),
	asYyyymmdd: () => isoToYyyymmdd(new Date().toISOString())
};
export const live = Layer.succeed(ServiceTag, implementation);
