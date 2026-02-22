/**
 * Single entry for Jest (and fallback when no platform-specific db is resolved).
 * Metro resolves db.native.ts / db.web.ts by platform; Node/Jest resolves this file.
 */
export * from './db.web';
