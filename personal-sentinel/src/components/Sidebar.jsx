import React from 'react';
import PropTypes from 'prop-types';
import { LayoutDashboard, Sprout, Thermometer, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
    return (
        <aside className="w-64 bg-industrial-800 border-r border-industrial-700 flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6 border-b border-industrial-700">
                <div className="flex items-center gap-2">
                    <Sprout className="text-primary w-8 h-8" />
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                        Agro-Sentinel
                    </h1>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <NavItem icon={<LayoutDashboard />} label="Overview" active />
                <NavItem icon={<Thermometer />} label="Sensors" />
                <NavItem icon={<Settings />} label="Settings" />
            </nav>

            <div className="p-4 border-t border-industrial-700">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-industrial-700 flex items-center justify-center text-sm font-bold">
                        {user.name[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-industrial-700 rounded transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

Sidebar.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired
    }).isRequired,
    onLogout: PropTypes.func.isRequired
};

function NavItem({ icon, label, active }) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-gray-400 hover:bg-industrial-700 hover:text-white'
            }`}>
            {React.cloneElement(icon, { size: 20 })}
            <span className="font-medium">{label}</span>
        </button>
    );
}

NavItem.propTypes = {
    icon: PropTypes.element.isRequired,
    label: PropTypes.string.isRequired,
    active: PropTypes.bool
};
