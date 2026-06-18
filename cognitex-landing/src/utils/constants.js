import { Sprout, Factory, UserCheck, Train } from 'lucide-react';

export const APPS = [
    {
        id: 'agro',
        name: 'Agro Sentinel',
        description: 'Monitoreo de cultivos de precisión y control de drones.',
        icon: Sprout,
        color: 'from-emerald-400 to-green-600',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/20',
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
        bg: 'bg-cyan-500/20',
        border: 'border-cyan-500/20',
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
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/20',
        path: '/personal',
        port: 5176,
        url: 'https://personal.cognitexindustrial.com'
    },
    {
        id: 'transport',
        name: 'Transport Sentinel',
        description: 'Gestión ferroviaria inteligente: flota, puntualidad OTP y mantenimiento RAMS.',
        icon: Train,
        color: 'from-blue-400 to-violet-600',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/20',
        path: '/transport',
        port: 5177,
        url: 'https://transport.cognitexindustrial.com'
    }
];
