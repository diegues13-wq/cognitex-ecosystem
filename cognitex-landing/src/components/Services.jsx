import React from 'react';
import { BrainCircuit, Activity, Cpu, Factory } from 'lucide-react';
import SectionHeader from './common/SectionHeader';

const Services = ({ t }) => {
    return (
        <section id="services" className="py-24 px-6 relative z-10">
            <SectionHeader 
                kicker={t.title}
                title={t.subtitle}
            />

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {t.items.map((service, idx) => {
                    // Map icon name string to content component
                    const Icon =
                        service.icon === 'BrainCircuit' ? BrainCircuit :
                            service.icon === 'Activity' ? Activity :
                                service.icon === 'Cpu' ? Cpu : Factory;

                    return (
                        <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 bg-industrial-900 rounded-lg flex items-center justify-center mb-6 text-neon-cyan group-hover:text-white transition-colors">
                                <Icon size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3">{service.title}</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">{service.desc}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default Services;
