import { subDays, format, addHours, addMinutes } from 'date-fns';

export const LOCATIONS = [
    { id: 'GH-AMB-01', name: 'Finca Ambato',      city: 'Ambato',  region: 'SIERRA', lat: -1.2491, lng: -78.6168, baseTemp: 15, baseHum: 50,  crop: 'Rosas',      area_ha: 3.2 },
    { id: 'GH-DUR-01', name: 'Agro Duran',         city: 'Duran',   region: 'COAST',  lat: -2.1701, lng: -79.8220, baseTemp: 28, baseHum: 75,  crop: 'Pimientos',  area_ha: 5.8 },
    { id: 'GH-CAY-01', name: 'Flores Cayambe',     city: 'Cayambe', region: 'SIERRA', lat:  0.0414, lng: -78.1452, baseTemp: 12, baseHum: 55,  crop: 'Gypsophila', area_ha: 2.1 },
    { id: 'GH-ORO-01', name: 'Bananera El Oro',    city: 'Machala', region: 'COAST',  lat: -3.2581, lng: -79.9605, baseTemp: 26, baseHum: 80,  crop: 'Banano',     area_ha: 12.4 },
    { id: 'GH-TEN-01', name: 'Selva Viva Tena',    city: 'Tena',    region: 'AMAZON', lat: -0.9938, lng: -77.8129, baseTemp: 24, baseHum: 90,  crop: 'Cacao',      area_ha: 8.7 },
];

// VPD helper (Magnus formula)
function calcVPD(temp, humidity) {
    const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
    const vp = svp * (humidity / 100.0);
    return Math.max(0, svp - vp);
}

export function generateHistoricalData(days = 200, readingsPerDay = 12, locationId = 'GH-AMB-01') {
    const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
    const data = [];
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const intervalHours = 24 / readingsPerDay;

    let currentDate = startDate;
    const baseTemp = loc.baseTemp;
    let accumulatedGDD = 0;
    let soil_moisture = 65 + (Math.random() * 10);

    for (let i = 0; i < days * readingsPerDay; i++) {
        const dayOfYear = Math.floor(i / readingsPerDay);
        const seasonalOffset = 2 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
        const hour = currentDate.getHours();
        const isDay = hour >= 6 && hour <= 18;
        const solarCurve = isDay ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
        const dailyOffset = 5 * solarCurve;
        const noise = () => (Math.random() - 0.5) * 2;

        let temp = baseTemp + seasonalOffset + dailyOffset + noise();
        let humidity = Math.max(20, Math.min(99, loc.baseHum - (dailyOffset * 2.5) + noise() * 5));
        let co2 = isDay ? 380 + (Math.random() * 120) : 580 + (Math.random() * 80);
        // Soil moisture: slowly drifts, irrigation events bring it back up
        soil_moisture += noise() * 0.3;
        if (i % (readingsPerDay * 3) === 0) soil_moisture = 65 + Math.random() * 10; // irrigation cycle
        soil_moisture = Math.max(25, Math.min(90, soil_moisture));
        // PAR (Photosynthetically Active Radiation) µmol/m²/s
        let par = isDay ? Math.round(solarCurve * (800 + Math.random() * 400)) : 0;
        // Soil EC (electrical conductivity) mS/cm
        let soil_ec = parseFloat((1.2 + noise() * 0.1).toFixed(2));
        // Soil temperature (lags air temp by ~2h)
        let soil_temp = parseFloat((temp - 2 + noise() * 0.5).toFixed(1));
        // Device health
        let battery = Math.max(5, Math.min(100, 85 + (isDay ? 5 : -2) * solarCurve + noise()));
        let rssi = Math.max(-95, Math.min(-30, -62 + noise() * 8));

        // Inject anomalies (exclusive, not cumulative)
        const anomalyRoll = Math.random();
        if (anomalyRoll < 0.03) temp = baseTemp + 20;           // Heat spike
        else if (anomalyRoll < 0.05) humidity = Math.max(10, humidity - 35); // Dryness
        else if (anomalyRoll < 0.06) co2 = 2100 + Math.random() * 300;       // CO2 leak
        else if (anomalyRoll < 0.065) battery = 12;               // Low battery
        else if (anomalyRoll < 0.07) rssi = -93;                  // Signal drop
        else if (i % 80 === 0) soil_moisture = 22;                // Drought stress

        const vpd = calcVPD(temp, humidity);
        const hourlyGDD = Math.max(0, temp - 10) / 24;
        accumulatedGDD += hourlyGDD;

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'MMM dd HH:mm'),
            time: format(currentDate, 'HH:mm'),
            temp: parseFloat(temp.toFixed(1)),
            humidity: parseFloat(humidity.toFixed(1)),
            vpd: parseFloat(vpd.toFixed(2)),
            co2: Math.round(co2),
            soil_moisture: parseFloat(soil_moisture.toFixed(1)),
            par: Math.round(par),
            soil_ec: parseFloat(soil_ec),
            soil_temp: parseFloat(soil_temp),
            battery: Math.round(battery),
            rssi: Math.round(rssi),
            gdd: parseFloat(accumulatedGDD.toFixed(1)),
        });

        currentDate = addHours(currentDate, intervalHours);
    }

    return data;
}

export function generateLast24hData(locationId = 'GH-AMB-01') {
    const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
    const data = [];
    const now = new Date();
    const startDate = subDays(now, 1);
    let currentDate = startDate;
    let accumulatedGDD = 1240;
    let soil_moisture = 62 + (Math.random() * 10);

    for (let i = 0; i < 48; i++) { // 30-min intervals = 48 points / 24h
        const hour = currentDate.getHours();
        const isDay = hour >= 6 && hour <= 18;
        const solarCurve = isDay ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
        const noise = () => (Math.random() - 0.5) * 1.5;

        let temp = loc.baseTemp + 2 + (5 * solarCurve) + noise();
        let humidity = Math.max(20, Math.min(99, loc.baseHum - (solarCurve * 2.5 * 5) + noise() * 3));
        let co2 = isDay ? 380 + Math.random() * 100 : 560 + Math.random() * 60;
        soil_moisture = Math.max(25, Math.min(90, soil_moisture + noise() * 0.2));
        let par = isDay ? Math.round(solarCurve * (750 + Math.random() * 350)) : 0;
        let soil_ec = parseFloat((1.2 + noise() * 0.08).toFixed(2));
        let soil_temp = parseFloat((temp - 2 + noise() * 0.3).toFixed(1));
        let battery = Math.max(10, Math.min(100, 85 + (isDay ? 3 : -1) * solarCurve));
        let rssi = Math.max(-95, Math.min(-30, -60 + noise() * 6));

        const anomalyRoll = Math.random();
        if (anomalyRoll < 0.04) temp += 15;
        else if (anomalyRoll < 0.06) humidity = Math.max(12, humidity - 25);
        else if (anomalyRoll < 0.065) co2 = 1900;
        else if (anomalyRoll < 0.07) battery = 11;
        else if (anomalyRoll < 0.075) rssi = -91;

        const vpd = calcVPD(temp, humidity);
        const hourlyGDD = Math.max(0, temp - 10) / 48;
        accumulatedGDD += hourlyGDD;

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'MMM dd HH:mm'),
            time: format(currentDate, 'HH:mm'),
            temp: parseFloat(temp.toFixed(1)),
            humidity: parseFloat(humidity.toFixed(1)),
            vpd: parseFloat(vpd.toFixed(2)),
            co2: Math.round(co2),
            soil_moisture: parseFloat(soil_moisture.toFixed(1)),
            par: Math.round(par),
            soil_ec: parseFloat(soil_ec),
            soil_temp: parseFloat(soil_temp),
            battery: Math.round(battery),
            rssi: Math.round(rssi),
            gdd: parseFloat(accumulatedGDD.toFixed(1)),
        });

        currentDate = addMinutes(currentDate, 30);
    }
    return data;
}

// Generates a single new live point based on the previous reading (for real-time ticker)
export function generateNextPoint(lastPoint, locationId) {
    const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
    const now = new Date();
    const hour = now.getHours();
    const isDay = hour >= 6 && hour <= 18;
    const solarCurve = isDay ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
    const noise = () => (Math.random() - 0.5) * 0.8;

    let temp = parseFloat(Math.max(5, Math.min(45, lastPoint.temp + noise())).toFixed(1));
    let humidity = parseFloat(Math.max(20, Math.min(99, lastPoint.humidity + noise() * 1.5)).toFixed(1));
    let co2 = Math.round(Math.max(300, Math.min(2500, lastPoint.co2 + (Math.random() - 0.5) * 15)));
    let soil_moisture = parseFloat(Math.max(20, Math.min(92, lastPoint.soil_moisture + noise() * 0.3)).toFixed(1));
    let par = isDay ? Math.round(Math.max(0, Math.min(2000, lastPoint.par + (Math.random() - 0.5) * 40))) : 0;
    let soil_ec = parseFloat(Math.max(0.3, Math.min(3, lastPoint.soil_ec + noise() * 0.02)).toFixed(2));
    let soil_temp = parseFloat(Math.max(5, Math.min(40, lastPoint.soil_temp + noise() * 0.3)).toFixed(1));
    let battery = parseFloat(Math.max(0, Math.min(100, lastPoint.battery + (isDay ? 0.15 : -0.08))).toFixed(0));
    let rssi = Math.round(Math.max(-95, Math.min(-30, lastPoint.rssi + (Math.random() - 0.5) * 4)));

    const vpd = calcVPD(temp, humidity);
    const gdd = parseFloat((lastPoint.gdd + Math.max(0, temp - 10) / 288).toFixed(1));

    return {
        timestamp: now.toISOString(),
        displayDate: format(now, 'MMM dd HH:mm'),
        time: format(now, 'HH:mm'),
        temp, humidity, vpd: parseFloat(vpd.toFixed(2)),
        co2, soil_moisture, par, soil_ec, soil_temp,
        battery: parseInt(battery), rssi, gdd,
    };
}
