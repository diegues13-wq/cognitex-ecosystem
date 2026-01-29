import React from 'react';
import Sidebar from '../components/Sidebar';
import TenantList from './components/TenantList';
import { Activity, Database, DollarSign, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-[#1a1f2e]/80 backdrop-blur-sm p-6 rounded-lg border border-cyan-900/30 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-gray-400 text-sm">{label}</p>
            <h3 className="text-2xl font-bold text-cyan-100">{value}</h3>
        </div>
    </div>
);

const AdminPage = () => {
    return (
        <div className="flex h-screen bg-[#0a0f1c] text-cyan-100 font-sans overflow-hidden bg-[url('/assets/grid-pattern.png')]">
            <Sidebar user={{ name: 'Super Admin', email: 'admin@cognitex.com' }} />

            <main className="flex-1 overflow-y-auto p-8 relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                            Super Admin Cluster
                        </h1>
                        <p className="text-gray-400">System Status: <span className="text-green-400">Optimized</span></p>
                    </div>
                    <div className="text-right">
                        <div className="bg-purple-900/20 border border-purple-500/30 px-4 py-2 rounded text-purple-300 text-sm font-mono">
                            REGION: us-central1 (GCP)
                        </div>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Activity} label="Active Organizations" value="3" color="text-green-400" />
                    <StatCard icon={Database} label="Total Storage" value="5.5 GB" color="text-blue-400" />
                    <StatCard icon={LayoutDashboard} label="Connected Sensors" value="59" color="text-purple-400" />
                    <StatCard icon={DollarSign} label="Monthly Revenue" value="$398.00" color="text-yellow-400" />
                </div>

                {/* Components */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <TenantList />
                </motion.div>

            </main>
        </div>
    );
};

export default AdminPage;
