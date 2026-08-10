export { initData, isConfigured, readSettings, getDb, getApp } from './client';
export type { FirebaseSettings } from './client';

export { fetchReadings, appendReading, fetchAlerts } from './repository';
export type { Page } from './repository';

export type {
    Alert,
    AgroReading,
    BaseReading,
    IndustryReading,
    Metric,
    Millis,
    PersonalReading,
    ProductivityReading,
    Reading,
    ReadingFor,
    TransportReading,
} from './types';

/**
 * Where the numbers on screen came from.
 *
 * Every view renders this, so a user always knows whether they are looking at
 * their plant or at a demonstration. The landing page does the same thing with
 * its live-demo widget; it is the same promise, kept in both places.
 */
export type DataSource = 'store' | 'generated';
