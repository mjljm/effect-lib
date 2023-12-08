//export const isoToday = new Date().toISOString();
//export const YYYYMMddToday = isoToday.slice(0, 4) + isoToday.slice(5, 7) + isoToday.slice(8, 10);

import { StringUtils } from '@mjljm/js-lib';
import { Context, Layer } from 'effect';

export interface ServiceInterface {
	readonly asDate: () => Date;
	readonly asIsoString: () => string;
	readonly asYyyymmdd: () => string;
}

export const ServiceTag = Context.Tag<ServiceInterface>();

export const live = Layer.succeed(ServiceTag, {
	asDate: () => new Date(),
	asIsoString: () => new Date().toISOString(),
	asYyyymmdd: () => StringUtils.isoToYyyymmdd(new Date().toISOString())
});
