/**
 * Shared work-location limits and defaults.
 *
 * The radius bounds mirror the backend `WorkLocationOptions` validation
 * (1..1000 metres by default) so the forms fail fast with a Persian message
 * instead of receiving a 400 from the API.
 */

/** Default viewport: Hamedan city, Hamedan Province, Iran. */
export const WORK_LOCATION_MAP_CENTER: [number, number] = [34.7983, 48.5147];
export const WORK_LOCATION_DEFAULT_ZOOM = 13;
/** Close enough to distinguish streets once the user's own position is known. */
export const WORK_LOCATION_CURRENT_LOCATION_ZOOM = 16;
export const WORK_LOCATION_GEOLOCATION_TIMEOUT_MS = 15000;
export const WORK_LOCATION_ASSET_LOAD_TIMEOUT_MS = 20000;

export const WORK_LOCATION_MIN_LATITUDE = -90;
export const WORK_LOCATION_MAX_LATITUDE = 90;
export const WORK_LOCATION_MIN_LONGITUDE = -180;
export const WORK_LOCATION_MAX_LONGITUDE = 180;

export const WORK_LOCATION_MIN_RADIUS_METERS = 1;
export const WORK_LOCATION_MAX_RADIUS_METERS = 1000;
export const WORK_LOCATION_DEFAULT_RADIUS_METERS = 200;

export const WORK_LOCATION_NAME_MAX_LENGTH = 200;
