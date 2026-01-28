import { subDays, format, addHours } from 'date-fns';

export const LOCATIONS = [
    { id: 'WRK-001', name: 'J. Perez', area: 'Foundry', role: 'Welder', baseHR: 85, baseFatigue: 10 },
    { id: 'WRK-002', name: 'M. Rodriguez', area: 'Assembly', role: 'Foreman', baseHR: 75, baseFatigue: 5 },
    { id: 'WRK-003', name: 'A. Smith', area: 'Logistics', role: 'Driver', baseHR: 72, baseFatigue: 15 },
    { id: 'WRK-004', name: 'L. Chen', area: 'Chemicals', role: 'Chemist', baseHR: 68, baseFatigue: 5 },
    { id: 'WRK-005', name: 'K. Ivanov', area: 'High Voltage', role: 'Electrician', baseHR: 80, baseFatigue: 8 },
];

export function generateHistoricalData(days = 100, readingsPerDay = 24, workerId = 'WRK-001') {
    const worker = LOCATIONS.find(l => l.id === workerId) || LOCATIONS[0];
    const data = [];
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const intervalHours = 24 / readingsPerDay;

    let currentDate = startDate;

    for (let i = 0; i < days * readingsPerDay; i++) {
        const hour = currentDate.getHours();
        // Shift: 8 AM to 5 PM
        const isWorking = hour >= 8 && hour <= 17;

        let hr = isWorking ? worker.baseHR + (Math.random() * 20) : 60 + (Math.random() * 10);
        let fatigue = isWorking ? worker.baseFatigue + ((hour - 8) * 5) + (Math.random() * 5) : 0;
        let bodyTemp = 36.5 + (Math.random() * 0.5);
        if (isWorking) bodyTemp += 0.3;

        // Anomaly
        if (Math.random() < 0.02 && isWorking) {
            hr += 40; // Stress Spike
            bodyTemp += 1.0; // Fever / Heat Stress
        }

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'MMM dd HH:mm'),
            temp: parseFloat(bodyTemp.toFixed(1)), // Mapping BodyTemp to TEMP
            humidity: Math.round(fatigue), // Mapping Fatigue to HUMIDITY
            vpd: Math.round(hr), // Mapping HeartRate to VPD
            co2: isWorking ? 1 : 0, // ManDown Status (0=OK, 1=Active) - actually inverted logic for simplicity
            battery: Math.round(90 - (isWorking ? (hour - 8) * 5 : 0)), // Battery of wearable
            rssi: -60,
            gdd: 0
        });

        currentDate = addHours(currentDate, intervalHours);
    }

    return data;
}

export function generateLast24hData(workerId = 'WRK-001') {
    const worker = LOCATIONS.find(l => l.id === workerId) || LOCATIONS[0];
    const data = [];
    const now = new Date();
    const startDate = subDays(now, 1);
    let currentDate = startDate;

    for (let i = 0; i < 24; i++) {
        const hour = currentDate.getHours();
        const isWorking = hour >= 8 && hour <= 17;

        let hr = isWorking ? worker.baseHR + (Math.random() * 25) : 65 + (Math.random() * 10);
        let fatigue = isWorking ? worker.baseFatigue + ((hour - 8) * 6) : 5;
        let bodyTemp = 36.6 + (Math.random() * 0.4);

        // Random Spike
        if (Math.random() < 0.1 && isWorking) hr += 15;

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'HH:mm'),
            temp: parseFloat(bodyTemp.toFixed(1)),
            vpd: Math.round(hr), // Heart Rate
            humidity: Math.round(fatigue), // Fatigue %
            co2: 0, // Man Down Alert (0 = Safe)
            battery: Math.round(100 - (isWorking ? (hour - 8) * 8 : 0)),
            rssi: -55
        });
        currentDate = addHours(currentDate, 1);
    }
    return data;
}
