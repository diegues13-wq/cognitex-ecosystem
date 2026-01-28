import { subDays, format, addHours } from 'date-fns';

export const LOCATIONS = [
    { id: 'MACH-01', name: 'CNC Lathe X1', area: 'Machining', type: 'CNC', baseTemp: 45, baseVib: 2.5 },
    { id: 'MACH-02', name: 'Hydraulic Press', area: 'Stamping', type: 'Press', baseTemp: 55, baseVib: 4.0 },
    { id: 'ROBO-01', name: 'Kuka Arm A', area: 'Assembly', type: 'Robot', baseTemp: 35, baseVib: 0.5 },
    { id: 'CONV-01', name: 'Main Conveyor', area: 'Logistics', type: 'Motor', baseTemp: 40, baseVib: 1.2 },
    { id: 'INJ-01', name: 'Injection Molder', area: 'Plastics', type: 'Molder', baseTemp: 210, baseVib: 1.8 },
];

export function generateHistoricalData(days = 100, readingsPerDay = 24, machineId = 'MACH-01') {
    const mach = LOCATIONS.find(l => l.id === machineId) || LOCATIONS[0];
    const data = [];
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const intervalHours = 24 / readingsPerDay;

    let currentDate = startDate;
    let baseTemp = mach.baseTemp;
    let accumulatedOEE = 0; // Cumulative counts
    let totalParts = 0;

    for (let i = 0; i < days * readingsPerDay; i++) {
        const hour = currentDate.getHours();
        // Machines run 2 shifts: 6 AM to 10 PM
        const isRunning = hour >= 6 && hour <= 22;

        // Random Noise
        const noise = (Math.random() - 0.5) * 5;

        // Temperature (Higher when running)
        let temp = baseTemp + (isRunning ? 15 : 0) + noise;

        // Vibration (mm/s) - Only when running
        let vib = isRunning ? mach.baseVib + (Math.random() * 0.5) : 0.1;

        // RPM / Load
        let rpm = isRunning ? 1500 + (Math.random() * 200) : 0;

        // Power (Watts)
        let power = isRunning ? 4000 + (Math.random() * 500) : 200;

        // Anomalies
        let isAnomaly = Math.random() < 0.05;
        if (isAnomaly) {
            const type = Math.floor(Math.random() * 3);
            if (type === 0) temp += 30; // Overheating
            if (type === 1) vib += 5;   // Bearing fault
            if (type === 2) rpm = 0;    // Stall
        }

        // OEE Simulation (Availability * Performance * Quality)
        let oee = isRunning ? 85 + (Math.random() * 10) : 0;
        if (isAnomaly) oee -= 40;

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'MMM dd HH:mm'),
            temp: parseFloat(temp.toFixed(1)),
            humidity: 0, // Legacy support
            vpd: parseFloat(vib.toFixed(2)), // Mapping VIBRATION to VPD slot for charts temporarily
            co2: Math.round(power), // Mapping POWER to CO2 slot
            battery: Math.round(oee), // Mapping OEE to Battery slot
            rssi: Math.round(rpm), // Mapping RPM to RSSI
            gdd: 0
        });

        currentDate = addHours(currentDate, intervalHours);
    }

    return data;
}

export function generateLast24hData(machineId = 'MACH-01') {
    const mach = LOCATIONS.find(l => l.id === machineId) || LOCATIONS[0];
    const data = [];
    const now = new Date();
    const startDate = subDays(now, 1);
    let currentDate = startDate;

    for (let i = 0; i < 24; i++) {
        const hour = currentDate.getHours();
        const isRunning = hour >= 6 && hour <= 22;

        let temp = mach.baseTemp + (isRunning ? 12 : 0) + ((Math.random() - 0.5) * 2);
        let vib = isRunning ? mach.baseVib + (Math.random() * 0.3) : 0;
        let power = isRunning ? 4100 + (Math.random() * 200) : 150;
        let rpm = isRunning ? 2800 + (Math.random() * 50) : 0;
        let oee = isRunning ? 92 : 0;

        // Occasional spike
        if (Math.random() < 0.1) vib += 2;

        data.push({
            timestamp: currentDate.toISOString(),
            displayDate: format(currentDate, 'HH:mm'),
            temp: parseFloat(temp.toFixed(1)),
            vpd: parseFloat(vib.toFixed(2)), // Vibration
            co2: Math.round(power), // Power (Watts)
            battery: Math.round(oee), // OEE %
            rssi: Math.round(rpm), // RPM
        });
        currentDate = addHours(currentDate, 1);
    }
    return data;
}
