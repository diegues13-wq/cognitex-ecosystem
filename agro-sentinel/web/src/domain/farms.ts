import type { Channel, ChannelId, Farm } from './types';

/**
 * The five farms, and the channels a console can plot.
 *
 * Both tables used to be duplicated: the farms in `utils/dataGenerator.js` and
 * again, as a frozenset of bare strings, in `cloud/main.py:29`, `thermal.py:37`
 * and `ai_assistant.py:28`. The IDs here are the ones the cloud validates, so
 * a farm added on this side is visibly missing from that side rather than
 * silently rejected at ingest.
 */

export const FARMS: readonly Farm[] = [
    {
        id: 'GH-AMB-01',
        name: 'Finca Ambato',
        city: 'Ambato',
        region: 'SIERRA',
        lat: -1.2491,
        lng: -78.6168,
        baseTemperature: 15,
        baseHumidity: 50,
        crop: 'Rosas',
        hectares: 3.2,
        altitude: 2577,
    },
    {
        id: 'GH-DUR-01',
        name: 'Agro Durán',
        city: 'Durán',
        region: 'COSTA',
        lat: -2.1701,
        lng: -79.822,
        baseTemperature: 28,
        baseHumidity: 75,
        crop: 'Pimientos',
        hectares: 5.8,
        altitude: 6,
    },
    {
        id: 'GH-CAY-01',
        name: 'Flores Cayambe',
        city: 'Cayambe',
        region: 'SIERRA',
        lat: 0.0414,
        lng: -78.1452,
        baseTemperature: 12,
        baseHumidity: 55,
        crop: 'Gypsophila',
        hectares: 2.1,
        altitude: 2830,
    },
    {
        id: 'GH-ORO-01',
        name: 'Bananera El Oro',
        city: 'Machala',
        region: 'COSTA',
        lat: -3.2581,
        lng: -79.9605,
        baseTemperature: 26,
        baseHumidity: 80,
        crop: 'Banano',
        hectares: 12.4,
        altitude: 8,
    },
    {
        id: 'GH-TEN-01',
        name: 'Selva Viva Tena',
        city: 'Tena',
        region: 'AMAZONIA',
        lat: -0.9938,
        lng: -77.8129,
        baseTemperature: 24,
        baseHumidity: 90,
        crop: 'Cacao',
        hectares: 8.7,
        altitude: 510,
    },
];

/** The first farm, used as the default selection. Never undefined. */
export const DEFAULT_FARM: Farm = FARMS[0]!;

export function findFarm(id: string): Farm | null {
    return FARMS.find((farm) => farm.id === id) ?? null;
}

/**
 * Every plottable channel, with its unit.
 *
 * The old dashboard carried this same list four times over — in `OPTIMAL`, in
 * `CHART_CONFIG`, in `SENSOR_FILTERS` and again inline in the KPI grid — each
 * with its own colour literal and its own spelling of the unit. One table now,
 * and the colour comes from the theme rather than from six hex values.
 */
export const CHANNELS: readonly Channel[] = [
    {
        id: 'airTemperature',
        label: 'Temperatura del aire',
        short: 'Temperatura',
        unit: '°C',
        precision: 1,
        higherIsBetter: false,
    },
    {
        id: 'humidity',
        label: 'Humedad relativa',
        short: 'Humedad',
        unit: '%',
        precision: 1,
        higherIsBetter: true,
    },
    {
        id: 'vpd',
        label: 'Déficit de presión de vapor',
        short: 'VPD',
        unit: 'kPa',
        precision: 2,
        higherIsBetter: false,
    },
    {
        id: 'co2',
        label: 'Concentración de CO₂',
        short: 'CO₂',
        unit: 'ppm',
        precision: 0,
        higherIsBetter: true,
    },
    {
        id: 'soilMoisture',
        label: 'Humedad del suelo',
        short: 'Suelo',
        unit: '%',
        precision: 1,
        higherIsBetter: true,
    },
    {
        id: 'par',
        label: 'Radiación PAR',
        short: 'PAR',
        unit: 'µmol/m²·s',
        precision: 0,
        higherIsBetter: true,
    },
    {
        id: 'batteryPct',
        label: 'Batería del nodo',
        short: 'Batería',
        unit: '%',
        precision: 0,
        higherIsBetter: true,
    },
    {
        id: 'rssiDbm',
        label: 'Señal de radio',
        short: 'RSSI',
        unit: 'dBm',
        precision: 0,
        higherIsBetter: true,
    },
];

/** The six climate channels. Battery and radio are device health, not climate. */
export const CLIMATE_CHANNELS: readonly Channel[] = CHANNELS.filter(
    (channel) => channel.id !== 'batteryPct' && channel.id !== 'rssiDbm'
);

const BY_ID = new Map<ChannelId, Channel>(CHANNELS.map((channel) => [channel.id, channel]));

export function findChannel(id: ChannelId): Channel {
    // Every ChannelId is in CHANNELS; the map lookup type says otherwise.
    return BY_ID.get(id) ?? CHANNELS[0]!;
}
