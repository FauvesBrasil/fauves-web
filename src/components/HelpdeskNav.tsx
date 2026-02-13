import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Users, BookOpen, BarChart3 } from 'lucide-react';

const HelpdeskNav = () => {
    const location = useLocation();

    const navItems = [
        { to: '/admin/helpdesk', label: 'Overview', icon: BarChart3, exact: true },
        { to: '/admin/helpdesk/tickets', label: 'Tickets', icon: MessageSquare },
        { to: '/admin/helpdesk/live-chat', label: 'Live Chat', icon: Users },
        { to: '/admin/helpdesk/knowledge-base', label: 'Central de Ajuda', icon: BookOpen },
    ];

    return (
        <div className="bg-white border-b border-slate-200 mb-6">
            <div className="flex gap-1 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${isActive
                                    ? 'border-indigo-600 text-indigo-600 font-medium'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default HelpdeskNav;
