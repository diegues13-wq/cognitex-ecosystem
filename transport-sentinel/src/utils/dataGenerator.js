// Native date helpers — no external dependency
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function pad(n) { return String(n).padStart(2, '0'); }
function subDays(date, n) { return new Date(date.getTime() - n * 86400000); }
function addMinutes(date, n) { return new Date(date.getTime() + n * 60000); }
function format(date, pattern) {
    const d = date.getDate(), mo = date.getMonth(), y = date.getFullYear();
    const h = date.getHours(), mi = date.getMinutes();
    if (pattern === 'yyyy-MM-dd')      return `${y}-${pad(mo+1)}-${pad(d)}`;
    if (pattern === 'dd/MM')           return `${pad(d)}/${pad(mo+1)}`;
    if (pattern === 'dd MMM')          return `${pad(d)} ${MONTHS_SHORT[mo]}`;
    if (pattern === 'HH:mm')           return `${pad(h)}:${pad(mi)}`;
    if (pattern === 'yyyy-MM-dd HH:mm') return `${y}-${pad(mo+1)}-${pad(d)} ${pad(h)}:${pad(mi)}`;
    return date.toISOString();
}

// ─── MASTER FLEET DATA ────────────────────────────────────────────────────────

export const TRAINS = [
    // Passenger EMU (Electric Multiple Units)
    { id: 'PAX-001', callsign: 'TR-4071', name: 'El Libertador',   type: 'pasajeros', traction: 'electrico',  manufacturer: 'Alstom',  model: 'Coradia Continental', yearBuilt: 2018, depot: 'Caracas Central',    capacity: 320, maxSpeedKmh: 160, powerKw: 3200, weightTons: 285, lengthM: 160, axleCount: 16, odometer: 142300, nextMaintKm: 150000, route: 'RT-001', lat: 10.4806, lng: -66.9036 },
    { id: 'PAX-002', callsign: 'TR-4072', name: 'Simón Bolívar',   type: 'pasajeros', traction: 'electrico',  manufacturer: 'Alstom',  model: 'Coradia Continental', yearBuilt: 2018, depot: 'Caracas Central',    capacity: 320, maxSpeedKmh: 160, powerKw: 3200, weightTons: 285, lengthM: 160, axleCount: 16, odometer: 98200,  nextMaintKm: 100000, route: 'RT-002', lat: 10.3400, lng: -66.8700 },
    { id: 'PAX-003', callsign: 'TR-4073', name: 'El Carabobo',     type: 'pasajeros', traction: 'electrico',  manufacturer: 'CAF',     model: 'Urbos 3',             yearBuilt: 2020, depot: 'Valencia Norte',    capacity: 280, maxSpeedKmh: 140, powerKw: 2800, weightTons: 230, lengthM: 145, axleCount: 14, odometer: 71500,  nextMaintKm: 100000, route: 'RT-003', lat: 10.1800, lng: -67.9900 },
    { id: 'PAX-004', callsign: 'TR-4074', name: 'El Avila',        type: 'pasajeros', traction: 'electrico',  manufacturer: 'Siemens', model: 'Desiro Classic',      yearBuilt: 2016, depot: 'Caracas Central',    capacity: 300, maxSpeedKmh: 160, powerKw: 3000, weightTons: 260, lengthM: 155, axleCount: 16, odometer: 215000, nextMaintKm: 250000, route: 'RT-001', lat: 10.6000, lng: -66.9300 },
    { id: 'PAX-005', callsign: 'TR-4075', name: 'El Waraira',      type: 'pasajeros', traction: 'electrico',  manufacturer: 'CAF',     model: 'Urbos 3',             yearBuilt: 2021, depot: 'Maracay Sur',      capacity: 280, maxSpeedKmh: 140, powerKw: 2800, weightTons: 230, lengthM: 145, axleCount: 14, odometer: 45200,  nextMaintKm: 100000, route: 'RT-003', lat: 10.2400, lng: -67.5900 },
    { id: 'PAX-006', callsign: 'TR-4076', name: 'Francisco Miranda', type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom', model: 'Coradia Continental', yearBuilt: 2019, depot: 'Valencia Norte',    capacity: 320, maxSpeedKmh: 160, powerKw: 3200, weightTons: 285, lengthM: 160, axleCount: 16, odometer: 126800, nextMaintKm: 150000, route: 'RT-002', lat: 10.2600, lng: -67.8000 },
    { id: 'PAX-007', callsign: 'TR-4077', name: 'Sucre Expreso',   type: 'pasajeros', traction: 'electrico',  manufacturer: 'Siemens', model: 'Desiro Classic',      yearBuilt: 2017, depot: 'Maracay Sur',      capacity: 300, maxSpeedKmh: 160, powerKw: 3000, weightTons: 260, lengthM: 155, axleCount: 16, odometer: 189400, nextMaintKm: 200000, route: 'RT-002', lat: 10.2800, lng: -67.6000 },
    { id: 'PAX-008', callsign: 'TR-4078', name: 'Ezequiel Zamora', type: 'pasajeros', traction: 'electrico',  manufacturer: 'CAF',     model: 'Urbos 3',             yearBuilt: 2022, depot: 'Caracas Central',    capacity: 280, maxSpeedKmh: 140, powerKw: 2800, weightTons: 230, lengthM: 145, axleCount: 14, odometer: 22100,  nextMaintKm: 100000, route: 'RT-001', lat: 10.5000, lng: -66.8800 },
    // Freight Diesel Locomotives
    { id: 'FRE-001', callsign: 'TR-8012', name: 'Carga Norte',     type: 'carga', traction: 'diesel',     manufacturer: 'GE',      model: 'ES44AC',              yearBuilt: 2015, depot: 'Puerto Cabello',    capacity: 3200, maxSpeedKmh: 100, powerKw: 3280, weightTons: 196, lengthM: 22,  axleCount: 6,  odometer: 287100, nextMaintKm: 300000, route: 'RT-004', lat: 10.4700, lng: -68.0100 },
    { id: 'FRE-002', callsign: 'TR-8013', name: 'Carga Sur',       type: 'carga', traction: 'diesel',     manufacturer: 'EMD',     model: 'SD70ACe',             yearBuilt: 2014, depot: 'Valencia Norte',    capacity: 3500, maxSpeedKmh: 100, powerKw: 3200, weightTons: 188, lengthM: 22,  axleCount: 6,  odometer: 312400, nextMaintKm: 350000, route: 'RT-005', lat: 10.1200, lng: -69.3200 },
    { id: 'FRE-003', callsign: 'TR-8014', name: 'Carga Occidente', type: 'carga', traction: 'diesel',     manufacturer: 'GE',      model: 'ES44DC',              yearBuilt: 2016, depot: 'Barquisimeto',      capacity: 2800, maxSpeedKmh: 100, powerKw: 3280, weightTons: 196, lengthM: 22,  axleCount: 6,  odometer: 198700, nextMaintKm: 250000, route: 'RT-005', lat: 10.0600, lng: -69.3500 },
    { id: 'FRE-004', callsign: 'TR-8015', name: 'Maracaibo Exp.',  type: 'carga', traction: 'diesel',     manufacturer: 'EMD',     model: 'SD70MAC',             yearBuilt: 2013, depot: 'Maracaibo',         capacity: 3800, maxSpeedKmh: 90,  powerKw: 3000, weightTons: 190, lengthM: 22,  axleCount: 6,  odometer: 415200, nextMaintKm: 500000, route: 'RT-006', lat: 10.6300, lng: -71.6000 },
];

export const ROUTES = [
    {
        id: 'RT-001', name: 'Caracas — La Guaira', shortName: 'CCS-LGA',
        distanceKm: 37, type: 'pasajeros', maxSpeedKmh: 120,
        scheduledFreqMin: 30, operatingHours: { start: '05:00', end: '23:00' },
        stops: [
            { id: 'EST-001', name: 'Caracas Central',  km: 0,  lat: 10.4806, lng: -66.9036 },
            { id: 'EST-002', name: 'Antímano',         km: 6,  lat: 10.4900, lng: -66.9500 },
            { id: 'EST-003', name: 'La Guaira',        km: 37, lat: 10.6033, lng: -66.9326 },
        ],
    },
    {
        id: 'RT-002', name: 'Caracas — Valencia', shortName: 'CCS-VLC',
        distanceKm: 170, type: 'pasajeros', maxSpeedKmh: 160,
        scheduledFreqMin: 60, operatingHours: { start: '05:30', end: '22:00' },
        stops: [
            { id: 'EST-001', name: 'Caracas Central',  km: 0,   lat: 10.4806, lng: -66.9036 },
            { id: 'EST-004', name: 'La Victoria',      km: 65,  lat: 10.2289, lng: -67.3320 },
            { id: 'EST-005', name: 'Maracay',          km: 99,  lat: 10.2469, lng: -67.5938 },
            { id: 'EST-006', name: 'Valencia Norte',   km: 170, lat: 10.1800, lng: -67.9900 },
        ],
    },
    {
        id: 'RT-003', name: 'Valencia — Maracay', shortName: 'VLC-MCY',
        distanceKm: 62, type: 'pasajeros', maxSpeedKmh: 140,
        scheduledFreqMin: 45, operatingHours: { start: '05:00', end: '22:30' },
        stops: [
            { id: 'EST-006', name: 'Valencia Norte',   km: 0,  lat: 10.1800, lng: -67.9900 },
            { id: 'EST-007', name: 'Güigüe',           km: 25, lat: 10.1900, lng: -67.7500 },
            { id: 'EST-005', name: 'Maracay',          km: 62, lat: 10.2469, lng: -67.5938 },
        ],
    },
    {
        id: 'RT-004', name: 'Puerto Cabello — Valencia', shortName: 'PCA-VLC',
        distanceKm: 55, type: 'carga', maxSpeedKmh: 100,
        scheduledFreqMin: 0, operatingHours: { start: '00:00', end: '23:59' },
        stops: [
            { id: 'EST-008', name: 'Puerto Cabello',   km: 0,  lat: 10.4700, lng: -68.0100 },
            { id: 'EST-009', name: 'Morón',            km: 20, lat: 10.4900, lng: -68.2000 },
            { id: 'EST-006', name: 'Valencia Norte',   km: 55, lat: 10.1800, lng: -67.9900 },
        ],
    },
    {
        id: 'RT-005', name: 'Barquisimeto — Valencia', shortName: 'BQT-VLC',
        distanceKm: 120, type: 'carga', maxSpeedKmh: 100,
        scheduledFreqMin: 0, operatingHours: { start: '00:00', end: '23:59' },
        stops: [
            { id: 'EST-010', name: 'Barquisimeto',     km: 0,   lat: 10.0647, lng: -69.3571 },
            { id: 'EST-011', name: 'San Felipe',       km: 60,  lat: 10.3400, lng: -68.7400 },
            { id: 'EST-006', name: 'Valencia Norte',   km: 120, lat: 10.1800, lng: -67.9900 },
        ],
    },
    {
        id: 'RT-006', name: 'Maracaibo — Cabimas', shortName: 'MAR-CAB',
        distanceKm: 45, type: 'mixto', maxSpeedKmh: 90,
        scheduledFreqMin: 0, operatingHours: { start: '00:00', end: '23:59' },
        stops: [
            { id: 'EST-012', name: 'Maracaibo Norte',  km: 0,  lat: 10.6312, lng: -71.6011 },
            { id: 'EST-013', name: 'Santa Rita',       km: 22, lat: 10.5300, lng: -71.5000 },
            { id: 'EST-014', name: 'Cabimas',          km: 45, lat: 10.3965, lng: -71.4478 },
        ],
    },
];

// Deterministic pseudo-random seeded by string
function seededRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    const x = Math.sin(h) * 10000;
    return x - Math.floor(x);
}

function seededRandRange(seed, min, max) {
    return min + seededRandom(seed) * (max - min);
}

// ─── FLEET SNAPSHOT (real-time state) ────────────────────────────────────────

export function generateFleetSnapshot(fleetType = 'todos') {
    const now = new Date();
    const filtered = fleetType === 'todos' ? TRAINS : TRAINS.filter(t => t.type === fleetType);

    return filtered.map(train => {
        const seed = `${train.id}-${now.toDateString()}`;
        const statusRoll = seededRandom(seed + 'status');
        const status = statusRoll < 0.75 ? 'EN_SERVICIO'
            : statusRoll < 0.90 ? 'EN_MANTENIMIENTO'
            : 'STANDBY';

        const isRunning = status === 'EN_SERVICIO';
        const delayMin = isRunning ? Math.round(seededRandRange(seed + 'delay', -2, 18)) : 0;
        const speed = isRunning ? Math.round(seededRandRange(seed + 'speed', 60, train.maxSpeedKmh * 0.9)) : 0;
        const occupancy = train.type === 'pasajeros'
            ? Math.round(seededRandRange(seed + 'occ', 45, 92))
            : null;
        const tonsLoaded = train.type === 'carga'
            ? Math.round(seededRandRange(seed + 'tons', train.capacity * 0.5, train.capacity * 0.95))
            : null;

        // Fuel/energy for current trip
        const tripKm = Math.round(seededRandRange(seed + 'km', 20, 150));
        const fuelL = train.traction === 'diesel' ? parseFloat((tripKm * 2.5 + seededRandRange(seed + 'fl', -5, 15)).toFixed(1)) : 0;
        const kwhConsumed = train.traction === 'electrico' ? parseFloat((tripKm * (6.5 + seededRandRange(seed + 'kwh', -1, 2))).toFixed(1)) : 0;

        // Jitter position slightly for live movement feel
        const jitter = 0.02;
        const lat = train.lat + (Math.random() - 0.5) * jitter;
        const lng = train.lng + (Math.random() - 0.5) * jitter;

        const kmToMaint = train.nextMaintKm - train.odometer;
        const route = ROUTES.find(r => r.id === train.route);

        return {
            ...train,
            status,
            speed,
            delayMin,
            otp: delayMin <= 3,
            occupancy,
            tonsLoaded,
            fuelL,
            kwhConsumed,
            tripKm,
            lat: parseFloat(lat.toFixed(5)),
            lng: parseFloat(lng.toFixed(5)),
            kmToNextMaint: Math.max(0, kmToMaint),
            maintUrgency: kmToMaint < 2000 ? 'CRITICA' : kmToMaint < 10000 ? 'PROXIMA' : 'OK',
            routeName: route ? route.name : '',
        };
    });
}

// ─── FLEET KPIs (aggregated) ──────────────────────────────────────────────────

export function generateFleetKPIs(fleetType = 'todos') {
    const snapshot = generateFleetSnapshot(fleetType);
    const active = snapshot.filter(t => t.status === 'EN_SERVICIO');
    const total = snapshot.length;

    const disponibilidad = Math.round((snapshot.filter(t => t.status !== 'RETIRADO').length / total) * 100);
    const otpCount = active.filter(t => t.otp).length;
    const otp = active.length > 0 ? Math.round((otpCount / active.length) * 100) : 0;

    const kmTotales = active.reduce((s, t) => s + t.tripKm, 0);
    const combustibleTotal = parseFloat(snapshot.filter(t => t.traction === 'diesel').reduce((s, t) => s + t.fuelL, 0).toFixed(1));
    const energiaTotal = parseFloat(snapshot.filter(t => t.traction === 'electrico').reduce((s, t) => s + t.kwhConsumed, 0).toFixed(1));
    const trenesActivos = active.length;
    const trenesMantenimiento = snapshot.filter(t => t.status === 'EN_MANTENIMIENTO').length;

    const paxTrains = active.filter(t => t.type === 'pasajeros');
    const cargaTrains = active.filter(t => t.type === 'carga');

    const cargaPasajeros = paxTrains.reduce((s, t) => s + Math.round(t.capacity * (t.occupancy / 100)), 0);
    const toneladasHoy = cargaTrains.reduce((s, t) => s + (t.tonsLoaded || 0), 0);
    const factorCarga = paxTrains.length > 0
        ? Math.round(paxTrains.reduce((s, t) => s + t.occupancy, 0) / paxTrains.length)
        : 0;

    const co2Estimado = parseFloat((combustibleTotal * 2.68).toFixed(1));

    // MTBF / MTTR (simulated RAMS — EN 50126)
    const mtbf = Math.round(2800 + Math.random() * 400);   // hours between failures
    const mttr = parseFloat((3.2 + Math.random() * 1.5).toFixed(1));  // hours to repair
    const ramsDisponibilidad = parseFloat(((mtbf / (mtbf + mttr)) * 100).toFixed(1));
    const incidentesHoy = Math.floor(Math.random() * 3);
    const diasSinAccidente = Math.floor(42 + Math.random() * 20);

    return {
        disponibilidad,
        trenesActivos,
        total,
        trenesMantenimiento,
        otp,
        kmTotales,
        combustibleTotal,
        energiaTotal,
        cargaPasajeros,
        toneladasHoy,
        factorCarga,
        co2Estimado,
        mtbf,
        mttr,
        ramsDisponibilidad,
        incidentesHoy,
        diasSinAccidente,
        prevMaintCompliance: Math.round(90 + Math.random() * 8),
    };
}

// ─── HISTORICAL DATA (30 days) ────────────────────────────────────────────────

export function generateHistoricalData(days = 30, trainId = 'PAX-001') {
    const train = TRAINS.find(t => t.id === trainId) || TRAINS[0];
    const data = [];
    const now = new Date();

    for (let d = days - 1; d >= 0; d--) {
        const date = subDays(now, d);
        const seed = `${trainId}-${format(date, 'yyyy-MM-dd')}`;
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isRunningDay = seededRandom(seed + 'run') > 0.07;

        const tripsToday = isRunningDay ? (isWeekend ? 3 : 5) : 0;
        const route = ROUTES.find(r => r.id === train.route) || ROUTES[0];
        const kmDay = tripsToday * route.distanceKm * (0.9 + seededRandom(seed + 'km') * 0.2);

        const otpDay = isRunningDay ? Math.round(seededRandRange(seed + 'otp', 72, 98)) : 100;
        const delayAvg = isRunningDay ? parseFloat(seededRandRange(seed + 'delay', 0.5, 8.5).toFixed(1)) : 0;

        const occupancyDay = train.type === 'pasajeros'
            ? Math.round(seededRandRange(seed + 'occ', isWeekend ? 55 : 65, 95))
            : null;
        const tonsDay = train.type === 'carga'
            ? Math.round(seededRandRange(seed + 'tons', 1800, train.capacity * 0.95))
            : null;

        const fuelDay = train.traction === 'diesel' ? parseFloat((kmDay * 2.5).toFixed(1)) : 0;
        const kwhDay = train.traction === 'electrico' ? parseFloat((kmDay * 6.5).toFixed(1)) : 0;
        const co2Day = parseFloat((fuelDay * 2.68).toFixed(1));
        const regenDay = train.traction === 'electrico' ? parseFloat((kwhDay * 0.12).toFixed(1)) : 0;

        const incidentDay = seededRandom(seed + 'inc') < 0.08 ? 1 : 0;

        data.push({
            date: format(date, 'yyyy-MM-dd'),
            displayDate: format(date, 'dd/MM'),
            fullDate: format(date, 'dd MMM'),
            tripsCompleted: tripsToday,
            kmTraveled: parseFloat(kmDay.toFixed(1)),
            otp: otpDay,
            delayAvgMin: delayAvg,
            occupancyPct: occupancyDay,
            tonsTransported: tonsDay,
            fuelLiters: fuelDay,
            kwhConsumed: kwhDay,
            co2Kg: co2Day,
            regenKwh: regenDay,
            incidentCount: incidentDay,
            maintenanceFlag: seededRandom(seed + 'maint') < 0.05,
        });
    }
    return data;
}

// ─── HOURLY DATA (last 24h) ───────────────────────────────────────────────────

export function generateHourlyData(trainId = 'PAX-001') {
    const train = TRAINS.find(t => t.id === trainId) || TRAINS[0];
    const now = new Date();
    const data = [];

    for (let h = 23; h >= 0; h--) {
        const time = new Date(now);
        time.setHours(now.getHours() - h, 0, 0, 0);
        const hour = time.getHours();
        const isOperating = hour >= 5 && hour <= 23;
        const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20);

        const speed = isOperating ? Math.round(
            (isPeakHour ? 70 : 90) + Math.random() * 30
        ) : 0;
        const occupancy = isOperating && train.type === 'pasajeros'
            ? Math.round((isPeakHour ? 75 : 50) + Math.random() * 20)
            : null;
        const fuelRate = isOperating && train.traction === 'diesel'
            ? parseFloat((2.2 + Math.random() * 0.8).toFixed(2))
            : 0;
        const kwhRate = isOperating && train.traction === 'electrico'
            ? parseFloat((5.8 + Math.random() * 2).toFixed(2))
            : 0;
        const delayMin = isOperating ? Math.round(Math.max(0, Math.random() * 12 - 2)) : 0;

        data.push({
            time: format(time, 'HH:mm'),
            timestamp: time.toISOString(),
            hour,
            speed,
            occupancy,
            fuelRate,
            kwhRate,
            delayMin,
            isOperating,
            isPeakHour,
        });
    }
    return data;
}

// ─── MAINTENANCE ORDERS (CMMS) ────────────────────────────────────────────────

export function generateMaintenanceOrders() {
    const now = new Date();
    const orders = [
        { id: 'WO-2026-0142', assetId: 'PAX-003', type: 'PREVENTIVO',   priority: 'ALTA',  status: 'PENDIENTE',   component: 'Frenos — Pastillas (UIC 542)',         triggerType: 'KM',    triggerValue: 75000,  currentValue: 71500,  estimatedHours: 4,  depot: 'Taller Central Valencia',  scheduledDate: format(addMinutes(now, 4*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 25*24*60), 'yyyy-MM-dd'), remainingLifePct: 12, aiConfidencePct: 91 },
        { id: 'WO-2026-0143', assetId: 'FRE-004', type: 'CORRECTIVO',   priority: 'ALTA',  status: 'EN_CURSO',    component: 'Bogie — Rodamiento eje 3',            triggerType: 'COND',  triggerValue: null,   currentValue: null,   estimatedHours: 12, depot: 'Taller Maracaibo',         scheduledDate: format(now, 'yyyy-MM-dd'),                              aiPredictedFailureDate: format(now, 'yyyy-MM-dd'),                        remainingLifePct: 5,  aiConfidencePct: 97 },
        { id: 'WO-2026-0144', assetId: 'PAX-007', type: 'PREVENTIVO',   priority: 'MEDIA', status: 'PENDIENTE',   component: 'Pantógrafo — Deslizador carbono',     triggerType: 'KM',    triggerValue: 200000, currentValue: 189400, estimatedHours: 3,  depot: 'Taller Maracay',           scheduledDate: format(addMinutes(now, 9*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 45*24*60), 'yyyy-MM-dd'), remainingLifePct: 28, aiConfidencePct: 78 },
        { id: 'WO-2026-0145', assetId: 'PAX-001', type: 'PREVENTIVO',   priority: 'MEDIA', status: 'PENDIENTE',   component: 'Rodadas — Reprofilado de ruedas',     triggerType: 'KM',    triggerValue: 150000, currentValue: 142300, estimatedHours: 8,  depot: 'Caracas Central',          scheduledDate: format(addMinutes(now, 14*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 60*24*60), 'yyyy-MM-dd'), remainingLifePct: 35, aiConfidencePct: 72 },
        { id: 'WO-2026-0146', assetId: 'FRE-002', type: 'INSPECCION',   priority: 'BAJA',  status: 'PENDIENTE',   component: 'Inspección General M2 (UIC 534)',     triggerType: 'TIEMPO', triggerValue: null,  currentValue: null,   estimatedHours: 6,  depot: 'Taller Valencia Norte',    scheduledDate: format(addMinutes(now, 21*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: null,                                             remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0147', assetId: 'PAX-004', type: 'PREVENTIVO',   priority: 'MEDIA', status: 'COMPLETADO',  component: 'Sistema HVAC — Filtros y refrigerante', triggerType: 'TIEMPO', triggerValue: null,  currentValue: null,   estimatedHours: 5,  depot: 'Caracas Central',          scheduledDate: format(subDays(now, 3), 'yyyy-MM-dd'),          aiPredictedFailureDate: null,                                             remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0148', assetId: 'FRE-001', type: 'PREDICTIVO',   priority: 'ALTA',  status: 'PENDIENTE',   component: 'Motor de tracción — Temperatura anómala', triggerType: 'COND', triggerValue: null,  currentValue: null,   estimatedHours: 10, depot: 'Puerto Cabello',           scheduledDate: format(addMinutes(now, 2*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 8*24*60), 'yyyy-MM-dd'),  remainingLifePct: 8,  aiConfidencePct: 88 },
        { id: 'WO-2026-0149', assetId: 'PAX-002', type: 'PREVENTIVO',   priority: 'BAJA',  status: 'PENDIENTE',   component: 'Bogies — Lubricación general',        triggerType: 'KM',    triggerValue: 100000, currentValue: 98200,  estimatedHours: 2,  depot: 'Caracas Central',          scheduledDate: format(addMinutes(now, 28*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: null,                                             remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0150', assetId: 'PAX-006', type: 'PREVENTIVO',   priority: 'MEDIA', status: 'EN_CURSO',    component: 'Frenos — Calibración electrónica EBS', triggerType: 'TIEMPO', triggerValue: null,  currentValue: null,   estimatedHours: 3,  depot: 'Taller Valencia Norte',    scheduledDate: format(now, 'yyyy-MM-dd'),                      aiPredictedFailureDate: null,                                             remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0151', assetId: 'FRE-003', type: 'INSPECCION',   priority: 'BAJA',  status: 'COMPLETADO',  component: 'Inspección de acoples y mangueras',   triggerType: 'TIEMPO', triggerValue: null,  currentValue: null,   estimatedHours: 4,  depot: 'Barquisimeto',             scheduledDate: format(subDays(now, 5), 'yyyy-MM-dd'),          aiPredictedFailureDate: null,                                             remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0152', assetId: 'PAX-005', type: 'CORRECTIVO',   priority: 'MEDIA', status: 'COMPLETADO',  component: 'Puerta — Sensor de cierre 4B',        triggerType: 'COND',  triggerValue: null,   currentValue: null,   estimatedHours: 1,  depot: 'Taller Maracay',           scheduledDate: format(subDays(now, 1), 'yyyy-MM-dd'),          aiPredictedFailureDate: null,                                             remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0153', assetId: 'PAX-001', type: 'INSPECCION',   priority: 'BAJA',  status: 'PENDIENTE',   component: 'Revisión general M4 (500,000 km)',    triggerType: 'KM',    triggerValue: 500000, currentValue: 142300, estimatedHours: 48, depot: 'Taller Central Caracas',   scheduledDate: format(addMinutes(now, 180*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: null,                                            remainingLifePct: null, aiConfidencePct: null },
    ];
    return orders;
}

// ─── SAFETY INCIDENTS ─────────────────────────────────────────────────────────

export function generateIncidents() {
    const now = new Date();
    return [
        { id: 'INC-2026-0088', date: format(subDays(now, 2), 'yyyy-MM-dd HH:mm'), trainId: 'PAX-003', routeId: 'RT-003', type: 'RETRASO_MAYOR', severity: 'MAYOR', description: 'Retraso de 22 minutos por avería en señalización tramo Valencia-Güigüe', rootCause: 'Fallo equipo señalización', correctiveAction: 'Mantenimiento correctivo en señal 14-B', status: 'CERRADO' },
        { id: 'INC-2026-0087', date: format(subDays(now, 4), 'yyyy-MM-dd HH:mm'), trainId: 'FRE-004', routeId: 'RT-006', type: 'AVERIA',       severity: 'CRITICO', description: 'Fallo en rodamiento eje 3 detectado por vibración anómala durante servicio', rootCause: 'Fatiga de material (rodamiento)', correctiveAction: 'Tren retirado de servicio — WO-2026-0143 en curso', status: 'ABIERTO' },
        { id: 'INC-2026-0086', date: format(subDays(now, 7), 'yyyy-MM-dd HH:mm'), trainId: 'PAX-007', routeId: 'RT-002', type: 'RETRASO_MENOR', severity: 'MENOR',  description: 'Retraso de 8 min por ocupación elevada en andén Maracay', rootCause: 'Tiempo de estación excedido', correctiveAction: 'Ajuste de programación horaria', status: 'CERRADO' },
        { id: 'INC-2026-0085', date: format(subDays(now, 10), 'yyyy-MM-dd HH:mm'), trainId: 'FRE-001', routeId: 'RT-004', type: 'AVERIA',       severity: 'MAYOR',  description: 'Sobrecalentamiento detectado en motor de tracción unidad 1', rootCause: 'Temperatura del motor > 185°C', correctiveAction: 'Reemplazo de sensor y revisión de refrigeración', status: 'CERRADO' },
        { id: 'INC-2026-0084', date: format(subDays(now, 14), 'yyyy-MM-dd HH:mm'), trainId: 'PAX-001', routeId: 'RT-001', type: 'NEAR_MISS',    severity: 'MAYOR',  description: 'Aproximación a distancia de seguridad mínima en Antímano — protocolo de emergencia activado', rootCause: 'Error de señalización automática', correctiveAction: 'Revisión protocolo ATP — señal corregida', status: 'CERRADO' },
        { id: 'INC-2026-0083', date: format(subDays(now, 20), 'yyyy-MM-dd HH:mm'), trainId: 'PAX-005', routeId: 'RT-003', type: 'AVERIA',       severity: 'MENOR',  description: 'Sensor de puerta 4B con fallo intermitente — servicio continuó con puerta asegurada manualmente', rootCause: 'Desgaste de sensor de final de carrera', correctiveAction: 'Reemplazo de sensor WO-2026-0152', status: 'CERRADO' },
    ];
}

// ─── REAL-TIME ALERTS ─────────────────────────────────────────────────────────

export function generateAlerts(fleetType = 'todos') {
    const now = new Date();
    const allAlerts = [
        { id: 'ALT-001', time: format(addMinutes(now, -3),   'HH:mm'), type: 'MANTENIMIENTO', trainId: 'FRE-004', trainName: 'Maracaibo Exp.', message: 'WO-2026-0143 EN CURSO — Rodamiento eje 3 en reparación. Tren fuera de servicio.', priority: 'CRITICAL' },
        { id: 'ALT-002', time: format(addMinutes(now, -8),   'HH:mm'), type: 'PREDICTIVO',     trainId: 'FRE-001', trainName: 'Carga Norte',     message: 'IA PREDICTIVA: Temperatura motor de tracción +12°C sobre baseline. Fallo predicho en 8 días (confianza 88%).', priority: 'CRITICAL' },
        { id: 'ALT-003', time: format(addMinutes(now, -15),  'HH:mm'), type: 'RETRASO',        trainId: 'PAX-003', trainName: 'El Carabobo',    message: 'TR-4073 lleva 14 min de retraso en RT-003. OTP comprometido.', priority: 'WARNING' },
        { id: 'ALT-004', time: format(addMinutes(now, -22),  'HH:mm'), type: 'MANTENIMIENTO', trainId: 'PAX-003', trainName: 'El Carabobo',    message: 'Frenos (pastillas) a 12% de vida útil. OT WO-2026-0142 programada en 4 días.', priority: 'WARNING' },
        { id: 'ALT-005', time: format(addMinutes(now, -35),  'HH:mm'), type: 'OCUPACION',      trainId: 'PAX-001', trainName: 'El Libertador',  message: 'Ocupación PAX-001 al 97% en RT-001. Considerar refuerzo de frecuencia.', priority: 'INFO' },
        { id: 'ALT-006', time: format(addMinutes(now, -48),  'HH:mm'), type: 'ENERGIA',        trainId: 'PAX-007', trainName: 'Sucre Expreso',  message: 'Consumo energético PAX-007 un 18% por encima del parámetro de ruta. Revisar perfil de velocidad.', priority: 'WARNING' },
        { id: 'ALT-007', time: format(addMinutes(now, -62),  'HH:mm'), type: 'RETRASO',        trainId: 'PAX-006', trainName: 'F. Miranda',     message: 'TR-4076 retraso acumulado 7 min en RT-002 — tramo La Victoria.', priority: 'INFO' },
        { id: 'ALT-008', time: format(addMinutes(now, -90),  'HH:mm'), type: 'COMBUSTIBLE',    trainId: 'FRE-003', trainName: 'Carga Occidente', message: 'Nivel de combustible FRE-003 al 18%. Reabastecimiento en Barquisimeto recomendado.', priority: 'WARNING' },
        { id: 'ALT-009', time: format(addMinutes(now, -120), 'HH:mm'), type: 'INFO',           trainId: null,      trainName: null,             message: 'WO-2026-0152 completada. Sensor puerta PAX-005 reemplazado. Tren en servicio.', priority: 'INFO' },
        { id: 'ALT-010', time: format(addMinutes(now, -145), 'HH:mm'), type: 'MANTENIMIENTO', trainId: 'PAX-007', trainName: 'Sucre Expreso',  message: 'Pantógrafo PAX-007 a 28% de vida útil. Programar OT próximas 2 semanas.', priority: 'INFO' },
    ];

    if (fleetType === 'todos') return allAlerts;
    if (fleetType === 'pasajeros') return allAlerts.filter(a => !a.trainId || a.trainId.startsWith('PAX'));
    if (fleetType === 'carga') return allAlerts.filter(a => !a.trainId || a.trainId.startsWith('FRE'));
    return allAlerts;
}

// ─── ENERGY DATA (multi-day) ──────────────────────────────────────────────────

export function generateEnergyData(days = 30) {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
        const date = subDays(now, days - 1 - i);
        const seed = `energy-${format(date, 'yyyy-MM-dd')}`;
        const isWeekend = [0, 6].includes(date.getDay());
        const kwhElec = Math.round(seededRandRange(seed + 'kwh', isWeekend ? 8000 : 11000, isWeekend ? 13000 : 17000));
        const fuelDiesel = Math.round(seededRandRange(seed + 'fuel', isWeekend ? 1200 : 1800, isWeekend ? 2000 : 2800));
        return {
            date: format(date, 'yyyy-MM-dd'),
            displayDate: format(date, 'dd/MM'),
            kwhElectrico: kwhElec,
            litrosDiesel: fuelDiesel,
            co2Kg: Math.round(fuelDiesel * 2.68),
            kwhRegen: Math.round(kwhElec * 0.12),
            costEnergiaUSD: Math.round(kwhElec * 0.08 + fuelDiesel * 0.85),
            specifickWhKm: parseFloat((kwhElec / (kwhElec / 6.5)).toFixed(2)),
        };
    });
}

// ─── COMMERCIAL DATA ──────────────────────────────────────────────────────────

export function generateCommercialData(type = 'pasajeros', days = 30) {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
        const date = subDays(now, days - 1 - i);
        const seed = `comm-${type}-${format(date, 'yyyy-MM-dd')}`;
        const isWeekend = [0, 6].includes(date.getDay());

        if (type === 'pasajeros') {
            const pax = Math.round(seededRandRange(seed, isWeekend ? 3200 : 4800, isWeekend ? 5500 : 7200));
            const factorCarga = Math.round(seededRandRange(seed + 'fc', 60, 92));
            const ingresoPax = Math.round(pax * 1.5);
            return {
                date: format(date, 'yyyy-MM-dd'),
                displayDate: format(date, 'dd/MM'),
                pasajeros: pax,
                factorCarga,
                ingresoUSD: ingresoPax,
                costoOperUSD: Math.round(ingresoPax * seededRandRange(seed + 'cost', 0.7, 0.9)),
                paxKm: Math.round(pax * 85),
            };
        } else {
            const tons = Math.round(seededRandRange(seed, 2800, 5200));
            const tonKm = Math.round(tons * seededRandRange(seed + 'tkm', 80, 150));
            const ingreso = Math.round(tonKm * 0.04);
            return {
                date: format(date, 'yyyy-MM-dd'),
                displayDate: format(date, 'dd/MM'),
                toneladas: tons,
                tonKm,
                ingresoUSD: ingreso,
                costoOperUSD: Math.round(ingreso * seededRandRange(seed + 'cost', 0.65, 0.82)),
                entregasATiempo: Math.round(seededRandRange(seed + 'eta', 82, 97)),
                vagonVacioPct: Math.round(seededRandRange(seed + 'vv', 8, 22)),
            };
        }
    });
}

// ─── TRAIN SCHEDULE (for TrainGraph) ─────────────────────────────────────────

export function generateTrainSchedule(routeId = 'RT-001') {
    const route = ROUTES.find(r => r.id === routeId) || ROUTES[0];
    const services = [];
    const { start: startH, end: endH } = route.operatingHours;
    const freqMin = route.scheduledFreqMin || 60;
    const [sh, sm] = startH.split(':').map(Number);
    const [eh] = endH.split(':').map(Number);

    let serviceId = 1;
    const totalMins = route.distanceKm * 60 / route.maxSpeedKmh + route.stops.length * 2;

    for (let h = sh; h <= eh; h += 0) {
        const depMin = h * 60 + (serviceId === 1 ? sm : 0);
        if (depMin + totalMins > eh * 60) break;

        // Outbound
        const delayMin = Math.random() < 0.25 ? Math.round(Math.random() * 15) : 0;
        services.push({
            id: `SV-${String(serviceId).padStart(3,'0')}`,
            direction: 'IDA',
            departureMin: depMin + delayMin,
            arrivalMin: depMin + totalMins + delayMin,
            stops: route.stops.map((s, i) => ({
                ...s,
                plannedMin: depMin + i * (totalMins / (route.stops.length - 1)),
                actualMin: depMin + delayMin + i * (totalMins / (route.stops.length - 1)),
            })),
            delayMin,
            onTime: delayMin <= 3,
            trainId: route.id === 'RT-001' ? (serviceId % 2 === 0 ? 'PAX-001' : 'PAX-004') : `PAX-00${(serviceId % 5) + 1}`,
        });

        serviceId++;
        const nextMin = depMin + freqMin;
        h = Math.floor(nextMin / 60);
        if (nextMin >= eh * 60 + sm) break;
    }

    return { route, services, totalDistanceKm: route.distanceKm };
}

// ─── RAMS METRICS ─────────────────────────────────────────────────────────────

export function generateRAMSMetrics() {
    return TRAINS.map(train => {
        const mtbf = Math.round(1800 + seededRandom(train.id + 'mtbf') * 2000);
        const mttr = parseFloat((2 + seededRandom(train.id + 'mttr') * 4).toFixed(1));
        const availability = parseFloat(((mtbf / (mtbf + mttr)) * 100).toFixed(1));
        const failureRate = parseFloat((1 / mtbf * 1000).toFixed(3));
        const healthScore = Math.round(availability * 0.5 + (train.odometer < train.nextMaintKm * 0.9 ? 40 : 20) + Math.random() * 10);

        return {
            trainId: train.id,
            trainName: train.name,
            mtbf,
            mttr,
            availability,
            failureRate,
            healthScore: Math.min(100, healthScore),
            lastFailureDate: format(subDays(new Date(), Math.round(seededRandom(train.id + 'lf') * 60 + 5)), 'yyyy-MM-dd'),
            sil: train.type === 'pasajeros' ? 'SIL-2' : 'SIL-1',
        };
    });
}
