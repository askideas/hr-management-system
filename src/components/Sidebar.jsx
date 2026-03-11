import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Clock, FileText } from 'lucide-react';

function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/attendance', icon: Calendar, label: 'Attendance' },
    { to: '/shifts', icon: Clock, label: 'Shifts' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>HR</span>
        System
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
