import type {
    CargoDay,
    EnergyDay,
    FleetFilter,
    FleetKpis,
    HistoryDay,
    Incident,
    IncidentSeverity,
    IncidentStatus,
    PassengerDay,
    RailAlert,
    RailRoute,
    RamsMetric,
    Schedule,
    TrainSnapshot,
    WorkOrder,
} from '../domain/types';
import { parseList, toRailAlert, toWorkOrder } from '../domain/parse';

/**
 * The Express API in `api/`.
 *
 * This console keeps its server rather than talking to Firestore from the
 * browser like the other five, because streaming Gemini needs a process that
 * can hold a credential. In dev Vite proxies `/api` to :3001; in production
 * the same Node process serves this bundle, so the path is identical.
 */

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(`/api${path}`, { signal });
    if (!response.ok) {
        throw new Error(`La API respondió ${response.status} en ${path}`);
    }
    return response.json();
}

/**
 * Shapes the API and this app define together, in one repository, from one
 * generator. They are cast rather than parsed; the two that were *not* in
 * agreement — alerts and work orders — go through `domain/parse.ts` instead.
 */
async function getTyped<T>(path: string, signal?: AbortSignal): Promise<T> {
    return (await getJson(path, signal)) as T;
}

export function fetchFleetSnapshot(
    type: FleetFilter,
    signal?: AbortSignal
): Promise<TrainSnapshot[]> {
    return getTyped<TrainSnapshot[]>(`/fleet?type=${type}`, signal);
}

export function fetchFleetKpis(type: FleetFilter, signal?: AbortSignal): Promise<FleetKpis> {
    return getTyped<FleetKpis>(`/kpis?type=${type}`, signal);
}

export async function fetchAlerts(type: FleetFilter, signal?: AbortSignal): Promise<RailAlert[]> {
    const raw = await getJson(`/alerts?type=${type}`, signal);
    return parseList(raw, (item) => toRailAlert(item));
}

export async function fetchWorkOrders(signal?: AbortSignal): Promise<WorkOrder[]> {
    return parseList(await getJson('/maintenance', signal), toWorkOrder);
}

const SEVERITIES: readonly IncidentSeverity[] = ['CRITICO', 'MAYOR', 'MENOR'];

/**
 * Incidents get a parser for one field: `status`.
 *
 * CCOView used to render `const openIncidents = 1;` with a comment naming the
 * incident it was counting, so the control room's incident indicator was a
 * literal that could not change when the incident was closed.
 */
function toIncident(raw: unknown): Incident | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const record = raw as Record<string, unknown>;
    if (typeof record.id !== 'string') return null;

    const severity = String(record.severity ?? '').toUpperCase();
    const status: IncidentStatus = String(record.status ?? '').toUpperCase() === 'ABIERTO'
        ? 'ABIERTO'
        : 'CERRADO';

    return {
        ...(record as unknown as Incident),
        id: record.id,
        severity: SEVERITIES.includes(severity as IncidentSeverity)
            ? (severity as IncidentSeverity)
            : 'MENOR',
        status,
    };
}

export async function fetchIncidents(signal?: AbortSignal): Promise<Incident[]> {
    return parseList(await getJson('/incidents', signal), toIncident);
}

/**
 * Daily history for one train.
 *
 * `trainId` is explicit because the API defaults it to USA-001, and the fleet
 * view used to render that default under whichever asset the operator had
 * selected — an Acela's punctuality curve labelled as a Brazilian ore train's.
 */
export function fetchHistory(
    days: number,
    trainId: string | null,
    signal?: AbortSignal
): Promise<HistoryDay[]> {
    const train = trainId ? `&train=${encodeURIComponent(trainId)}` : '';
    return getTyped<HistoryDay[]>(`/history?days=${days}${train}`, signal);
}

export function fetchEnergy(days: number, signal?: AbortSignal): Promise<EnergyDay[]> {
    return getTyped<EnergyDay[]>(`/energy?days=${days}`, signal);
}

export function fetchPassengerData(days: number, signal?: AbortSignal): Promise<PassengerDay[]> {
    return getTyped<PassengerDay[]>(`/commercial?type=pasajeros&days=${days}`, signal);
}

export function fetchCargoData(days: number, signal?: AbortSignal): Promise<CargoDay[]> {
    return getTyped<CargoDay[]>(`/commercial?type=carga&days=${days}`, signal);
}

export function fetchRams(signal?: AbortSignal): Promise<RamsMetric[]> {
    return getTyped<RamsMetric[]>('/rams', signal);
}

export function fetchRoutes(signal?: AbortSignal): Promise<RailRoute[]> {
    return getTyped<RailRoute[]>('/routes', signal);
}

export function fetchSchedule(routeId: string, signal?: AbortSignal): Promise<Schedule> {
    return getTyped<Schedule>(`/schedule?route=${encodeURIComponent(routeId)}`, signal);
}
