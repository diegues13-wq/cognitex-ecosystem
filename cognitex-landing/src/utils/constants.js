import { Sprout, Factory, UserCheck } from 'lucide-react';

export const APPS = [
    {
        id: 'agro',
        name: 'Agro Sentinel',
        description: 'Monitoreo de cultivos de precisión y control de drones.',
        icon: Sprout,
        color: 'from-emerald-400 to-green-600',
        path: '/agro',
        port: 5174,
        url: 'https://agro.cognitexindustrial.com'
    },
    {
        id: 'industry',
        name: 'Industry Sentinel',
        description: 'Mantenimiento predictivo y gemelos digitales de fábrica.',
        icon: Factory,
        color: 'from-cyan-400 to-blue-600',
        path: '/industry',
        port: 5175,
        url: 'https://industry.cognitexindustrial.com'
    },
    {
        id: 'personal',
        name: 'Personal Sentinel',
        description: 'Seguridad laboral y monitoreo biométrico en tiempo real.',
        icon: UserCheck,
        color: 'from-orange-400 to-amber-600',
        path: '/personal',
        port: 5176,
        url: 'https://personal.cognitexindustrial.com'
    }
];
