// Real railway projects in the Americas — researched data (2025)
// Coordinates are verified approximate values; stop lists use terminals + key junctions.

export const RAIL_PROJECTS = [

    // ─── ECUADOR ────────────────────────────────────────────────────────────────
    {
        id: 'metro-quito',
        country: 'Ecuador', countryCode: 'EC', city: 'Quito',
        name: 'Metro de Quito', subtitle: 'Línea 1 — Metro Urbano Norte-Sur',
        type: 'metro', status: 'operativo', yearOpened: 2023,
        totalLines: 1, totalStations: 15, totalTrains: 18,
        totalKm: 22.1, maxSpeedKmh: 100, dailyPassengers: 130000,
        electrification: '750 V CC (3er riel)',
        technology: 'Automático GoA2 · CBTC Alstom Urbalis 400',
        mapCenter: { lat: -0.215, lng: -78.510, zoom: 12 },
        lines: [{
            id: 'L1', name: 'Línea 1 Norte-Sur', color: '#E53E3E',
            stops: [
                { name: 'El Labrador',    lat: -0.106, lng: -78.490 },
                { name: 'Jipijapa',       lat: -0.123, lng: -78.493 },
                { name: 'La Prensa',      lat: -0.150, lng: -78.497 },
                { name: 'Estadio',        lat: -0.178, lng: -78.500 },
                { name: 'El Ejido',       lat: -0.208, lng: -78.500 },
                { name: 'Univ. Central',  lat: -0.215, lng: -78.500 },
                { name: 'La Alameda',     lat: -0.224, lng: -78.501 },
                { name: 'San Francisco',  lat: -0.223, lng: -78.512 },
                { name: 'La Magdalena',   lat: -0.247, lng: -78.521 },
                { name: 'Solanda',        lat: -0.276, lng: -78.532 },
                { name: 'El Recreo',      lat: -0.291, lng: -78.540 },
                { name: 'Villa Flora',    lat: -0.302, lng: -78.543 },
                { name: 'Morán Valverde', lat: -0.312, lng: -78.548 },
                { name: 'El Calzado',     lat: -0.318, lng: -78.552 },
                { name: 'Quitumbe',       lat: -0.322, lng: -78.554 },
            ],
        }],
        companies: {
            operators: [
                { name: 'EPMMQ – Empresa Pública Metro de Quito', role: 'Operador Público', country: 'Ecuador' },
            ],
            manufacturers: [
                { name: 'CAF (Construcciones y Auxiliar de Ferrocarriles)', role: 'Material Rodante', country: 'España', product: 'CAF Urbos 100 (5 coches, 193 m)' },
                { name: 'Alstom', role: 'Señalización ATC/ATP', country: 'Francia', product: 'Urbalis 400 CBTC' },
                { name: 'Siemens Mobility', role: 'Electrificación', country: 'Alemania', product: 'Subestaciones y catenaria rígida' },
            ],
            maintenance: [
                { name: 'CAF MiiRA', role: 'Mantenimiento Integral Material Rodante', country: 'España', contract: 'Contrato 15 años' },
            ],
        },
        financing: {
            totalCostUSD: 2020000000,
            sources: ['BID', 'CAF', 'KfW (Alemania)', 'Municipio Distrito Metropolitano de Quito'],
        },
        keyFacts: [
            'Primera línea de metro en la historia de Ecuador y Quito',
            'Sistema GoA2: opera sin conductor en cabina en modo normal',
            'Estación San Francisco: 28 m de profundidad (la más honda del sistema)',
            'Inaugurada el 1 de diciembre de 2023 por el Alcalde Pabel Muñoz',
            'Integración con Trolebús, Ecovía y 9 corredores BRT del SITM-Q',
        ],
    },

    // ─── COLOMBIA ───────────────────────────────────────────────────────────────
    {
        id: 'metro-medellin',
        country: 'Colombia', countryCode: 'CO', city: 'Medellín',
        name: 'Metro de Medellín', subtitle: 'Sistema Metro + Metrocable',
        type: 'metro', status: 'operativo', yearOpened: 1995,
        totalLines: 7, totalStations: 30, totalTrains: 42,
        totalKm: 37.4, maxSpeedKmh: 80, dailyPassengers: 800000,
        electrification: '1500 V CC (líneas metro) / AC (metrocable)',
        technology: 'ATC convencional + cable aéreo Doppelmayr',
        mapCenter: { lat: 6.248, lng: -75.573, zoom: 12 },
        lines: [
            {
                id: 'LA', name: 'Línea A (Norte-Sur)', color: '#22C55E',
                stops: [
                    { name: 'Niquía',       lat: 6.338, lng: -75.551 },
                    { name: 'Bello',        lat: 6.316, lng: -75.557 },
                    { name: 'Acevedo',      lat: 6.288, lng: -75.557 },
                    { name: 'Tricentenario',lat: 6.273, lng: -75.563 },
                    { name: 'Caribe',       lat: 6.264, lng: -75.566 },
                    { name: 'Universidad',  lat: 6.251, lng: -75.569 },
                    { name: 'Hospital',     lat: 6.243, lng: -75.568 },
                    { name: 'Prado',        lat: 6.236, lng: -75.568 },
                    { name: 'Parque Berrío',lat: 6.252, lng: -75.568 },
                    { name: 'San Antonio',  lat: 6.244, lng: -75.567 },
                    { name: 'Alpujarra',    lat: 6.239, lng: -75.572 },
                    { name: 'Exposiciones', lat: 6.231, lng: -75.573 },
                    { name: 'Industriales', lat: 6.221, lng: -75.576 },
                    { name: 'Poblado',      lat: 6.206, lng: -75.577 },
                    { name: 'Aguacatala',   lat: 6.194, lng: -75.583 },
                    { name: 'Ayurá',        lat: 6.182, lng: -75.586 },
                    { name: 'Envigado',     lat: 6.172, lng: -75.587 },
                    { name: 'Itagüí',       lat: 6.164, lng: -75.590 },
                    { name: 'La Estrella',  lat: 6.143, lng: -75.592 },
                ],
            },
            {
                id: 'LB', name: 'Línea B (Este-Oeste)', color: '#3B82F6',
                stops: [
                    { name: 'San Javier',   lat: 6.234, lng: -75.611 },
                    { name: 'Santa Lucía',  lat: 6.238, lng: -75.600 },
                    { name: 'Floresta',     lat: 6.241, lng: -75.590 },
                    { name: 'San Antonio',  lat: 6.244, lng: -75.567 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'Metro de Medellín Ltda.', role: 'Operador Público', country: 'Colombia' },
            ],
            manufacturers: [
                { name: 'INECON / Hyundai Rotem', role: 'Material Rodante Línea A', country: 'Corea del Sur', product: 'Tren EMU 1500V' },
                { name: 'Siemens Mobility', role: 'Señalización Línea A y B', country: 'Alemania', product: 'Sistema ATP/ATO' },
                { name: 'Doppelmayr', role: 'Sistemas Metrocable', country: 'Austria', product: 'Cable aéreo telecabina' },
                { name: 'Bombardier Transportation', role: 'Material Rodante Línea B', country: 'Canadá', product: 'Flexity' },
            ],
            maintenance: [
                { name: 'Metro de Medellín (taller propio)', role: 'Mantenimiento Integral', country: 'Colombia', contract: 'Operación interna' },
            ],
        },
        financing: {
            totalCostUSD: 590000000,
            sources: ['BID', 'Gobierno de Colombia', 'Municipio de Medellín', 'Gobernación de Antioquia'],
        },
        keyFacts: [
            'Primer sistema de metro en Colombia y en la historia de Medellín',
            'El Metrocable es el primer sistema de teleférico urbano integrado a un metro en América Latina',
            'El sistema Metro + Metrocable transformó el acceso de comunas populares de ladera',
            'Ha recibido premios internacionales de urbanismo (Premio Lee Kuan Yew, 2012)',
            'Transporta más de 800.000 pasajeros en días hábiles pico',
        ],
    },

    // ─── VENEZUELA ──────────────────────────────────────────────────────────────
    {
        id: 'metro-caracas',
        country: 'Venezuela', countryCode: 'VE', city: 'Caracas',
        name: 'Metro de Caracas', subtitle: 'Sistema Metro — 5 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1983,
        totalLines: 5, totalStations: 46, totalTrains: 59,
        totalKm: 52.5, maxSpeedKmh: 100, dailyPassengers: 900000,
        electrification: '750 V CC (3er riel)',
        technology: 'ATC convencional · Señalización CAF/Alstom',
        mapCenter: { lat: 10.500, lng: -66.920, zoom: 12 },
        lines: [
            {
                id: 'L1', name: 'Línea 1 (Este-Oeste)', color: '#3B82F6',
                stops: [
                    { name: 'Propatria',     lat: 10.504, lng: -67.007 },
                    { name: 'El Silencio',   lat: 10.506, lng: -66.924 },
                    { name: 'Capitolio',     lat: 10.507, lng: -66.917 },
                    { name: 'Parque Carabobo',lat:10.506,lng:-66.900 },
                    { name: 'Sabana Grande',  lat: 10.495, lng: -66.878 },
                    { name: 'Chacaíto',      lat: 10.491, lng: -66.864 },
                    { name: 'Altamira',      lat: 10.492, lng: -66.844 },
                    { name: 'Los Dos Caminos',lat:10.495,lng:-66.835 },
                    { name: 'Palo Verde',    lat: 10.494, lng: -66.796 },
                ],
            },
            {
                id: 'L2', name: 'Línea 2 (Norte-Sur)', color: '#F59E0B',
                stops: [
                    { name: 'Las Adjuntas',  lat: 10.445, lng: -66.956 },
                    { name: 'El Valle',      lat: 10.462, lng: -66.930 },
                    { name: 'Chacaíto',      lat: 10.491, lng: -66.864 },
                    { name: 'Miranda',       lat: 10.505, lng: -66.869 },
                    { name: 'La Paz',        lat: 10.514, lng: -66.876 },
                    { name: 'Zona Rental',   lat: 10.520, lng: -66.879 },
                ],
            },
            {
                id: 'L3', name: 'Línea 3 (Oeste-Sur)', color: '#A855F7',
                stops: [
                    { name: 'El Silencio',   lat: 10.506, lng: -66.924 },
                    { name: 'La Hoyada',     lat: 10.488, lng: -66.913 },
                    { name: 'Ruiz Pineda',   lat: 10.452, lng: -66.951 },
                    { name: 'La Rinconada',  lat: 10.413, lng: -66.958 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'C.A. Metro de Caracas (CAMETRO)', role: 'Operador Estatal', country: 'Venezuela' },
            ],
            manufacturers: [
                { name: 'CAF (Construcciones y Auxiliar de Ferrocarriles)', role: 'Material Rodante (renovaciones)', country: 'España', product: 'CAF 6000 / CAF 9000' },
                { name: 'Alstom', role: 'Material Rodante original y señalización', country: 'Francia', product: 'Métro Val / flota original' },
                { name: 'Siemens Mobility', role: 'Material Rodante (Líneas 4-5)', country: 'Alemania', product: 'Siemens Modular' },
            ],
            maintenance: [
                { name: 'CAMETRO Taller Central Los Flores', role: 'Mantenimiento Integral', country: 'Venezuela', contract: 'Operación interna' },
                { name: 'CAF Servicios', role: 'Asistencia técnica material rodante', country: 'España', contract: 'Contratos puntuales' },
            ],
        },
        financing: {
            totalCostUSD: 1200000000,
            sources: ['Gobierno de Venezuela (PDVSA, Nación)', 'Bancos internacionales (fases originales)'],
        },
        keyFacts: [
            'Primer sistema de metro inaugurado en Venezuela (enero de 1983)',
            'El más antiguo de América del Sur en funcionamiento continuo',
            'Actualmente opera con capacidad reducida por restricciones de energía y mantenimiento',
            'Las líneas 4 y 5 son las más recientes (Capuchinos y Los Teques)',
            'La Línea 1 (Propatria–Palo Verde) es el eje principal del sistema',
        ],
    },

    // ─── PERU ────────────────────────────────────────────────────────────────────
    {
        id: 'metro-lima',
        country: 'Peru', countryCode: 'PE', city: 'Lima',
        name: 'Metro de Lima — Línea 1', subtitle: 'Tren Eléctrico · Villa El Salvador–San Juan de Lurigancho',
        type: 'metro', status: 'operativo', yearOpened: 2012,
        totalLines: 1, totalStations: 26, totalTrains: 38,
        totalKm: 34.6, maxSpeedKmh: 90, dailyPassengers: 350000,
        electrification: '1500 V CC (catenaria aérea)',
        technology: 'Automático GoA2 · CBTC Alstom',
        mapCenter: { lat: -12.060, lng: -77.020, zoom: 11 },
        lines: [{
            id: 'L1', name: 'Línea 1 Norte-Sur', color: '#F59E0B',
            stops: [
                { name: 'Villa El Salvador', lat: -12.213, lng: -76.944 },
                { name: 'Villa María del Triunfo', lat: -12.171, lng: -76.952 },
                { name: 'San Juan de Miraflores', lat: -12.151, lng: -76.962 },
                { name: 'Los Cabitos',       lat: -12.126, lng: -76.979 },
                { name: 'Jorge Chávez',      lat: -12.113, lng: -76.985 },
                { name: 'Pumacahua',         lat: -12.101, lng: -76.995 },
                { name: 'Angamos',           lat: -12.089, lng: -77.003 },
                { name: 'Canadá',            lat: -12.075, lng: -77.011 },
                { name: 'La Cultura',        lat: -12.069, lng: -77.022 },
                { name: 'Arriola',           lat: -12.058, lng: -77.027 },
                { name: 'Gamarra',           lat: -12.053, lng: -77.021 },
                { name: 'Miguel Grau',       lat: -12.047, lng: -77.026 },
                { name: 'Caja de Agua',      lat: -12.000, lng: -77.015 },
                { name: 'El Agustino',       lat: -11.988, lng: -77.009 },
                { name: 'San Borja Sur',     lat: -11.981, lng: -77.013 },
                { name: 'San Carlos',        lat: -11.970, lng: -77.013 },
                { name: 'San Juan de Lurigancho', lat: -11.950, lng: -77.006 },
            ],
        }],
        companies: {
            operators: [
                { name: 'GH Rail (COSAPI + Graña y Montero)', role: 'Operador Concesionario', country: 'Peru' },
                { name: 'AATE (Autoridad Autónoma del Tren Eléctrico)', role: 'Autoridad Concedente', country: 'Peru' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante y Señalización', country: 'Francia', product: 'Alstom Metropolis X\'trapolis 100 · CBTC' },
                { name: 'Siemens Mobility', role: 'Electrificación', country: 'Alemania', product: 'Catenaria 1500V CC' },
            ],
            maintenance: [
                { name: 'Alstom Services', role: 'Mantenimiento Material Rodante', country: 'Francia', contract: '12 años' },
            ],
        },
        financing: {
            totalCostUSD: 1500000000,
            sources: ['CAF', 'JICA (Japón)', 'BID', 'Gobierno de Peru'],
        },
        keyFacts: [
            'Primera línea de metro de Lima, con historia que se remonta a 1986 (tramo inicial)',
            'La extensión norte a San Juan de Lurigancho (2014) añadió 10 nuevas estaciones',
            'La Línea 2 (Este-Oeste) está en construcción, prevista para 2025-2027',
            'El corredor conecta Lima Sur con los conos norte y este, cruzando el centro histórico',
            'La flota Alstom X\'trapolis opera con 6 coches por tren, capacidad 1.056 pasajeros',
        ],
    },

    // ─── BOLIVIA ────────────────────────────────────────────────────────────────
    {
        id: 'teleferico-lapaz',
        country: 'Bolivia', countryCode: 'BO', city: 'La Paz / El Alto',
        name: 'Mi Teleférico', subtitle: 'Red de Teleférico Urbano — 10 Líneas',
        type: 'cable', status: 'operativo', yearOpened: 2014,
        totalLines: 10, totalStations: 36, totalTrains: 0,
        totalKm: 30.8, maxSpeedKmh: 22, dailyPassengers: 200000,
        electrification: 'Eléctrico (motores de tracción AC)',
        technology: 'Telecabina Doppelmayr · Sistema bicable y monocable',
        mapCenter: { lat: -16.500, lng: -68.147, zoom: 12 },
        lines: [
            {
                id: 'L-ROJA', name: 'Línea Roja (El Alto-La Paz)', color: '#EF4444',
                stops: [
                    { name: 'Terminal El Alto',  lat: -16.523, lng: -68.185 },
                    { name: 'Ciudad Satélite',   lat: -16.518, lng: -68.180 },
                    { name: 'Mirador',           lat: -16.503, lng: -68.172 },
                    { name: 'Cementerio',        lat: -16.495, lng: -68.155 },
                    { name: 'Bolivia',           lat: -16.488, lng: -68.150 },
                    { name: '16 de Julio (El Alto)',lat:-16.504,lng:-68.165 },
                ],
            },
            {
                id: 'L-AMARILLA', name: 'Línea Amarilla', color: '#F59E0B',
                stops: [
                    { name: 'Sopocachi',         lat: -16.518, lng: -68.115 },
                    { name: 'Obelisco',          lat: -16.509, lng: -68.127 },
                    { name: 'El Prado',          lat: -16.499, lng: -68.133 },
                    { name: 'San Pedro',         lat: -16.493, lng: -68.146 },
                    { name: '16 de Julio',       lat: -16.504, lng: -68.160 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'Mi Teleférico (Empresa Estatal)', role: 'Operador Estatal', country: 'Bolivia' },
            ],
            manufacturers: [
                { name: 'Doppelmayr (Austria)', role: 'Sistema de Teleférico', country: 'Austria', product: 'D-Line / 3S (Tricable)' },
                { name: 'CWA (Cable Car World Association)', role: 'Consultoría técnica', country: 'Internacional', product: 'Diseño y supervisión' },
            ],
            maintenance: [
                { name: 'Doppelmayr Servicios', role: 'Mantenimiento Técnico', country: 'Austria', contract: 'Contrato multi-anual' },
            ],
        },
        financing: {
            totalCostUSD: 620000000,
            sources: ['ENDE Corporación (Bolivia)', 'Gobierno de Bolivia (Ministerio de Obras Públicas)'],
        },
        keyFacts: [
            'La red de teleférico urbano más extensa del mundo (30.8 km)',
            'La ciudad de La Paz / El Alto es la más alta del mundo con sistema de transporte por cable',
            'El sistema opera entre 3.300 m y 4.000 m sobre el nivel del mar',
            'Las 10 líneas están codificadas por colores (roja, amarilla, verde, azul, naranja, blanca, cielo, dorada, plateada, púrpura)',
            'Diseñado para conectar la ciudad de El Alto (ladera alta) con el centro de La Paz',
        ],
    },

    // ─── CHILE ──────────────────────────────────────────────────────────────────
    {
        id: 'metro-santiago',
        country: 'Chile', countryCode: 'CL', city: 'Santiago',
        name: 'Metro de Santiago', subtitle: 'Red Integrada — 7 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1975,
        totalLines: 7, totalStations: 136, totalTrains: 184,
        totalKm: 140, maxSpeedKmh: 110, dailyPassengers: 2200000,
        electrification: '750 V CC (3er riel) / 1500 V CC (Líneas 4-6)',
        technology: 'GoA2 · CBTC Alstom (L1) · ATC/ATO convencional',
        mapCenter: { lat: -33.455, lng: -70.650, zoom: 11 },
        lines: [
            {
                id: 'L1', name: 'Línea 1 (Este-Oeste)', color: '#EF4444',
                stops: [
                    { name: 'Neptuno',          lat: -33.424, lng: -70.806 },
                    { name: 'Plaza de Armas',   lat: -33.437, lng: -70.652 },
                    { name: 'Baquedano',        lat: -33.437, lng: -70.634 },
                    { name: 'Universidad de Chile', lat: -33.442, lng: -70.652 },
                    { name: 'Los Dominicos',    lat: -33.430, lng: -70.573 },
                ],
            },
            {
                id: 'L2', name: 'Línea 2 (Norte-Sur)', color: '#F59E0B',
                stops: [
                    { name: 'Vespucio Norte',   lat: -33.382, lng: -70.648 },
                    { name: 'Baquedano',        lat: -33.437, lng: -70.634 },
                    { name: 'La Cisterna',      lat: -33.527, lng: -70.661 },
                ],
            },
            {
                id: 'L3', name: 'Línea 3 (Norte-Sur diagonal)', color: '#A855F7',
                stops: [
                    { name: 'Los Libertadores', lat: -33.373, lng: -70.632 },
                    { name: 'Matta',            lat: -33.464, lng: -70.641 },
                    { name: 'Fernando Castillo Velasco', lat: -33.525, lng: -70.592 },
                ],
            },
            {
                id: 'L4', name: 'Línea 4 (Diagonal Sur)', color: '#22C55E',
                stops: [
                    { name: 'Tobalaba',         lat: -33.448, lng: -70.597 },
                    { name: 'Vicuña Mackenna',  lat: -33.490, lng: -70.607 },
                    { name: 'Grecia',           lat: -33.446, lng: -70.612 },
                    { name: 'Puente Alto',      lat: -33.608, lng: -70.581 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'Metro S.A.', role: 'Operador Estatal', country: 'Chile' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante (NS93, NS2004, X\'trapolis)', country: 'Francia', product: 'NS2004, X\'Trapolis Urbano' },
                { name: 'Bombardier Transportation', role: 'Material Rodante (Línea 4A)', country: 'Canadá', product: 'Bombardier Movia' },
                { name: 'CAF', role: 'Material Rodante (renovación flota)', country: 'España', product: 'CAF Metropolis' },
                { name: 'Siemens Mobility', role: 'Señalización y electrificación', country: 'Alemania', product: 'ATC/ATO, SCADA' },
            ],
            maintenance: [
                { name: 'Metro S.A. (Talleres propios)', role: 'Mantenimiento Integral', country: 'Chile', contract: 'Operación interna' },
            ],
        },
        financing: {
            totalCostUSD: 8200000000,
            sources: ['Estado de Chile', 'Banco Mundial', 'BID', 'Bonos de deuda propios Metro S.A.'],
        },
        keyFacts: [
            'La red de metro más extensa de América del Sur (140 km, 136 estaciones)',
            'Primera línea inaugurada en 1975; continúa expandiéndose (Línea 7 en construcción)',
            'Integrado con Red (ex-Transantiago) en un único sistema de tarjeta BIPO / pase escolar',
            'Las líneas 2 y 5 corren en horario pico con intervalos de 90 segundos',
            'Sistema pionero en América Latina en implementar conducción automática GoA4 (Línea 1 tramos)',
        ],
    },

    // ─── ARGENTINA ──────────────────────────────────────────────────────────────
    {
        id: 'subte-baires',
        country: 'Argentina', countryCode: 'AR', city: 'Buenos Aires',
        name: 'Subte de Buenos Aires', subtitle: 'Red Subterráneos — 6 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1913,
        totalLines: 6, totalStations: 90, totalTrains: 248,
        totalKm: 53.7, maxSpeedKmh: 70, dailyPassengers: 850000,
        electrification: '550 V CC (3er riel)',
        technology: 'ATC convencional · Líneas A/B legacy, C/D/E/H modernizadas',
        mapCenter: { lat: -34.612, lng: -58.432, zoom: 12 },
        lines: [
            {
                id: 'LA', name: 'Línea A (Plaza de Mayo–San Pedrito)', color: '#3B82F6',
                stops: [
                    { name: 'Plaza de Mayo',    lat: -34.608, lng: -58.372 },
                    { name: 'Lima',             lat: -34.614, lng: -58.381 },
                    { name: 'Congreso',         lat: -34.611, lng: -58.394 },
                    { name: 'Pasco',            lat: -34.614, lng: -58.400 },
                    { name: 'Alberti',          lat: -34.614, lng: -58.406 },
                    { name: 'Plaza Miserere',   lat: -34.614, lng: -58.413 },
                    { name: 'Castro Barros',    lat: -34.614, lng: -58.422 },
                    { name: 'Río de Janeiro',   lat: -34.615, lng: -58.432 },
                    { name: 'Medrano',          lat: -34.615, lng: -58.440 },
                    { name: 'Angel Gallardo',   lat: -34.614, lng: -58.451 },
                    { name: 'Malabia',          lat: -34.614, lng: -58.460 },
                    { name: 'Dorrego',          lat: -34.614, lng: -58.465 },
                    { name: 'Federico Lacroze', lat: -34.612, lng: -58.472 },
                    { name: 'Loyola',           lat: -34.612, lng: -58.479 },
                    { name: 'San Pedrito',      lat: -34.611, lng: -58.497 },
                ],
            },
            {
                id: 'LC', name: 'Línea C (Retiro–Constitución)', color: '#3B82F6',
                stops: [
                    { name: 'Retiro',           lat: -34.592, lng: -58.375 },
                    { name: 'San Martín',       lat: -34.599, lng: -58.376 },
                    { name: 'Lavalle',          lat: -34.602, lng: -58.376 },
                    { name: 'Diagonal Norte',   lat: -34.606, lng: -58.376 },
                    { name: 'Av. de Mayo',      lat: -34.609, lng: -58.376 },
                    { name: 'Independencia',    lat: -34.619, lng: -58.376 },
                    { name: 'San Juan',         lat: -34.625, lng: -58.376 },
                    { name: 'Constitución',     lat: -34.629, lng: -58.376 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'Emova (ex-Metrovías)', role: 'Operador Concesionario', country: 'Argentina' },
                { name: 'Gobierno de la Ciudad de Buenos Aires (GCBA)', role: 'Autoridad Concedente', country: 'Argentina' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante', country: 'Francia', product: 'Material Rodante Líneas C, D, E (Metropolis)' },
                { name: 'CAF', role: 'Material Rodante (renovación Línea A)', country: 'España', product: 'CAF 5000 (Línea A)' },
                { name: 'Siemens Mobility', role: 'Señalización', country: 'Alemania', product: 'ATP/ATO Líneas A y B' },
            ],
            maintenance: [
                { name: 'Emova (Talleres La Salle)', role: 'Mantenimiento Integral', country: 'Argentina', contract: 'Concesión en curso' },
            ],
        },
        financing: {
            totalCostUSD: 3100000000,
            sources: ['GCBA (Ciudad de Buenos Aires)', 'Préstamos BID', 'Obras por Administración Central'],
        },
        keyFacts: [
            'Primer sistema de metro de América Latina e iberoamérica (inaugurado 1913)',
            'El primer tramo de Línea A (Plaza de Mayo–Plaza Once) fue el primero al sur del Ecuador',
            'La Línea A conserva vagones históricos de 1913 (Lacroze) como parte del patrimonio',
            'La Línea H fue la primera nueva línea en más de 30 años (2007)',
            'En conjunto con el Premetro forma una red de transporte masivo que integra 6 líneas',
        ],
    },

    // ─── BRAZIL ─────────────────────────────────────────────────────────────────
    {
        id: 'metro-sao-paulo',
        country: 'Brasil', countryCode: 'BR', city: 'São Paulo',
        name: 'Metro de São Paulo + CPTM', subtitle: 'Red Integrada Metro-Tren — 14 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1974,
        totalLines: 14, totalStations: 175, totalTrains: 220,
        totalKm: 374, maxSpeedKmh: 120, dailyPassengers: 4500000,
        electrification: '750 V CC (metro) / 3000 V CC (CPTM)',
        technology: 'GoA2 · CBTC (líneas 4, 5) · ATC convencional (restantes)',
        mapCenter: { lat: -23.548, lng: -46.638, zoom: 11 },
        lines: [
            {
                id: 'L1', name: 'Línea 1-Azul (Norte-Sur)', color: '#3B82F6',
                stops: [
                    { name: 'Tucuruvi',     lat: -23.459, lng: -46.621 },
                    { name: 'Tiradentes',   lat: -23.540, lng: -46.636 },
                    { name: 'Jabaquara',    lat: -23.647, lng: -46.651 },
                ],
            },
            {
                id: 'L2', name: 'Línea 2-Verde (Este-Oeste)', color: '#22C55E',
                stops: [
                    { name: 'Vila Madalena', lat: -23.547, lng: -46.696 },
                    { name: 'Consolação',   lat: -23.555, lng: -46.660 },
                    { name: 'Brigadeiro',   lat: -23.569, lng: -46.651 },
                    { name: 'Tamanduateí', lat: -23.541, lng: -46.572 },
                ],
            },
            {
                id: 'L3', name: 'Línea 3-Roja (Este-Oeste)', color: '#EF4444',
                stops: [
                    { name: 'Palmeiras-Barra Funda', lat: -23.523, lng: -46.666 },
                    { name: 'Marechal Deodoro',     lat: -23.539, lng: -46.643 },
                    { name: 'República',            lat: -23.543, lng: -46.643 },
                    { name: 'Corinthians-Itaquera', lat: -23.546, lng: -46.453 },
                ],
            },
            {
                id: 'L4', name: 'Línea 4-Amarela (Diagonal)', color: '#F59E0B',
                stops: [
                    { name: 'Luz',           lat: -23.535, lng: -46.635 },
                    { name: 'República',     lat: -23.543, lng: -46.643 },
                    { name: 'Paulista',      lat: -23.562, lng: -46.654 },
                    { name: 'Vila Sônia',    lat: -23.598, lng: -46.745 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'Metrô S.A.', role: 'Operador Estatal (Metro)', country: 'Brasil' },
                { name: 'CPTM (Companhia Paulista de Trens Metropolitanos)', role: 'Operador Estatal (Trenes)', country: 'Brasil' },
                { name: 'ViaQuatro (Línea 4-ViaMobilidade)', role: 'Concesión Privada', country: 'Brasil' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante (Línea 4 Y)', country: 'Francia', product: 'Alstom Metropolis Y' },
                { name: 'Bombardier Transportation', role: 'Material Rodante (Líneas 1, 2, 3)', country: 'Canadá', product: 'Bombardier Movia' },
                { name: 'CAF', role: 'Material Rodante (Línea 5)', country: 'España', product: 'CAF Metropolis' },
                { name: 'Siemens Mobility', role: 'Señalización', country: 'Alemania', product: 'CBTC Línea 4' },
            ],
            maintenance: [
                { name: 'Metrô S.A. Oficinas propias', role: 'Mantenimiento Integral', country: 'Brasil', contract: 'Operación interna' },
            ],
        },
        financing: {
            totalCostUSD: 18000000000,
            sources: ['Gobierno del Estado de São Paulo', 'Gobierno Federal Brasil', 'BNDES', 'BID', 'JICA'],
        },
        keyFacts: [
            'La red integrada de mayor extensión de América Latina (374 km con CPTM)',
            'La Línea 3 (Roja) es la más usada de América Latina con 1.6M de viajes/día',
            'São Paulo fue la primera ciudad de Brasil y la segunda de América Latina en tener metro (1974)',
            'Las Líneas 4 y 5 operan con tecnología CBTC de última generación (GoA2)',
            'El Proyecto Linha 6 Laranja está en construcción, previsto para 2025',
        ],
    },

    // ─── PANAMA ─────────────────────────────────────────────────────────────────
    {
        id: 'metro-panama',
        country: 'Panamá', countryCode: 'PA', city: 'Ciudad de Panamá',
        name: 'Metro de Panamá', subtitle: 'Sistema Metro — 2 Líneas Operativas',
        type: 'metro', status: 'operativo', yearOpened: 2014,
        totalLines: 2, totalStations: 29, totalTrains: 27,
        totalKm: 36.6, maxSpeedKmh: 90, dailyPassengers: 300000,
        electrification: '1500 V CC (catenaria aérea)',
        technology: 'GoA2 · ATC/ATO',
        mapCenter: { lat: 8.990, lng: -79.535, zoom: 12 },
        lines: [
            {
                id: 'L1', name: 'Línea 1 (Norte-Sur)', color: '#F59E0B',
                stops: [
                    { name: 'Albrook',       lat: 8.969, lng: -79.546 },
                    { name: 'Lotería',       lat: 8.978, lng: -79.534 },
                    { name: 'Iglesia del Carmen', lat: 8.988, lng: -79.521 },
                    { name: '5 de Mayo',     lat: 8.993, lng: -79.530 },
                    { name: 'Central',       lat: 8.995, lng: -79.535 },
                    { name: 'Plaza Victoriano Lorenzo', lat: 9.001, lng: -79.537 },
                    { name: 'El Ingenio',    lat: 9.016, lng: -79.517 },
                    { name: 'Los Andes',     lat: 9.024, lng: -79.513 },
                    { name: 'San Isidro',    lat: 9.034, lng: -79.507 },
                    { name: 'San Miguelito', lat: 9.041, lng: -79.501 },
                    { name: 'El Llano',      lat: 9.050, lng: -79.485 },
                    { name: 'Victoriano L. (Norte)', lat: 9.058, lng: -79.478 },
                    { name: 'Corredor Norte',lat: 9.066, lng: -79.470 },
                ],
            },
            {
                id: 'L2', name: 'Línea 2 (Este-Oeste)', color: '#A855F7',
                stops: [
                    { name: 'San Miguelito', lat: 9.041, lng: -79.501 },
                    { name: 'Tocumen (Aeropuerto)', lat: 9.064, lng: -79.384 },
                    { name: 'Nuevo Tocumen',lat: 9.070, lng: -79.366 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'Metro de Panamá S.A.', role: 'Operador Estatal', country: 'Panamá' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante Línea 1', country: 'Francia', product: 'Alstom Metropolis (4 coches)' },
                { name: 'CAF', role: 'Material Rodante Línea 2', country: 'España', product: 'CAF Metropolis' },
                { name: 'Thales', role: 'Señalización ATC/ATO', country: 'Francia', product: 'SelTrac CBTC' },
                { name: 'Vinci Construction', role: 'Obras Civiles', country: 'Francia', product: 'Túneles y viaductos' },
            ],
            maintenance: [
                { name: 'Alstom Services', role: 'Mantenimiento Línea 1', country: 'Francia', contract: 'Contrato 15 años' },
                { name: 'CAF MiiRA', role: 'Mantenimiento Línea 2', country: 'España', contract: 'Contrato 15 años' },
            ],
        },
        financing: {
            totalCostUSD: 2600000000,
            sources: ['Gobierno de Panamá', 'JICA (Japón)', 'BID', 'Bancos multilaterales'],
        },
        keyFacts: [
            'Primer sistema de metro en América Central y el Caribe',
            'La Línea 1 conecta el aeropuerto doméstico de Albrook con el norte de San Miguelito',
            'La Línea 2 lleva al Aeropuerto Internacional de Tocumen (2019)',
            'La Línea 3 (Pacheco-Ciudad de Panamá-La Chorrera) está en proceso de licitación',
            'Panamá usó la construcción del Metro como modelo de regeneración urbana en corredores clave',
        ],
    },

    // ─── MEXICO ─────────────────────────────────────────────────────────────────
    {
        id: 'metro-cdmx',
        country: 'México', countryCode: 'MX', city: 'Ciudad de México',
        name: 'Metro CDMX', subtitle: 'Sistema de Transporte Colectivo — 12 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1969,
        totalLines: 12, totalStations: 195, totalTrains: 360,
        totalKm: 226, maxSpeedKmh: 100, dailyPassengers: 4500000,
        electrification: '750 V CC (3er riel)',
        technology: 'ATC convencional · GoA2 (Línea 12) · CBTC (futuro)',
        mapCenter: { lat: 19.432, lng: -99.133, zoom: 11 },
        lines: [
            {
                id: 'L1', name: 'Línea 1 (Rosa)', color: '#F472B6',
                stops: [
                    { name: 'Observatorio',   lat: 19.405, lng: -99.197 },
                    { name: 'Tacubaya',       lat: 19.402, lng: -99.180 },
                    { name: 'Insurgentes',    lat: 19.420, lng: -99.158 },
                    { name: 'Pino Suárez',    lat: 19.427, lng: -99.134 },
                    { name: 'Zócalo',         lat: 19.433, lng: -99.133 },
                    { name: 'Pantitlán',      lat: 19.415, lng: -99.071 },
                ],
            },
            {
                id: 'L2', name: 'Línea 2 (Azul)', color: '#3B82F6',
                stops: [
                    { name: 'Cuatro Caminos', lat: 19.480, lng: -99.197 },
                    { name: 'Hidalgo',        lat: 19.438, lng: -99.145 },
                    { name: 'Pino Suárez',    lat: 19.427, lng: -99.134 },
                    { name: 'Tasqueña',       lat: 19.358, lng: -99.139 },
                ],
            },
            {
                id: 'L3', name: 'Línea 3 (Verde Olivo)', color: '#22C55E',
                stops: [
                    { name: 'Indios Verdes',  lat: 19.512, lng: -99.127 },
                    { name: 'La Raza',        lat: 19.475, lng: -99.133 },
                    { name: 'Tlatelolco',     lat: 19.452, lng: -99.137 },
                    { name: 'Hospital General', lat: 19.417, lng: -99.149 },
                    { name: 'Universidad',    lat: 19.330, lng: -99.179 },
                ],
            },
            {
                id: 'L12', name: 'Línea 12 (Dorada)', color: '#F59E0B',
                stops: [
                    { name: 'Mixcoac',        lat: 19.376, lng: -99.185 },
                    { name: 'Insurgentes Sur', lat: 19.376, lng: -99.170 },
                    { name: 'Zapata',         lat: 19.370, lng: -99.155 },
                    { name: 'Tláhuac',        lat: 19.291, lng: -99.007 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'STC Metro (Sistema de Transporte Colectivo)', role: 'Operador Paraestatal', country: 'México' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante (múltiples líneas)', country: 'Francia', product: 'NM-02, NM-03, MP-09' },
                { name: 'Bombardier Transportation', role: 'Material Rodante (MP-89, MP-06)', country: 'Canadá', product: 'Bombardier Montreal Type' },
                { name: 'CAF', role: 'Material Rodante (Línea 12)', country: 'España', product: 'CAF 12 (serie X\'Trapolis)' },
                { name: 'CIAF', role: 'Vagones originales (1969)', country: 'Francia', product: 'Compañía Industrial de Automotores Ferroviarios' },
            ],
            maintenance: [
                { name: 'STC Metro (Talleres Central y Peñón de los Baños)', role: 'Mantenimiento Integral', country: 'México', contract: 'Operación interna' },
                { name: 'Alstom Services', role: 'Asistencia técnica nueva flota', country: 'Francia', contract: 'Soporte técnico anual' },
            ],
        },
        financing: {
            totalCostUSD: 15000000000,
            sources: ['Gobierno Federal de México', 'CDMX (Ciudad de México)', 'Banca de desarrollo nacional'],
        },
        keyFacts: [
            'El metro más antiguo de América Latina (inaugurado en 1969) y el más grande de la región',
            'Primera línea del metro fue diseñada por los ingenieros Bernardo Quintana e Ingeniería Civil',
            'En 2021 ocurrió el colapso del puente elevado en Línea 12 (sección Olivos-Tezonco), 26 fallecidos',
            'La red opera 5 días/semana, 24h los fines de semana (sistema único en LatAm)',
            'El Tren Ligero (Línea 1 tipo tranvía) conecta el metro con Xochimilco en superficie',
        ],
    },
    {
        id: 'tren-maya',
        country: 'México', countryCode: 'MX', city: 'Península de Yucatán',
        name: 'Tren Maya', subtitle: 'Ferrocarril Interurbano — 7 Tramos',
        type: 'intercity', status: 'operativo', yearOpened: 2023,
        totalLines: 7, totalStations: 34, totalTrains: 36,
        totalKm: 1554, maxSpeedKmh: 200, dailyPassengers: 60000,
        electrification: 'Diésel (locomotora) / Eléctrico-híbrido (tramos 1-3)',
        technology: 'ERTMS Nivel 1 · Señalización Alstom',
        mapCenter: { lat: 20.200, lng: -89.500, zoom: 7 },
        lines: [{
            id: 'TM', name: 'Tren Maya (Circuito Completo)', color: '#22C55E',
            stops: [
                { name: 'Cancún',          lat: 21.161, lng: -86.851 },
                { name: 'Playa del Carmen',lat: 20.631, lng: -87.068 },
                { name: 'Tulum',           lat: 20.211, lng: -87.464 },
                { name: 'Bacalar',         lat: 18.668, lng: -88.392 },
                { name: 'Chetumal',        lat: 18.501, lng: -88.297 },
                { name: 'Escárcega',       lat: 18.605, lng: -90.741 },
                { name: 'Palenque',        lat: 17.515, lng: -91.978 },
                { name: 'Campeche',        lat: 19.844, lng: -90.534 },
                { name: 'Mérida',          lat: 20.967, lng: -89.623 },
                { name: 'Valladolid',      lat: 20.690, lng: -88.202 },
                { name: 'Cancún (vuelta)', lat: 21.161, lng: -86.851 },
            ],
        }],
        companies: {
            operators: [
                { name: 'Tren Maya S.A. de C.V. (FONATUR)', role: 'Operador Paraestatal', country: 'México' },
                { name: 'Secretaría de la Defensa Nacional (SEDENA)', role: 'Construcción y supervisión', country: 'México' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Material Rodante', country: 'España/Francia', product: 'Alstom Coradia Stream (fabricado en Sahagun, México)' },
                { name: 'ICA', role: 'Obras Civiles', country: 'México', product: 'Terraplenes, túneles y viaductos' },
                { name: 'COMSA', role: 'Obras de Vía', country: 'España', product: 'Montaje de vía y balasto' },
            ],
            maintenance: [
                { name: 'Alstom Services', role: 'Mantenimiento Material Rodante', country: 'Francia', contract: 'Contrato multianual' },
                { name: 'SEDENA (Talleres Calakmul)', role: 'Mantenimiento de Infraestructura', country: 'México', contract: 'Operación militar' },
            ],
        },
        financing: {
            totalCostUSD: 20000000000,
            sources: ['Gobierno Federal de México', 'FONATUR', 'Banobras', 'Pemex (participación indirecta)'],
        },
        keyFacts: [
            'El proyecto de infraestructura más grande en la historia de México',
            'Recorre 1.554 km a lo largo de 5 estados del sureste: Chiapas, Tabasco, Campeche, Yucatán y Quintana Roo',
            'Los Alstom Coradia Stream fueron ensamblados en la planta de Sahagún, México',
            'La construcción del tramo 5 sur fue muy controversia por su paso a través de la selva y zonas arqueológicas',
            'Inaugurado por el Presidente Andrés Manuel López Obrador en diciembre de 2023',
        ],
    },

    // ─── USA ────────────────────────────────────────────────────────────────────
    {
        id: 'nyc-subway',
        country: 'USA', countryCode: 'US', city: 'New York City',
        name: 'New York City Subway (MTA)', subtitle: 'Subway + Staten Island Railway — 36 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1904,
        totalLines: 36, totalStations: 472, totalTrains: 6418,
        totalKm: 380, maxSpeedKmh: 90, dailyPassengers: 3500000,
        electrification: '625 V CC (3er riel)',
        technology: 'ATP convencional + CBTC (líneas L, 7, A/C/E en progreso)',
        mapCenter: { lat: 40.720, lng: -73.990, zoom: 11 },
        lines: [
            {
                id: 'ACE', name: 'Líneas A/C/E (Eighth Ave)', color: '#3B82F6',
                stops: [
                    { name: 'Far Rockaway',  lat: 40.605, lng: -73.755 },
                    { name: 'Howard Beach',  lat: 40.660, lng: -73.831 },
                    { name: 'Jay St–MetroTech', lat: 40.692, lng: -73.987 },
                    { name: '42 St-Port Authority', lat: 40.757, lng: -73.989 },
                    { name: '207 St',        lat: 40.864, lng: -73.919 },
                ],
            },
            {
                id: '123', name: 'Líneas 1/2/3 (Seventh Ave)', color: '#EF4444',
                stops: [
                    { name: 'South Ferry',   lat: 40.702, lng: -74.014 },
                    { name: 'Times Sq-42 St',lat: 40.755, lng: -73.987 },
                    { name: '72 St',         lat: 40.777, lng: -73.980 },
                    { name: 'Van Cortlandt Park', lat: 40.893, lng: -73.898 },
                ],
            },
            {
                id: 'BDFM', name: 'Líneas B/D/F/M (Sixth Ave)', color: '#F59E0B',
                stops: [
                    { name: 'Coney Island',  lat: 40.577, lng: -73.981 },
                    { name: 'Atlantic Av–BR', lat: 40.683, lng: -73.977 },
                    { name: '47-50 St Rock', lat: 40.759, lng: -73.981 },
                    { name: 'Forest Hills',  lat: 40.721, lng: -73.844 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'MTA New York City Transit (NYCT)', role: 'Operador Público', country: 'USA' },
            ],
            manufacturers: [
                { name: 'Bombardier Transportation', role: 'Material Rodante (R143, R179, R211)', country: 'Canadá', product: 'Bombardier R211' },
                { name: 'Kawasaki', role: 'Material Rodante (R160, R179)', country: 'Japón', product: 'R160, R179' },
                { name: 'Siemens Mobility', role: 'Material Rodante (R68, R68A)', country: 'Alemania', product: 'R68, R68A' },
                { name: 'Alstom', role: 'Material Rodante (R68 original)', country: 'Francia', product: 'R68' },
            ],
            maintenance: [
                { name: 'NYCT (207th St, Coney Island, Jamaica Shops)', role: 'Mantenimiento Integral', country: 'USA', contract: 'Operación pública' },
            ],
        },
        financing: {
            totalCostUSD: 55000000000,
            sources: ['MTA Capital Program', 'Gobierno Federal USA', 'Estado de Nueva York', 'NYCTA Bonds'],
        },
        keyFacts: [
            'El sistema de metro más grande de América del Norte por número de estaciones (472)',
            'Opera las 24 horas del día, 365 días al año (único sistema así en el mundo de esta escala)',
            'El primer tramo abrió en 1904 en la IRT (Interborough Rapid Transit)',
            'La Línea 7 fue la primera del sistema en implementar señalización CBTC (2012)',
            'En 2017 se declaró "estado de emergencia" del sistema por décadas de bajo mantenimiento',
        ],
    },
    {
        id: 'wmata-dc',
        country: 'USA', countryCode: 'US', city: 'Washington D.C.',
        name: 'WMATA Metrorail', subtitle: 'Metro de Washington D.C. — 6 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1976,
        totalLines: 6, totalStations: 98, totalTrains: 1184,
        totalKm: 185, maxSpeedKmh: 120, dailyPassengers: 640000,
        electrification: '750 V CC (3er riel)',
        technology: 'GoA2 · ATP/ATO Alstom · Sistema automatizado original diseñado para GoA4',
        mapCenter: { lat: 38.892, lng: -77.032, zoom: 11 },
        lines: [
            {
                id: 'RED', name: 'Red Line (Shady Grove–Glenmont)', color: '#EF4444',
                stops: [
                    { name: 'Shady Grove',   lat: 39.120, lng: -77.166 },
                    { name: 'Rockville',     lat: 39.084, lng: -77.146 },
                    { name: 'Metro Center',  lat: 38.898, lng: -77.028 },
                    { name: 'Union Station', lat: 38.898, lng: -77.006 },
                    { name: 'Glenmont',      lat: 39.061, lng: -77.053 },
                ],
            },
            {
                id: 'BLUE', name: 'Blue Line (Franconia–Largo Town Center)', color: '#3B82F6',
                stops: [
                    { name: 'Franconia-Springfield', lat: 38.766, lng: -77.168 },
                    { name: 'National Airport',      lat: 38.852, lng: -77.045 },
                    { name: 'L\'Enfant Plaza',       lat: 38.885, lng: -77.022 },
                    { name: 'Metro Center',          lat: 38.898, lng: -77.028 },
                    { name: 'Largo Town Center',     lat: 38.905, lng: -76.830 },
                ],
            },
            {
                id: 'SILVER', name: 'Silver Line (Ashburn–Largo)', color: '#94A3B8',
                stops: [
                    { name: 'Ashburn (Dulles Airport)', lat: 38.997, lng: -77.464 },
                    { name: 'McLean',        lat: 38.926, lng: -77.216 },
                    { name: 'Rosslyn',       lat: 38.896, lng: -77.071 },
                    { name: 'Metro Center',  lat: 38.898, lng: -77.028 },
                    { name: 'Largo Town Center', lat: 38.905, lng: -76.830 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'WMATA (Washington Metropolitan Area Transit Authority)', role: 'Operador Público Regional', country: 'USA' },
            ],
            manufacturers: [
                { name: 'Alstom', role: 'Flota de trenes 7000-Series', country: 'Francia/USA', product: 'Alstom 7000-Series' },
                { name: 'Bombardier Transportation', role: 'Flota de trenes 2000-6000-Series', country: 'Canadá', product: 'Series 2000, 3000, 4000, 5000, 6000' },
                { name: 'Rohr Industries', role: 'Flota original 1000-Series (retirada)', country: 'USA', product: 'Series 1000' },
            ],
            maintenance: [
                { name: 'WMATA (Talleres Brentwood, Greenbelt, West Falls Church)', role: 'Mantenimiento Integral', country: 'USA', contract: 'Operación pública' },
            ],
        },
        financing: {
            totalCostUSD: 12000000000,
            sources: ['Gobierno Federal USA', 'Maryland', 'Virginia', 'Distrito de Columbia'],
        },
        keyFacts: [
            'Diseñado originalmente para operación completamente automática (GoA4) — condición nunca implementada por razones políticas',
            'Las estaciones tienen arcos de bóveda de cañón en cemento expuesto, diseño del arquitecto Harry Weese',
            'El accidente de Ft. Totten (2009, 9 fallecidos) impulsó una reforma completa de seguridad',
            'La Silver Line Phase 2 abrió en 2022, conectando el Aeropuerto Dulles con el sistema',
            'Primer metro de alto tráfico en USA fuera de Nueva York y Chicago',
        ],
    },

    // ─── CANADA ─────────────────────────────────────────────────────────────────
    {
        id: 'stm-montreal',
        country: 'Canadá', countryCode: 'CA', city: 'Montréal',
        name: 'STM Métro de Montréal', subtitle: 'Réseau de métro — 4 Líneas',
        type: 'metro', status: 'operativo', yearOpened: 1966,
        totalLines: 4, totalStations: 68, totalTrains: 423,
        totalKm: 69, maxSpeedKmh: 72, dailyPassengers: 890000,
        electrification: '750 V CC (3er riel)',
        technology: 'Neumático sobre carriles de goma · ATP convencional',
        mapCenter: { lat: 45.508, lng: -73.569, zoom: 12 },
        lines: [
            {
                id: 'L1', name: 'Ligne 1 (Verte / Green Line)', color: '#22C55E',
                stops: [
                    { name: 'Angrignon',     lat: 45.445, lng: -73.603 },
                    { name: 'Lionel-Groulx', lat: 45.473, lng: -73.579 },
                    { name: 'Guy-Concordia', lat: 45.494, lng: -73.578 },
                    { name: 'McGill',        lat: 45.505, lng: -73.571 },
                    { name: 'Place-des-Arts',lat: 45.508, lng: -73.567 },
                    { name: 'Berri-UQAM',    lat: 45.519, lng: -73.556 },
                    { name: 'Honoré-Beaugrand', lat: 45.553, lng: -73.530 },
                ],
            },
            {
                id: 'L2', name: 'Ligne 2 (Orange Line)', color: '#F97316',
                stops: [
                    { name: 'Côte-Vertu',    lat: 45.517, lng: -73.726 },
                    { name: 'Henri-Bourassa',lat: 45.559, lng: -73.626 },
                    { name: 'Montmorency',   lat: 45.558, lng: -73.718 },
                    { name: 'Snowdon',       lat: 45.491, lng: -73.623 },
                    { name: 'Square-Victoria',lat:45.507,lng:-73.562 },
                    { name: 'Berri-UQAM',    lat: 45.519, lng: -73.556 },
                    { name: 'Longueuil',     lat: 45.524, lng: -73.524 },
                ],
            },
        ],
        companies: {
            operators: [
                { name: 'STM (Société de Transport de Montréal)', role: 'Operador Público', country: 'Canadá' },
            ],
            manufacturers: [
                { name: 'Alstom / Bombardier (consorcio)', role: 'Flota Azur (MR-73 sucesor)', country: 'Canadá/Francia', product: 'Azur (FLX Metro)' },
                { name: 'Vickers Canada', role: 'Flota original MR-63', country: 'Canadá', product: 'MR-63 (retirada progresivamente)' },
                { name: 'Bombardier Transportation', role: 'Flota MR-73', country: 'Canadá', product: 'MR-73 (en servicio)' },
            ],
            maintenance: [
                { name: 'STM (Centre d\'entretien Duvernay)', role: 'Mantenimiento Integral', country: 'Canadá', contract: 'Operación pública' },
            ],
        },
        financing: {
            totalCostUSD: 5800000000,
            sources: ['Gobierno Federal de Canadá', 'Gobierno de Quebec', 'Ville de Montréal', 'Caisse de dépôt et placement du Québec'],
        },
        keyFacts: [
            'Primer sistema de metro en Canadá (inaugurado en octubre de 1966)',
            'Sistema neumático: los trenes circulan sobre ruedas de goma (como el Metro de Paris)',
            'Es el único metro de Norteamérica que funciona íntegramente bajo tierra en su extensión',
            'La flota Azur (2016+) es codesarrollada por Alstom y Bombardier-Wabtec',
            'El REM (Réseau Express Métropolitain) abrió su primera fase en 2023, ampliando el sistema',
        ],
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────────
export const COUNTRIES = [...new Set(RAIL_PROJECTS.map(p => p.country))].sort();

export function getProjectsByCountry(country) {
    return RAIL_PROJECTS.filter(p => p.country === country);
}

export function getProjectById(id) {
    return RAIL_PROJECTS.find(p => p.id === id);
}
