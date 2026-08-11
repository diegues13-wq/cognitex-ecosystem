import type { Alert } from '@cognitex/data';

/**
 * The railway domain, typed.
 *
 * The audit's two live defects in this console were both shape disagreements
 * between a producer and a consumer that JavaScript could not see:
 *
 *   · the API emitted `{ time, priority }` for an alert while the client-side
 *     generator emitted `{ timestamp, severity }`, so the ticker rendered a
 *     blank time and CCO's "critical" filter matched nothing;
 *   · work orders were written `EN_PROGRESO` in one place and read `EN_CURSO`
 *     in another, so the status icon always fell through to PENDIENTE.
 *
 * Both are now closed unions. A third spelling is a compile error, and
 * `domain/parse.ts` is the single place where anything from the wire is
 * allowed to be a `string`.
 */

// ── Fleet ───────────────────────────────────────────────────────────────────

export type FleetFilter = 'todos' | 'pasajeros' | 'carga';
export type ServiceKind = 'pasajeros' | 'carga' | 'mixto';
export type Traction = 'electrico' | 'diesel' | 'hibrido';
export type TrainStatus = 'EN_SERVICIO' | 'EN_MANTENIMIENTO' | 'STANDBY' | 'RETIRADO';
export type MaintUrgency = 'CRITICA' | 'PROXIMA' | 'OK';

/** Static registry attributes. Stored in Firestore, never generated. */
export interface Train {
    id: string;
    callsign: string;
    name: string;
    type: ServiceKind;
    traction: Traction;
    manufacturer: string;
    model: string;
    yearBuilt: number;
    depot: string;
    /** Seats for a passenger unit, tonnes for a freight unit. */
    capacity: number;
    maxSpeedKmh: number;
    powerKw: number;
    weightTons: number;
    lengthM: number;
    axleCount: number;
    odometer: number;
    nextMaintKm: number;
    route: string;
    lat: number;
    lng: number;
}

/** A train plus its current operating state. */
export interface TrainSnapshot extends Train {
    status: TrainStatus;
    /** km/h */
    speed: number;
    /** Minutes late; may be negative when running early. */
    delayMin: number;
    otp: boolean;
    /** Percent full. Null for freight, which measures tonnage instead. */
    occupancy: number | null;
    /** Tonnes on board. Null for passenger units. */
    tonsLoaded: number | null;
    fuelL: number;
    kwhConsumed: number;
    tripKm: number;
    kmToNextMaint: number;
    maintUrgency: MaintUrgency;
    routeName: string;
}

export interface FleetKpis {
    disponibilidad: number;
    trenesActivos: number;
    total: number;
    trenesMantenimiento: number;
    /** On-time performance, percent. */
    otp: number;
    kmTotales: number;
    combustibleTotal: number;
    energiaTotal: number;
    cargaPasajeros: number;
    toneladasHoy: number;
    factorCarga: number;
    co2Estimado: number;
    /** Mean time between failures, hours (EN 50126). */
    mtbf: number;
    /** Mean time to repair, hours. */
    mttr: number;
    ramsDisponibilidad: number;
    incidentesHoy: number;
    diasSinAccidente: number;
    prevMaintCompliance: number;
}

// ── Network ─────────────────────────────────────────────────────────────────

export interface RouteStop {
    id: string;
    name: string;
    km: number;
    lat: number;
    lng: number;
}

export interface RailRoute {
    id: string;
    name: string;
    distanceKm: number;
    maxSpeedKmh: number;
    type: ServiceKind;
    scheduledFreqMin: number;
    operatingHours: { start: string; end: string };
    stops: RouteStop[];
}

/** A stop on a specific run: when it was planned, when it actually happens. */
export interface ServiceStop extends RouteStop {
    plannedMin: number;
    actualMin: number;
}

export interface TrainService {
    id: string;
    direction: 'IDA' | 'VUELTA';
    /** Minutes past midnight. */
    departureMin: number;
    arrivalMin: number;
    stops: ServiceStop[];
    delayMin: number;
    onTime: boolean;
    trainId: string;
}

export interface Schedule {
    route: RailRoute;
    services: TrainService[];
    totalDistanceKm: number;
}

// ── Maintenance ─────────────────────────────────────────────────────────────

/**
 * The closed status set. `EN_CURSO` is canonical; `EN_PROGRESO` was the other
 * spelling in circulation and `parse.ts` folds it in rather than letting it
 * reach a component that has never heard of it.
 */
export type WorkOrderStatus = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'VENCIDO';
export type WorkOrderKind = 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO' | 'INSPECCION';
export type WorkOrderPriority = 'ALTA' | 'MEDIA' | 'BAJA';
export type WorkOrderTrigger = 'KM' | 'COND' | 'TIEMPO';

export interface WorkOrder {
    id: string;
    assetId: string;
    type: WorkOrderKind;
    priority: WorkOrderPriority;
    status: WorkOrderStatus;
    component: string;
    triggerType: WorkOrderTrigger;
    /** The km reading the order comes due at. Null for time/condition triggers. */
    triggerValue: number | null;
    currentValue: number | null;
    estimatedHours: number;
    depot: string;
    /** ISO date, yyyy-MM-dd. */
    scheduledDate: string;
    aiPredictedFailureDate: string | null;
    remainingLifePct: number | null;
    aiConfidencePct: number | null;
}

// ── Safety ──────────────────────────────────────────────────────────────────

export type IncidentSeverity = 'CRITICO' | 'MAYOR' | 'MENOR';
export type IncidentStatus = 'ABIERTO' | 'CERRADO';

export interface Incident {
    id: string;
    /** yyyy-MM-dd HH:mm, local depot time. */
    date: string;
    trainId: string;
    routeId: string;
    type: string;
    severity: IncidentSeverity;
    description: string;
    rootCause: string;
    correctiveAction: string;
    status: IncidentStatus;
}

export interface RamsMetric {
    trainId: string;
    trainName: string;
    mtbf: number;
    mttr: number;
    availability: number;
    failureRate: number;
    healthScore: number;
    lastFailureDate: string;
    sil: string;
}

// ── Alerts ──────────────────────────────────────────────────────────────────

export type AlertCategory =
    | 'MANTENIMIENTO'
    | 'PREDICTIVO'
    | 'RETRASO'
    | 'OCUPACION'
    | 'ENERGIA'
    | 'COMBUSTIBLE'
    | 'INFO';

/**
 * The shared `Alert` — same `at`/`status`/`message` fields the other five
 * consoles render — plus the two things a railway ticker needs and a generic
 * one does not.
 *
 * `assetId` is `''` for a network-wide alert. The shared type declares it as
 * a plain string, so the empty string is the "no single asset" value rather
 * than widening the shared shape to `string | null` for one platform.
 */
export interface RailAlert extends Alert {
    category: AlertCategory;
    assetName: string | null;
}

// ── Time series ─────────────────────────────────────────────────────────────

export interface HistoryDay {
    date: string;
    displayDate: string;
    fullDate: string;
    tripsCompleted: number;
    kmTraveled: number;
    otp: number;
    delayAvgMin: number;
    occupancyPct: number | null;
    tonsTransported: number | null;
    fuelLiters: number;
    kwhConsumed: number;
    co2Kg: number;
    regenKwh: number;
    incidentCount: number;
    maintenanceFlag: boolean;
}

export interface EnergyDay {
    date: string;
    displayDate: string;
    kwhElectrico: number;
    litrosDiesel: number;
    co2Kg: number;
    kwhRegen: number;
    costEnergiaUSD: number;
    /** Train-kilometres run under each traction — the denominator below. */
    trainKmElectrico: number;
    trainKmDiesel: number;
    /** kWh per train-km. UIC reference band is 6.67–8.14. */
    specifickWhKm: number;
    /** Litres per train-km. */
    specificLKm: number;
}

export interface PassengerDay {
    date: string;
    displayDate: string;
    pasajeros: number;
    factorCarga: number;
    ingresoUSD: number;
    costoOperUSD: number;
    paxKm: number;
}

export interface CargoDay {
    date: string;
    displayDate: string;
    toneladas: number;
    tonKm: number;
    ingresoUSD: number;
    costoOperUSD: number;
    entregasATiempo: number;
    vagonVacioPct: number;
}
