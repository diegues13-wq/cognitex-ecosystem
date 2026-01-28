import React from 'react';
import { BrainCircuit, Activity } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-white/5 py-12 bg-industrial-950 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h5 className="text-white font-bold mb-4 flex items-center gap-2"><BrainCircuit size={18} className="text-neon-purple" /> Neural Engine</h5>
                    <p className="text-gray-500 text-sm">Processing 1.2M events/sec across distributed edge nodes.</p>
                </div>
                <div>
                    <h5 className="text-white font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-neon-green" /> System Status</h5>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        ALL SYSTEMS NOMINAL
                    </div>
                </div>
                <div className="col-span-2 text-right text-gray-600 text-xs font-mono">
                    <p>© 2026 COGNITEX INDUSTRIAL INC. | PRIVACY | TERMS</p>
                    <p className="mt-2">PART OF THE SENTINEL NETWORK</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
