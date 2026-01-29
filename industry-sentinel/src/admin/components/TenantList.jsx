import React from 'react';
import { MOCK_TENANTS } from '../data';
import { Users, Server, HardDrive, DollarSign } from 'lucide-react';

const TenantList = () => {
    return (
        <div className="bg-[#1a1f2e] p-6 rounded-lg border border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" /> Organization Management
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-cyan-500/70 border-b border-cyan-900/30">
                            <th className="pb-3 px-4">Organization</th>
                            <th className="pb-3 px-4">Plan</th>
                            <th className="pb-3 px-4">Status</th>
                            <th className="pb-3 px-4">Sensors</th>
                            <th className="pb-3 px-4 text-right">Usage (Calls)</th>
                            <th className="pb-3 px-4 text-right">Est. Bill</th>
                            <th className="pb-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody className="text-cyan-100">
                        {MOCK_TENANTS.map((tenant) => (
                            <tr key={tenant.id} className="border-b border-cyan-900/20 hover:bg-cyan-900/20 transition-colors">
                                <td className="py-4 px-4 font-medium">{tenant.name}</td>
                                <td className="py-4 px-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${tenant.plan === 'Enterprise' ? 'border-purple-500 text-purple-400 bg-purple-500/10' :
                                            tenant.plan === 'Pro' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' :
                                                'border-gray-500 text-gray-400 bg-gray-500/10'
                                        }`}>
                                        {tenant.plan}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${tenant.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'
                                        }`}></span>
                                    {tenant.status}
                                </td>
                                <td className="py-4 px-4 flex items-center gap-2">
                                    <Server className="w-4 h-4 text-cyan-600" /> {tenant.sensors}
                                </td>
                                <td className="py-4 px-4 text-right font-mono text-cyan-200/80">
                                    {tenant.usage.api_calls.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-green-400">
                                    ${tenant.usage.monthly_cost.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <button className="text-cyan-500 hover:text-cyan-300 text-sm underline">Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TenantList;
