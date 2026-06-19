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

// ─── FLEET — AMÉRICAS ─────────────────────────────────────────────────────────

export const TRAINS = [
    // ── USA ──────────────────────────────────────────────────────────────────────
    { id: 'USA-001', callsign: 'AC-2151',  name: 'Acela 2151',           type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom',  model: 'Avelia Liberty',      yearBuilt: 2021, depot: 'New York Sunnyside',    capacity: 386,   maxSpeedKmh: 240, powerKw: 7200, weightTons: 610, lengthM: 316, axleCount: 32, odometer: 142300,  nextMaintKm: 150000,  route: 'RT-001', lat: 40.7505,  lng: -73.9934  },
    { id: 'USA-002', callsign: 'NER-173',  name: 'NE Regional 173',      type: 'pasajeros', traction: 'electrico', manufacturer: 'Siemens', model: 'ACS-64 Sprinter',     yearBuilt: 2014, depot: 'Boston Southampton',    capacity: 304,   maxSpeedKmh: 200, powerKw: 6400, weightTons: 90,  lengthM: 201, axleCount: 16, odometer: 298200,  nextMaintKm: 300000,  route: 'RT-001', lat: 41.8297,  lng: -71.4196  },
    { id: 'USA-003', callsign: 'AC-2153',  name: 'Acela 2153',           type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom',  model: 'Avelia Liberty',      yearBuilt: 2022, depot: 'New York Sunnyside',    capacity: 386,   maxSpeedKmh: 240, powerKw: 7200, weightTons: 610, lengthM: 316, axleCount: 32, odometer: 89400,   nextMaintKm: 100000,  route: 'RT-001', lat: 39.9556,  lng: -75.1826  },
    { id: 'USA-004', callsign: 'CS-011',   name: 'Coast Starlight 11',   type: 'pasajeros', traction: 'diesel',    manufacturer: 'GE',      model: 'Genesis P42DC',       yearBuilt: 2001, depot: 'Los Angeles Union',     capacity: 526,   maxSpeedKmh: 177, powerKw: 3130, weightTons: 130, lengthM: 281, axleCount: 12, odometer: 876500,  nextMaintKm: 900000,  route: 'RT-002', lat: 38.5816,  lng: -121.4944 },
    { id: 'USA-005', callsign: 'CS-014',   name: 'Coast Starlight 14',   type: 'pasajeros', traction: 'diesel',    manufacturer: 'GE',      model: 'Genesis P42DC',       yearBuilt: 2001, depot: 'Seattle King Street',   capacity: 526,   maxSpeedKmh: 177, powerKw: 3130, weightTons: 130, lengthM: 281, axleCount: 12, odometer: 921300,  nextMaintKm: 950000,  route: 'RT-002', lat: 35.2825,  lng: -120.6596 },
    // ── CANADA ───────────────────────────────────────────────────────────────────
    { id: 'CAN-001', callsign: 'VC-060',   name: 'VIA Corridor 60',      type: 'pasajeros', traction: 'diesel',    manufacturer: 'Siemens', model: 'Venture SC-44',       yearBuilt: 2019, depot: 'Toronto Maintenance',   capacity: 300,   maxSpeedKmh: 200, powerKw: 4400, weightTons: 116, lengthM: 165, axleCount: 8,  odometer: 187400,  nextMaintKm: 200000,  route: 'RT-003', lat: 43.6453,  lng: -79.3806  },
    { id: 'CAN-002', callsign: 'VC-035',   name: 'VIA Corridor 35',      type: 'pasajeros', traction: 'diesel',    manufacturer: 'Siemens', model: 'Venture SC-44',       yearBuilt: 2020, depot: 'Montréal Pointe-Saint', capacity: 300,   maxSpeedKmh: 200, powerKw: 4400, weightTons: 116, lengthM: 165, axleCount: 8,  odometer: 162100,  nextMaintKm: 200000,  route: 'RT-003', lat: 45.4972,  lng: -73.5615  },
    { id: 'CAN-003', callsign: 'VC-001',   name: 'The Canadian 1',       type: 'pasajeros', traction: 'diesel',    manufacturer: 'GE',      model: 'Genesis P42DC',       yearBuilt: 2004, depot: 'Toronto Maintenance',   capacity: 358,   maxSpeedKmh: 160, powerKw: 3130, weightTons: 130, lengthM: 354, axleCount: 16, odometer: 542100,  nextMaintKm: 600000,  route: 'RT-004', lat: 49.8944,  lng: -97.1381  },
    { id: 'CAN-004', callsign: 'VC-002',   name: 'The Canadian 2',       type: 'pasajeros', traction: 'diesel',    manufacturer: 'GE',      model: 'Genesis P42DC',       yearBuilt: 2004, depot: 'Vancouver Pacific',     capacity: 358,   maxSpeedKmh: 160, powerKw: 3130, weightTons: 130, lengthM: 354, axleCount: 16, odometer: 518700,  nextMaintKm: 600000,  route: 'RT-004', lat: 53.5461,  lng: -113.4938 },
    // ── MÉXICO ───────────────────────────────────────────────────────────────────
    { id: 'MEX-001', callsign: 'TM-01',    name: 'Tren Maya TM-01',      type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom',  model: 'Coradia Stream',      yearBuilt: 2023, depot: 'Cancún Technoparque',   capacity: 812,   maxSpeedKmh: 160, powerKw: 6000, weightTons: 350, lengthM: 208, axleCount: 20, odometer: 42100,   nextMaintKm: 100000,  route: 'RT-005', lat: 21.0467,  lng: -86.9423  },
    { id: 'MEX-002', callsign: 'TM-03',    name: 'Tren Maya TM-03',      type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom',  model: 'Coradia Stream',      yearBuilt: 2023, depot: 'Mérida Technoparque',   capacity: 812,   maxSpeedKmh: 160, powerKw: 6000, weightTons: 350, lengthM: 208, axleCount: 20, odometer: 38700,   nextMaintKm: 100000,  route: 'RT-005', lat: 20.9674,  lng: -89.5926  },
    { id: 'MEX-003', callsign: 'TM-05',    name: 'Tren Maya TM-05',      type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom',  model: 'Coradia Stream',      yearBuilt: 2024, depot: 'Campeche Technoparque',  capacity: 812,   maxSpeedKmh: 160, powerKw: 6000, weightTons: 350, lengthM: 208, axleCount: 20, odometer: 21400,   nextMaintKm: 100000,  route: 'RT-005', lat: 19.8301,  lng: -90.5349  },
    // ── PANAMÁ ───────────────────────────────────────────────────────────────────
    { id: 'PAN-001', callsign: 'PCR-101',  name: 'Panama Canal Express', type: 'mixto',     traction: 'diesel',    manufacturer: 'GE',      model: 'C30-7',               yearBuilt: 2001, depot: 'Panamá Miraflores',     capacity: 480,   maxSpeedKmh: 80,  powerKw: 2240, weightTons: 120, lengthM: 85,  axleCount: 12, odometer: 312800,  nextMaintKm: 350000,  route: 'RT-006', lat:  9.1184,  lng: -79.6984  },
    // ── COLOMBIA ─────────────────────────────────────────────────────────────────
    { id: 'COL-001', callsign: 'FCN-501',  name: 'Ferrocarril Norte 1',  type: 'carga',     traction: 'diesel',    manufacturer: 'GE',      model: 'ES44AC',              yearBuilt: 2012, depot: 'Bogotá Sabana',         capacity: 4200,  maxSpeedKmh: 80,  powerKw: 3280, weightTons: 196, lengthM: 22,  axleCount: 6,  odometer: 487300,  nextMaintKm: 500000,  route: 'RT-007', lat:  5.2005,  lng: -74.7394  },
    { id: 'COL-002', callsign: 'FCN-502',  name: 'Ferrocarril Norte 2',  type: 'carga',     traction: 'diesel',    manufacturer: 'GE',      model: 'ES44AC',              yearBuilt: 2012, depot: 'Santa Marta Terminal',  capacity: 4200,  maxSpeedKmh: 80,  powerKw: 3280, weightTons: 196, lengthM: 22,  axleCount: 6,  odometer: 512100,  nextMaintKm: 600000,  route: 'RT-007', lat: 10.9685,  lng: -74.7813  },
    // ── VENEZUELA ────────────────────────────────────────────────────────────────
    { id: 'VEN-001', callsign: 'VF-4071',  name: 'El Libertador',        type: 'pasajeros', traction: 'electrico', manufacturer: 'Alstom',  model: 'Coradia Continental', yearBuilt: 2018, depot: 'Caracas Central',       capacity: 320,   maxSpeedKmh: 160, powerKw: 3200, weightTons: 285, lengthM: 160, axleCount: 16, odometer: 142300,  nextMaintKm: 150000,  route: 'RT-008', lat: 10.4806,  lng: -66.9036  },
    { id: 'VEN-002', callsign: 'VF-4072',  name: 'Simón Bolívar',        type: 'pasajeros', traction: 'electrico', manufacturer: 'CAF',     model: 'Urbos 3',             yearBuilt: 2020, depot: 'Maracay Central',       capacity: 280,   maxSpeedKmh: 140, powerKw: 2800, weightTons: 230, lengthM: 145, axleCount: 14, odometer: 98200,   nextMaintKm: 100000,  route: 'RT-008', lat: 10.2469,  lng: -67.5938  },
    // ── ECUADOR ──────────────────────────────────────────────────────────────────
    { id: 'ECU-001', callsign: 'TE-001',   name: 'Tren Ecuador Norte',   type: 'pasajeros', traction: 'diesel',    manufacturer: 'CAF',     model: 'Coche Motor',         yearBuilt: 2013, depot: 'Quito Chimbacalle',     capacity: 180,   maxSpeedKmh: 80,  powerKw: 640,  weightTons: 58,  lengthM: 72,  axleCount: 8,  odometer: 187600,  nextMaintKm: 200000,  route: 'RT-009', lat: -1.6635,  lng: -78.6536  },
    { id: 'ECU-002', callsign: 'TE-002',   name: 'Tren Ecuador Sur',     type: 'pasajeros', traction: 'diesel',    manufacturer: 'CAF',     model: 'Coche Motor',         yearBuilt: 2014, depot: 'Guayaquil Durán',       capacity: 180,   maxSpeedKmh: 80,  powerKw: 640,  weightTons: 58,  lengthM: 72,  axleCount: 8,  odometer: 201400,  nextMaintKm: 250000,  route: 'RT-009', lat: -1.2543,  lng: -78.6244  },
    // ── PERÚ ─────────────────────────────────────────────────────────────────────
    { id: 'PER-001', callsign: 'FS-001',   name: 'Andean Explorer',      type: 'pasajeros', traction: 'diesel',    manufacturer: 'GE',      model: 'Genesis P42DC',       yearBuilt: 1998, depot: 'Cusco Wanchaq',         capacity: 84,    maxSpeedKmh: 90,  powerKw: 3130, weightTons: 130, lengthM: 120, axleCount: 8,  odometer: 634200,  nextMaintKm: 650000,  route: 'RT-010', lat: -15.4899, lng: -70.1322  },
    { id: 'PER-002', callsign: 'FS-002',   name: 'Titicaca Train',       type: 'pasajeros', traction: 'diesel',    manufacturer: 'EMD',     model: 'GT22CW-2',            yearBuilt: 1995, depot: 'Puno Terminal',          capacity: 168,   maxSpeedKmh: 90,  powerKw: 1340, weightTons: 80,  lengthM: 90,  axleCount: 6,  odometer: 712400,  nextMaintKm: 750000,  route: 'RT-010', lat: -13.5319, lng: -71.9675  },
    // ── BOLIVIA ──────────────────────────────────────────────────────────────────
    { id: 'BOL-001', callsign: 'ROB-201',  name: 'Wara Wara del Sur',    type: 'pasajeros', traction: 'diesel',    manufacturer: 'CAF',     model: 'Autoexpreso',         yearBuilt: 2006, depot: 'Oruro Terminal',         capacity: 256,   maxSpeedKmh: 70,  powerKw: 1120, weightTons: 96,  lengthM: 105, axleCount: 8,  odometer: 428700,  nextMaintKm: 500000,  route: 'RT-011', lat: -17.9640, lng: -67.1099  },
    // ── CHILE ────────────────────────────────────────────────────────────────────
    { id: 'CHI-001', callsign: 'EFE-101',  name: 'Biotren Rancagua',     type: 'pasajeros', traction: 'electrico', manufacturer: 'CAF',     model: 'Civia',               yearBuilt: 2009, depot: 'Santiago Alameda',      capacity: 428,   maxSpeedKmh: 160, powerKw: 2400, weightTons: 180, lengthM: 120, axleCount: 16, odometer: 387600,  nextMaintKm: 400000,  route: 'RT-012', lat: -34.1701, lng: -70.7482  },
    { id: 'CHI-002', callsign: 'EFE-102',  name: 'Biotren Talca',        type: 'pasajeros', traction: 'electrico', manufacturer: 'CAF',     model: 'Civia',               yearBuilt: 2010, depot: 'Chillán Terminal',       capacity: 428,   maxSpeedKmh: 160, powerKw: 2400, weightTons: 180, lengthM: 120, axleCount: 16, odometer: 354100,  nextMaintKm: 400000,  route: 'RT-012', lat: -35.4254, lng: -71.6719  },
    // ── ARGENTINA ────────────────────────────────────────────────────────────────
    { id: 'ARG-001', callsign: 'TAR-001',  name: 'Mar del Plata Exp. 1', type: 'pasajeros', traction: 'diesel',    manufacturer: 'EMD',     model: 'GT22CW-2',            yearBuilt: 2000, depot: 'Bs.As. Constitución',   capacity: 440,   maxSpeedKmh: 130, powerKw: 1340, weightTons: 88,  lengthM: 180, axleCount: 8,  odometer: 621300,  nextMaintKm: 650000,  route: 'RT-013', lat: -34.9206, lng: -57.9546  },
    { id: 'ARG-002', callsign: 'TAR-002',  name: 'Mar del Plata Exp. 2', type: 'pasajeros', traction: 'diesel',    manufacturer: 'EMD',     model: 'GT22CW-2',            yearBuilt: 2001, depot: 'Mar del Plata',         capacity: 440,   maxSpeedKmh: 130, powerKw: 1340, weightTons: 88,  lengthM: 180, axleCount: 8,  odometer: 587900,  nextMaintKm: 650000,  route: 'RT-013', lat: -36.3129, lng: -57.6729  },
    // ── URUGUAY ──────────────────────────────────────────────────────────────────
    { id: 'URU-001', callsign: 'AFE-101',  name: 'Tren de la Madera',    type: 'carga',     traction: 'diesel',    manufacturer: 'EMD',     model: 'GP18',                yearBuilt: 1990, depot: 'Montevideo La Paloma',  capacity: 2400,  maxSpeedKmh: 70,  powerKw: 1340, weightTons: 82,  lengthM: 18,  axleCount: 4,  odometer: 892400,  nextMaintKm: 900000,  route: 'RT-014', lat: -33.3793, lng: -56.5260  },
    // ── BRASIL ───────────────────────────────────────────────────────────────────
    { id: 'BRZ-001', callsign: 'EFC-2001', name: 'Carajás 2001',         type: 'carga',     traction: 'diesel',    manufacturer: 'GE',      model: 'ES44AC',              yearBuilt: 2010, depot: 'São Luís Terminal',     capacity: 28000, maxSpeedKmh: 80,  powerKw: 3280, weightTons: 210, lengthM: 22,  axleCount: 6,  odometer: 712400,  nextMaintKm: 750000,  route: 'RT-015', lat: -4.9508,  lng: -47.5034  },
    { id: 'BRZ-002', callsign: 'EFC-2002', name: 'Carajás 2002',         type: 'carga',     traction: 'diesel',    manufacturer: 'GE',      model: 'ES44AC',              yearBuilt: 2011, depot: 'Parauapebas CVRD',     capacity: 28000, maxSpeedKmh: 80,  powerKw: 3280, weightTons: 210, lengthM: 22,  axleCount: 6,  odometer: 681300,  nextMaintKm: 700000,  route: 'RT-015', lat: -5.3708,  lng: -49.1178  },
    { id: 'BRZ-003', callsign: 'EFC-2003', name: 'Carajás 2003',         type: 'carga',     traction: 'diesel',    manufacturer: 'GE',      model: 'ES44C4',              yearBuilt: 2015, depot: 'São Luís Terminal',     capacity: 30000, maxSpeedKmh: 80,  powerKw: 3280, weightTons: 210, lengthM: 22,  axleCount: 6,  odometer: 489200,  nextMaintKm: 500000,  route: 'RT-015', lat: -2.5297,  lng: -44.3028  },
    { id: 'BRZ-004', callsign: 'RMP-101',  name: 'Rumo Santos 101',      type: 'carga',     traction: 'diesel',    manufacturer: 'EMD',     model: 'SD40-2',              yearBuilt: 1988, depot: 'Santos Porto',          capacity: 3200,  maxSpeedKmh: 90,  powerKw: 2240, weightTons: 178, lengthM: 21,  axleCount: 6,  odometer: 1243800, nextMaintKm: 1300000, route: 'RT-016', lat: -23.5489, lng: -46.6262  },
    { id: 'BRZ-005', callsign: 'RMP-102',  name: 'Rumo Campinas 102',    type: 'carga',     traction: 'diesel',    manufacturer: 'EMD',     model: 'SD40-2',              yearBuilt: 1989, depot: 'Campinas Terminal',      capacity: 3200,  maxSpeedKmh: 90,  powerKw: 2240, weightTons: 178, lengthM: 21,  axleCount: 6,  odometer: 1187600, nextMaintKm: 1200000, route: 'RT-016', lat: -23.1862, lng: -46.8844  },
];

export const ROUTES = [
    // ─── USA ──────────────────────────────────────────────────────────────────────
    { id: 'RT-001', name: 'Amtrak Northeast Corridor', distanceKm: 735,  maxSpeedKmh: 240, type: 'pasajeros', scheduledFreqMin: 30,   operatingHours: { start: '05:00', end: '23:00' }, stops: [
        { id: 'NEC-001', name: 'Boston South',    km: 0,    lat: 42.3519, lng: -71.0552 },
        { id: 'NEC-002', name: 'Providence',      km: 68,   lat: 41.8297, lng: -71.4196 },
        { id: 'NEC-003', name: 'New Haven',       km: 229,  lat: 41.2983, lng: -72.9250 },
        { id: 'NEC-004', name: 'New York Penn',   km: 354,  lat: 40.7505, lng: -73.9934 },
        { id: 'NEC-005', name: 'Philadelphia',    km: 505,  lat: 39.9556, lng: -75.1826 },
        { id: 'NEC-006', name: 'Baltimore',       km: 617,  lat: 39.2956, lng: -76.6140 },
        { id: 'NEC-007', name: 'Washington DC',   km: 735,  lat: 38.8971, lng: -77.0062 },
    ]},
    { id: 'RT-002', name: 'Amtrak Coast Starlight',    distanceKm: 2226, maxSpeedKmh: 130, type: 'pasajeros', scheduledFreqMin: 1440, operatingHours: { start: '09:00', end: '19:00' }, stops: [
        { id: 'CS-001', name: 'Los Angeles',     km: 0,    lat: 34.0556, lng: -118.2357 },
        { id: 'CS-002', name: 'Santa Barbara',   km: 153,  lat: 34.4208, lng: -119.6982 },
        { id: 'CS-003', name: 'San Luis Obispo', km: 363,  lat: 35.2825, lng: -120.6596 },
        { id: 'CS-004', name: 'Oakland',         km: 690,  lat: 37.8321, lng: -122.2836 },
        { id: 'CS-005', name: 'Sacramento',      km: 758,  lat: 38.5816, lng: -121.4944 },
        { id: 'CS-006', name: 'Portland',        km: 1430, lat: 45.5231, lng: -122.6765 },
        { id: 'CS-007', name: 'Seattle',         km: 1605, lat: 47.5990, lng: -122.3303 },
    ]},
    // ─── CANADA ───────────────────────────────────────────────────────────────────
    { id: 'RT-003', name: 'VIA Rail Corridor',         distanceKm: 1097, maxSpeedKmh: 200, type: 'pasajeros', scheduledFreqMin: 120,  operatingHours: { start: '06:00', end: '22:00' }, stops: [
        { id: 'VIA-001', name: 'Windsor',        km: 0,    lat: 42.3149, lng: -83.0364 },
        { id: 'VIA-002', name: 'London ON',      km: 185,  lat: 42.9849, lng: -81.2453 },
        { id: 'VIA-003', name: 'Toronto',        km: 370,  lat: 43.6453, lng: -79.3806 },
        { id: 'VIA-004', name: 'Ottawa',         km: 700,  lat: 45.4215, lng: -75.6972 },
        { id: 'VIA-005', name: 'Montréal',       km: 870,  lat: 45.4972, lng: -73.5615 },
        { id: 'VIA-006', name: 'Québec',         km: 1097, lat: 46.8123, lng: -71.2128 },
    ]},
    { id: 'RT-004', name: 'VIA Rail The Canadian',     distanceKm: 4466, maxSpeedKmh: 100, type: 'pasajeros', scheduledFreqMin: 2880, operatingHours: { start: '12:00', end: '14:00' }, stops: [
        { id: 'CAN-001', name: 'Toronto',        km: 0,    lat: 43.6453, lng: -79.3806 },
        { id: 'CAN-002', name: 'Sudbury',        km: 400,  lat: 46.4908, lng: -80.9909 },
        { id: 'CAN-003', name: 'Winnipeg',       km: 1963, lat: 49.8944, lng: -97.1381 },
        { id: 'CAN-004', name: 'Saskatoon',      km: 2600, lat: 52.1153, lng: -106.6682 },
        { id: 'CAN-005', name: 'Edmonton',       km: 3180, lat: 53.5461, lng: -113.4938 },
        { id: 'CAN-006', name: 'Jasper',         km: 3647, lat: 52.8737, lng: -118.0814 },
        { id: 'CAN-007', name: 'Vancouver',      km: 4466, lat: 49.2800, lng: -123.1076 },
    ]},
    // ─── MÉXICO ───────────────────────────────────────────────────────────────────
    { id: 'RT-005', name: 'Tren Maya',                 distanceKm: 1554, maxSpeedKmh: 160, type: 'pasajeros', scheduledFreqMin: 60,   operatingHours: { start: '06:00', end: '20:00' }, stops: [
        { id: 'TM-001', name: 'Cancún',          km: 0,    lat: 21.0467, lng: -86.9423 },
        { id: 'TM-002', name: 'Playa del Carmen',km: 68,   lat: 20.6296, lng: -87.0739 },
        { id: 'TM-003', name: 'Tulum',           km: 130,  lat: 20.2114, lng: -87.4654 },
        { id: 'TM-004', name: 'Chetumal',        km: 380,  lat: 18.5072, lng: -88.2962 },
        { id: 'TM-005', name: 'Escárcega',       km: 680,  lat: 18.6128, lng: -90.7373 },
        { id: 'TM-006', name: 'Campeche',        km: 830,  lat: 19.8301, lng: -90.5349 },
        { id: 'TM-007', name: 'Mérida',          km: 970,  lat: 20.9674, lng: -89.5926 },
        { id: 'TM-008', name: 'Valladolid',      km: 1150, lat: 20.6892, lng: -88.2006 },
        { id: 'TM-009', name: 'Palenque',        km: 1554, lat: 17.5226, lng: -91.9824 },
    ]},
    // ─── PANAMÁ ───────────────────────────────────────────────────────────────────
    { id: 'RT-006', name: 'Panama Canal Railway',      distanceKm: 77,   maxSpeedKmh: 80,  type: 'mixto',     scheduledFreqMin: 240,  operatingHours: { start: '07:00', end: '17:00' }, stops: [
        { id: 'PAN-001', name: 'Panamá City',    km: 0,  lat:  8.9936, lng: -79.5197 },
        { id: 'PAN-002', name: 'Gamboa',         km: 32, lat:  9.1184, lng: -79.6984 },
        { id: 'PAN-003', name: 'Colón',          km: 77, lat:  9.3547, lng: -79.9003 },
    ]},
    // ─── COLOMBIA ─────────────────────────────────────────────────────────────────
    { id: 'RT-007', name: 'Red Férrea Colombia',       distanceKm: 950,  maxSpeedKmh: 80,  type: 'carga',     scheduledFreqMin: 240,  operatingHours: { start: '06:00', end: '20:00' }, stops: [
        { id: 'COL-001', name: 'Bogotá Sabana',  km: 0,   lat:  4.6097, lng: -74.0817 },
        { id: 'COL-002', name: 'Honda',          km: 145, lat:  5.2005, lng: -74.7394 },
        { id: 'COL-003', name: 'La Dorada',      km: 195, lat:  5.4505, lng: -74.6730 },
        { id: 'COL-004', name: 'Barrancabermeja',km: 420, lat:  7.0652, lng: -73.8540 },
        { id: 'COL-005', name: 'Barranquilla',   km: 850, lat: 10.9685, lng: -74.7813 },
        { id: 'COL-006', name: 'Santa Marta',    km: 950, lat: 11.2408, lng: -74.1990 },
    ]},
    // ─── VENEZUELA ────────────────────────────────────────────────────────────────
    { id: 'RT-008', name: 'Ferroviaria Venezuela',     distanceKm: 170,  maxSpeedKmh: 160, type: 'pasajeros', scheduledFreqMin: 60,   operatingHours: { start: '06:00', end: '22:00' }, stops: [
        { id: 'VEN-001', name: 'Caracas Central',km: 0,   lat: 10.4806, lng: -66.9036 },
        { id: 'VEN-002', name: 'La Victoria',    km: 65,  lat: 10.2289, lng: -67.3320 },
        { id: 'VEN-003', name: 'Maracay',        km: 99,  lat: 10.2469, lng: -67.5938 },
        { id: 'VEN-004', name: 'Valencia',       km: 170, lat: 10.1800, lng: -67.9900 },
    ]},
    // ─── ECUADOR ──────────────────────────────────────────────────────────────────
    { id: 'RT-009', name: 'Tren Ecuador (Quito–Durán)',distanceKm: 447,  maxSpeedKmh: 80,  type: 'pasajeros', scheduledFreqMin: 120,  operatingHours: { start: '08:00', end: '18:00' }, stops: [
        { id: 'ECU-001', name: 'Quito Chimbacalle',km: 0,  lat: -0.2295, lng: -78.5243 },
        { id: 'ECU-002', name: 'Latacunga',      km: 93,  lat: -0.9316, lng: -78.6158 },
        { id: 'ECU-003', name: 'Ambato',         km: 132, lat: -1.2543, lng: -78.6244 },
        { id: 'ECU-004', name: 'Riobamba',       km: 185, lat: -1.6635, lng: -78.6536 },
        { id: 'ECU-005', name: 'Bucay',          km: 292, lat: -2.1890, lng: -79.1097 },
        { id: 'ECU-006', name: 'Milagro',        km: 372, lat: -2.1343, lng: -79.5880 },
        { id: 'ECU-007', name: 'Guayaquil Durán',km: 447, lat: -2.1710, lng: -79.8294 },
    ]},
    // ─── PERÚ ─────────────────────────────────────────────────────────────────────
    { id: 'RT-010', name: 'Ferrocarril del Sur (Perú)',distanceKm: 335,  maxSpeedKmh: 90,  type: 'pasajeros', scheduledFreqMin: 480,  operatingHours: { start: '07:00', end: '16:00' }, stops: [
        { id: 'PER-001', name: 'Cusco Wanchaq',  km: 0,   lat: -13.5319, lng: -71.9675 },
        { id: 'PER-002', name: 'Sicuani',        km: 137, lat: -14.2597, lng: -71.2275 },
        { id: 'PER-003', name: 'Juliaca',        km: 245, lat: -15.4899, lng: -70.1322 },
        { id: 'PER-004', name: 'Puno',           km: 280, lat: -15.8402, lng: -70.0214 },
        { id: 'PER-005', name: 'Arequipa',       km: 335, lat: -16.3988, lng: -71.5350 },
    ]},
    // ─── BOLIVIA ──────────────────────────────────────────────────────────────────
    { id: 'RT-011', name: 'Red Occidental Bolivia',    distanceKm: 730,  maxSpeedKmh: 70,  type: 'mixto',     scheduledFreqMin: 480,  operatingHours: { start: '08:00', end: '18:00' }, stops: [
        { id: 'BOL-001', name: 'El Alto (La Paz)',km: 0,   lat: -16.5211, lng: -68.1731 },
        { id: 'BOL-002', name: 'Oruro',          km: 228, lat: -17.9640, lng: -67.1099 },
        { id: 'BOL-003', name: 'Uyuni',          km: 493, lat: -20.4614, lng: -66.8307 },
        { id: 'BOL-004', name: 'Villazón',       km: 730, lat: -22.0875, lng: -65.5936 },
    ]},
    // ─── CHILE ────────────────────────────────────────────────────────────────────
    { id: 'RT-012', name: 'EFE Tren Central Chile',   distanceKm: 395,  maxSpeedKmh: 160, type: 'pasajeros', scheduledFreqMin: 60,   operatingHours: { start: '06:00', end: '22:00' }, stops: [
        { id: 'CHI-001', name: 'Santiago Alameda',km: 0,  lat: -33.4617, lng: -70.6783 },
        { id: 'CHI-002', name: 'Rancagua',       km: 87,  lat: -34.1701, lng: -70.7482 },
        { id: 'CHI-003', name: 'San Fernando',   km: 145, lat: -34.5875, lng: -70.9774 },
        { id: 'CHI-004', name: 'Talca',          km: 256, lat: -35.4254, lng: -71.6719 },
        { id: 'CHI-005', name: 'Linares',        km: 308, lat: -35.8477, lng: -71.5970 },
        { id: 'CHI-006', name: 'Chillán',        km: 395, lat: -36.6067, lng: -72.1035 },
    ]},
    // ─── ARGENTINA ────────────────────────────────────────────────────────────────
    { id: 'RT-013', name: 'Trenes Argentinos BA–MdP', distanceKm: 404,  maxSpeedKmh: 130, type: 'pasajeros', scheduledFreqMin: 120,  operatingHours: { start: '07:00', end: '19:00' }, stops: [
        { id: 'ARG-001', name: 'Bs.As. Constitución',km: 0, lat: -34.6278, lng: -58.3793 },
        { id: 'ARG-002', name: 'La Plata',       km: 56,  lat: -34.9206, lng: -57.9546 },
        { id: 'ARG-003', name: 'Dolores',        km: 224, lat: -36.3129, lng: -57.6729 },
        { id: 'ARG-004', name: 'Mar del Plata',  km: 404, lat: -38.0023, lng: -57.5575 },
    ]},
    // ─── URUGUAY ──────────────────────────────────────────────────────────────────
    { id: 'RT-014', name: 'AFE Uruguay (Mdeo–Rivera)', distanceKm: 502, maxSpeedKmh: 70,  type: 'carga',     scheduledFreqMin: 480,  operatingHours: { start: '07:00', end: '17:00' }, stops: [
        { id: 'URU-001', name: 'Montevideo',     km: 0,   lat: -34.9011, lng: -56.1915 },
        { id: 'URU-002', name: 'Florida',        km: 98,  lat: -34.0976, lng: -56.2159 },
        { id: 'URU-003', name: 'Durazno',        km: 181, lat: -33.3793, lng: -56.5260 },
        { id: 'URU-004', name: 'Tacuarembó',     km: 350, lat: -31.7246, lng: -55.9822 },
        { id: 'URU-005', name: 'Rivera',         km: 502, lat: -30.9047, lng: -55.5500 },
    ]},
    // ─── BRASIL ───────────────────────────────────────────────────────────────────
    { id: 'RT-015', name: 'VALE EFC Carajás',          distanceKm: 892,  maxSpeedKmh: 80,  type: 'carga',     scheduledFreqMin: 180,  operatingHours: { start: '00:00', end: '23:00' }, stops: [
        { id: 'EFC-001', name: 'São Luís',       km: 0,   lat: -2.5297, lng: -44.3028 },
        { id: 'EFC-002', name: 'Açailândia',     km: 314, lat: -4.9508, lng: -47.5034 },
        { id: 'EFC-003', name: 'Marabá',         km: 549, lat: -5.3708, lng: -49.1178 },
        { id: 'EFC-004', name: 'Parauapebas',    km: 892, lat: -6.0650, lng: -49.9056 },
    ]},
    { id: 'RT-016', name: 'Rumo Malha Paulista',       distanceKm: 252,  maxSpeedKmh: 90,  type: 'carga',     scheduledFreqMin: 90,   operatingHours: { start: '05:00', end: '22:00' }, stops: [
        { id: 'RMP-001', name: 'Santos',         km: 0,   lat: -23.9535, lng: -46.3317 },
        { id: 'RMP-002', name: 'São Paulo',      km: 72,  lat: -23.5489, lng: -46.6262 },
        { id: 'RMP-003', name: 'Jundiaí',        km: 153, lat: -23.1862, lng: -46.8844 },
        { id: 'RMP-004', name: 'Campinas',       km: 252, lat: -22.9056, lng: -47.0608 },
    ]},
];

// Deterministic pseudo-random — MurmurHash3 finalizer, pure integer arithmetic
// Math.sin removed: V8 TurboFan called libm sin() which used AVX2 on Linux → SIGILL
function seededRandom(seed) {
    let h = 0x811c9dc5 | 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
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

export function generateHistoricalData(days = 30, trainId = 'USA-001') {
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

export function generateHourlyData(trainId = 'USA-001') {
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
        { id: 'WO-2026-0142', assetId: 'MEX-001', type: 'PREVENTIVO',  priority: 'ALTA',  status: 'PENDIENTE',  component: 'Frenos — Pastillas (UIC 542)',            triggerType: 'KM',     triggerValue: 50000,   currentValue: 42100,  estimatedHours: 4,  depot: 'Cancún Technoparque',    scheduledDate: format(addMinutes(now, 4*24*60),   'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 25*24*60),  'yyyy-MM-dd'), remainingLifePct: 16,  aiConfidencePct: 91 },
        { id: 'WO-2026-0143', assetId: 'BRZ-001', type: 'CORRECTIVO',  priority: 'ALTA',  status: 'EN_CURSO',   component: 'Bogie — Rodamiento eje 3',               triggerType: 'COND',   triggerValue: null,    currentValue: null,   estimatedHours: 12, depot: 'São Luís Terminal',      scheduledDate: format(now,                         'yyyy-MM-dd'), aiPredictedFailureDate: format(now,                        'yyyy-MM-dd'), remainingLifePct: 5,   aiConfidencePct: 97 },
        { id: 'WO-2026-0144', assetId: 'USA-001', type: 'PREVENTIVO',  priority: 'MEDIA', status: 'PENDIENTE',  component: 'Pantógrafo — Deslizador carbono',        triggerType: 'KM',     triggerValue: 150000,  currentValue: 142300, estimatedHours: 3,  depot: 'New York Sunnyside',     scheduledDate: format(addMinutes(now, 9*24*60),   'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 45*24*60),  'yyyy-MM-dd'), remainingLifePct: 28,  aiConfidencePct: 78 },
        { id: 'WO-2026-0145', assetId: 'VEN-001', type: 'PREVENTIVO',  priority: 'MEDIA', status: 'PENDIENTE',  component: 'Rodadas — Reprofilado de ruedas',        triggerType: 'KM',     triggerValue: 150000,  currentValue: 142300, estimatedHours: 8,  depot: 'Caracas Central',        scheduledDate: format(addMinutes(now, 14*24*60),  'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 60*24*60),  'yyyy-MM-dd'), remainingLifePct: 35,  aiConfidencePct: 72 },
        { id: 'WO-2026-0146', assetId: 'BRZ-002', type: 'INSPECCION',  priority: 'BAJA',  status: 'PENDIENTE',  component: 'Inspección General M2 (UIC 534)',         triggerType: 'TIEMPO', triggerValue: null,    currentValue: null,   estimatedHours: 6,  depot: 'Parauapebas CVRD',       scheduledDate: format(addMinutes(now, 21*24*60),  'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0147', assetId: 'CAN-003', type: 'PREVENTIVO',  priority: 'MEDIA', status: 'COMPLETADO', component: 'Sistema HVAC — Filtros y refrigerante',  triggerType: 'TIEMPO', triggerValue: null,    currentValue: null,   estimatedHours: 5,  depot: 'Toronto Maintenance',    scheduledDate: format(subDays(now, 3),            'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0148', assetId: 'BRZ-003', type: 'PREDICTIVO',  priority: 'ALTA',  status: 'PENDIENTE',  component: 'Motor de tracción — Temperatura anómala', triggerType: 'COND',  triggerValue: null,    currentValue: null,   estimatedHours: 10, depot: 'São Luís Terminal',      scheduledDate: format(addMinutes(now, 2*24*60),   'yyyy-MM-dd'), aiPredictedFailureDate: format(addMinutes(now, 8*24*60),   'yyyy-MM-dd'), remainingLifePct: 8,   aiConfidencePct: 88 },
        { id: 'WO-2026-0149', assetId: 'CAN-001', type: 'PREVENTIVO',  priority: 'BAJA',  status: 'PENDIENTE',  component: 'Bogies — Lubricación general',            triggerType: 'KM',     triggerValue: 200000,  currentValue: 187400, estimatedHours: 2,  depot: 'Toronto Maintenance',    scheduledDate: format(addMinutes(now, 28*24*60),  'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0150', assetId: 'CHI-001', type: 'PREVENTIVO',  priority: 'MEDIA', status: 'EN_CURSO',   component: 'Frenos — Calibración electrónica EBS',   triggerType: 'TIEMPO', triggerValue: null,    currentValue: null,   estimatedHours: 3,  depot: 'Santiago Alameda',       scheduledDate: format(now,                         'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0151', assetId: 'URU-001', type: 'INSPECCION',  priority: 'BAJA',  status: 'COMPLETADO', component: 'Inspección de acoples y mangueras',      triggerType: 'TIEMPO', triggerValue: null,    currentValue: null,   estimatedHours: 4,  depot: 'Montevideo La Paloma',   scheduledDate: format(subDays(now, 5),            'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0152', assetId: 'ECU-001', type: 'CORRECTIVO',  priority: 'MEDIA', status: 'COMPLETADO', component: 'Puerta — Sensor de cierre 4B',           triggerType: 'COND',   triggerValue: null,    currentValue: null,   estimatedHours: 1,  depot: 'Quito Chimbacalle',      scheduledDate: format(subDays(now, 1),            'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
        { id: 'WO-2026-0153', assetId: 'USA-004', type: 'INSPECCION',  priority: 'BAJA',  status: 'PENDIENTE',  component: 'Revisión general M4 (900,000 km)',        triggerType: 'KM',     triggerValue: 900000,  currentValue: 876500, estimatedHours: 48, depot: 'Los Angeles Union',      scheduledDate: format(addMinutes(now, 180*24*60), 'yyyy-MM-dd'), aiPredictedFailureDate: null,                                              remainingLifePct: null, aiConfidencePct: null },
    ];
    return orders;
}

// ─── SAFETY INCIDENTS ─────────────────────────────────────────────────────────

export function generateIncidents() {
    const now = new Date();
    return [
        { id: 'INC-2026-0088', date: format(subDays(now, 2),  'yyyy-MM-dd HH:mm'), trainId: 'MEX-001', routeId: 'RT-005', type: 'RETRASO_MAYOR', severity: 'MAYOR',  description: 'Retraso de 22 min en tramo Cancún–Playa del Carmen por avería en señalización', rootCause: 'Fallo equipo señalización', correctiveAction: 'Mantenimiento correctivo en señal KM-68', status: 'CERRADO' },
        { id: 'INC-2026-0087', date: format(subDays(now, 4),  'yyyy-MM-dd HH:mm'), trainId: 'BRZ-001', routeId: 'RT-015', type: 'AVERIA',        severity: 'CRITICO', description: 'Fallo en rodamiento eje 3 detectado por vibración anómala durante servicio Carajás', rootCause: 'Fatiga de material (rodamiento)', correctiveAction: 'Tren retirado de servicio — WO-2026-0143 en curso', status: 'ABIERTO' },
        { id: 'INC-2026-0086', date: format(subDays(now, 7),  'yyyy-MM-dd HH:mm'), trainId: 'USA-002', routeId: 'RT-001', type: 'RETRASO_MENOR', severity: 'MENOR',  description: 'Retraso de 11 min en NE Regional 173 por congestión en New York Penn', rootCause: 'Tiempo de estación excedido', correctiveAction: 'Ajuste de programación horaria', status: 'CERRADO' },
        { id: 'INC-2026-0085', date: format(subDays(now, 10), 'yyyy-MM-dd HH:mm'), trainId: 'BRZ-003', routeId: 'RT-015', type: 'AVERIA',        severity: 'MAYOR',  description: 'Sobrecalentamiento en motor de tracción del Carajás 2003', rootCause: 'Temperatura del motor > 185°C', correctiveAction: 'Reemplazo de sensor y revisión de refrigeración', status: 'CERRADO' },
        { id: 'INC-2026-0084', date: format(subDays(now, 14), 'yyyy-MM-dd HH:mm'), trainId: 'VEN-001', routeId: 'RT-008', type: 'NEAR_MISS',     severity: 'MAYOR',  description: 'Aproximación a distancia mínima en tramo Caracas-La Victoria — protocolo ATP activado', rootCause: 'Error de señalización automática', correctiveAction: 'Revisión protocolo ATP — señal corregida', status: 'CERRADO' },
        { id: 'INC-2026-0083', date: format(subDays(now, 20), 'yyyy-MM-dd HH:mm'), trainId: 'ECU-001', routeId: 'RT-009', type: 'AVERIA',        severity: 'MENOR',  description: 'Sensor de puerta 4B con fallo intermitente en Tren Ecuador Norte — servicio continuó con puerta asegurada manualmente', rootCause: 'Desgaste de sensor de final de carrera', correctiveAction: 'Reemplazo de sensor WO-2026-0152', status: 'CERRADO' },
    ];
}

// ─── REAL-TIME ALERTS ─────────────────────────────────────────────────────────

export function generateAlerts(fleetType = 'todos') {
    const now = new Date();
    const allAlerts = [
        { id: 'ALT-001', time: format(addMinutes(now, -3),   'HH:mm'), type: 'MANTENIMIENTO', trainId: 'BRZ-001', trainName: 'Carajás 2001',      message: 'WO-2026-0143 EN CURSO — Rodamiento eje 3 en reparación. Tren fuera de servicio.', priority: 'CRITICAL' },
        { id: 'ALT-002', time: format(addMinutes(now, -8),   'HH:mm'), type: 'PREDICTIVO',     trainId: 'BRZ-003', trainName: 'Carajás 2003',      message: 'IA PREDICTIVA: Temperatura motor de tracción +12°C sobre baseline. Fallo predicho en 8 días (confianza 88%).', priority: 'CRITICAL' },
        { id: 'ALT-003', time: format(addMinutes(now, -15),  'HH:mm'), type: 'RETRASO',        trainId: 'MEX-001', trainName: 'Tren Maya TM-01',   message: 'TM-01 lleva 14 min de retraso en RT-005 tramo Cancún–Playa del Carmen. OTP comprometido.', priority: 'WARNING' },
        { id: 'ALT-004', time: format(addMinutes(now, -22),  'HH:mm'), type: 'MANTENIMIENTO',  trainId: 'MEX-001', trainName: 'Tren Maya TM-01',   message: 'Frenos (pastillas) a 16% de vida útil. OT WO-2026-0142 programada en 4 días.', priority: 'WARNING' },
        { id: 'ALT-005', time: format(addMinutes(now, -35),  'HH:mm'), type: 'OCUPACION',      trainId: 'USA-001', trainName: 'Acela 2151',        message: 'Ocupación Acela 2151 al 97% en NEC. Considerar refuerzo de frecuencia.', priority: 'INFO' },
        { id: 'ALT-006', time: format(addMinutes(now, -48),  'HH:mm'), type: 'ENERGIA',        trainId: 'USA-004', trainName: 'Coast Starlight 11', message: 'Consumo combustible CS-011 un 18% por encima del parámetro de ruta. Revisar perfil de velocidad.', priority: 'WARNING' },
        { id: 'ALT-007', time: format(addMinutes(now, -62),  'HH:mm'), type: 'RETRASO',        trainId: 'CAN-001', trainName: 'VIA Corridor 60',   message: 'VC-060 retraso acumulado 7 min en RT-003 — tramo Toronto–Kingston.', priority: 'INFO' },
        { id: 'ALT-008', time: format(addMinutes(now, -90),  'HH:mm'), type: 'COMBUSTIBLE',    trainId: 'URU-001', trainName: 'Tren de la Madera', message: 'Nivel de combustible AFE-101 al 18%. Reabastecimiento en Durazno recomendado.', priority: 'WARNING' },
        { id: 'ALT-009', time: format(addMinutes(now, -120), 'HH:mm'), type: 'INFO',            trainId: null,      trainName: null,                message: 'WO-2026-0152 completada. Sensor puerta ECU-001 reemplazado. Tren en servicio.', priority: 'INFO' },
        { id: 'ALT-010', time: format(addMinutes(now, -145), 'HH:mm'), type: 'MANTENIMIENTO',  trainId: 'USA-001', trainName: 'Acela 2151',        message: 'Pantógrafo Acela 2151 a 28% de vida útil. Programar OT próximas 2 semanas.', priority: 'INFO' },
    ];

    const trainTypeMap = Object.fromEntries(TRAINS.map(t => [t.id, t.type]));
    if (fleetType === 'todos') return allAlerts;
    if (fleetType === 'pasajeros') return allAlerts.filter(a => !a.trainId || trainTypeMap[a.trainId] === 'pasajeros');
    if (fleetType === 'carga')     return allAlerts.filter(a => !a.trainId || trainTypeMap[a.trainId] === 'carga');
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
            trainId: (() => { const rt = TRAINS.filter(t => t.route === route.id); return rt.length ? rt[serviceId % rt.length].id : TRAINS[0].id; })(),
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
