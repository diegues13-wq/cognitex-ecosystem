import { Sprout, Factory, Users } from 'lucide-react';

export const APPS = [
    {
        id: 'agro',
        title: 'Agro-Sentinel',
        subtitle: 'Precision Agriculture',
        description: 'AI-driven monitoring for crop health, pest prediction, and environmental control.',
        icon: Sprout,
        color: 'text-neon-green',
        bg: 'bg-neon-green/10',
        border: 'border-neon-green/20',
        port: 5174,
    },
    {
        id: 'industry',
        title: 'Industry-Sentinel',
        subtitle: 'Manufacturing 4.0',
        description: 'Real-time OEE tracking, predictive maintenance (RUL), and process automation.',
        icon: Factory,
        color: 'text-neon-cyan',
        bg: 'bg-neon-cyan/10',
        border: 'border-neon-cyan/20',
        port: 5175,
    },
    {
        id: 'personal',
        title: 'Personal-Sentinel',
        subtitle: 'Workforce EHS',
        description: 'Biometric safety monitoring, fatigue prediction, and smart workforce allocation.',
        icon: Users,
        color: 'text-neon-orange',
        bg: 'bg-neon-orange/10',
        border: 'border-neon-orange/20',
        port: 5176,
    }
];
