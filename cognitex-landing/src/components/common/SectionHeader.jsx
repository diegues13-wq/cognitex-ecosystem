import React from 'react';
import { motion } from 'framer-motion';

const SectionHeader = ({ kicker, title, description, alignment = 'center', className = '' }) => {
    const alignClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';
    const margins = alignment === 'center' ? 'mb-16 md:mb-24' : 'mb-12';

    return (
        <div className={`${alignClass} ${margins} ${className} w-full`}>
            {kicker && (
                <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-neon-cyan font-mono text-sm tracking-[0.3em] mb-4 uppercase font-bold"
                >
                    {kicker}
                </motion.h3>
            )}
            {title && (
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight leading-tight"
                >
                    {title}
                </motion.h2>
            )}
            {description && (
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className={`text-gray-400 text-lg leading-relaxed ${alignment === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}
                >
                    {description}
                </motion.p>
            )}
        </div>
    );
};

export default SectionHeader;
