import { subDays, format, addHours } from 'date-fns';

export const LOCATIONS = [
    { id: 'GH-AMB-01', name: 'Finca Ambato', city: 'Ambato', region: 'SIERRA', lat: -1.2491, lng: -78.6168, baseTemp: 15, baseHum: 50 },
    { id: 'GH-DUR-01', name: 'Agro Duran', city: 'Duran', region: 'COAST', lat: -2.1701, lng: -79.8220, baseTemp: 28, baseHum: 75 },
    { id: 'GH-CAY-01', name: 'Flores Cayambe', city: 'Cayambe', region: 'SIERRA', lat: 0.0414, lng: -78.1452, baseTemp: 12, baseHum: 55 },
    { id: 'GH-ORO-01', name: 'Bananera El Oro', city: 'Machala', region: 'COAST', lat: -3.2581, lng: -79.9605, baseTemp: 26, baseHum: 80 },
    { id: 'GH-TEN-01', name: 'Selva Viva Tena', city: 'Tena', region: 'AMAZON', lat: -0.9938, lng: -77.8129, baseTemp: 24, baseHum: 90 },
];

export function generateHistoricalData(days = 200, readingsPerDay = 12, locationId = 'GH-AMB-01') {
    const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
    const data = [];
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const intervalHours = 24 / readingsPerDay;

    let currentDate = startDate;
    let baseTemp = loc.baseTemp;

    // Helper for GDD
    const calculateGDD = (tMin, tMax, base = 10) => {
        const avg = (tMin + tMax) / 2;
        return Math.max(0, avg - base);
    };

    let accumulatedGDD = 0; // Cumulative counter

    for (let i = 0; i < days * readingsPerDay; i++) {
        // Seasonal Drift (Sine wave over 365 days)
        const dayOfYear = currentDate.getDay();
        const seasonalOffset = 2 * Math.sin((dayOfYear / 365) * 2 * Math.PI); // Less seasoning in Ecuador

        // Daily Cycle (Sine wave over 24 hours)
        const hour = currentDate.getHours();
        const isDay = hour >= 6 && hour <= 18;
        const dailyOffset = 5 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
        const noise = (Math.random() - 0.5) * 2;

        let temp = baseTemp + seasonalOffset + dailyOffset + noise;

        // Humidity (Inverse to Temp but based on region)
        let humidity = loc.baseHum - (dailyOffset * 2.5) + ((Math.random() - 0.5) * 15);
        humidity = Math.max(30, Math.min(99, humidity));

        // CO2 (Day depletion)
        let co2 = isDay ? 400 + (Math.random() * 100) : 600 + (Math.random() * 50);

        // DEVICE HEALTH SIMULATION
        // Battery: Slowly degrading sine wave (charging cycle if solar) or linear drain
        // Assuming solar panel: dips at night, charges at day. Overall trend down if winter.
        let battery = 90 + (5 * Math.sin(((hour - 6) / 24) * 2 * Math.PI)) - (Math.random() * 2);
        battery = Math.max(0, Math.min(100, battery));

        // RSSI: Signal Strength (-30 excellent to -90 poor)
        // Add some random interference
        let rssi = -65 + ((Math.random() - 0.5) * 20); // Fluctuates between -55 and -75 typically

        // INJECT ANOMALIES / ALARMS
        let isAnomaly = Math.random() < 0.15;
        if (i % 50 === 0) isAnomaly = true;

        if (isAnomaly) {
            const anomalyType = Math.floor(Math.random() * 5); // Increased types
            if (anomalyType === 0) temp = baseTemp + 20; // Heat Spike
            if (anomalyType === 1) humidity -= 30; // Dryness
            if (anomalyType === 2) co2 = 2000; // Critical CO2
            if (anomalyType === 3) battery = 15; // Low Battery Alert
            if (anomalyType === 4) rssi = -95; // Connectivity Drop
        }

        // VPD Calculation
        const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const vp = svp * (humidity / 100.0);
        let vpd = Math.max(0, svp - vp);

        // GDD Calculation (Simple approach: hourly contribution / 24)
        // Daily GDD is typically calculated once a day, but for granular data we can accumulate fractional GDD
        // Base temp 10C standard for many crops
        const hourlyGDD = Math.max(0, temp - 10) / 24;
        accumulatedGDD += hourlyGDD;

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'MMM dd HH:mm'),
            temp: parseFloat(temp.toFixed(1)),
            humidity: parseFloat(humidity.toFixed(1)),
            vpd: parseFloat(vpd.toFixed(2)),
            co2: Math.round(co2),
            battery: Math.round(battery),
            rssi: Math.round(rssi),
            gdd: parseFloat(accumulatedGDD.toFixed(1))
        });

        currentDate = addHours(currentDate, intervalHours);
    }

    return data;
}

export function generateLast24hData(locationId = 'GH-AMB-01') {
    const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
    const data = [];
    const now = new Date();
    // Start 24 hours ago
    const startDate = subDays(now, 1);

    let currentDate = startDate;
    let baseTemp = loc.baseTemp + 2; // Slightly warmer live
    // const readings = []; // Unused
    let accumulatedGDD = 1240; // Simulated accumulation from season start

    // We generate hourly data
    for (let i = 0; i < 24; i++) {
        const hour = currentDate.getHours();
        const isDay = hour >= 6 && hour <= 18;
        const dailyOffset = 5 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
        const noise = (Math.random() - 0.5) * 1.5;

        // Anomaly Injection
        let isAnomaly = Math.random() < 0.2;
        let temp = baseTemp + dailyOffset + noise;
        let humidity = loc.baseHum - (dailyOffset * 2.5) + ((Math.random() - 0.5) * 10);
        let co2 = isDay ? 400 + (Math.random() * 100) : 600 + (Math.random() * 50);

        // Device Health
        let battery = 90 + (5 * Math.sin(((hour - 6) / 24) * 2 * Math.PI));
        let rssi = -60 + (Math.random() * 10 - 5);

        if (isAnomaly) {
            const type = Math.floor(Math.random() * 5);
            if (type === 0) temp += 15;
            if (type === 1) humidity -= 25;
            if (type === 2) co2 = 1800;
            if (type === 3) battery = 12; // Critical Battery
            if (type === 4) rssi = -92; // Signal Lost
        }

        // Clamp
        humidity = Math.max(10, Math.min(99, humidity));

        // VPD
        const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        const vp = svp * (humidity / 100.0);
        let vpd = Math.max(0, svp - vp);

        // GDD
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
            battery: Math.round(battery),
            rssi: Math.round(rssi),
            gdd: parseFloat(accumulatedGDD.toFixed(1))
        });

        currentDate = addHours(currentDate, 1);
    }
    return data;
}
