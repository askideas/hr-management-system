import { Search, Bell } from 'lucide-react';

function Header() {
  return (
    <header className="top-header">
      <div className="header-search">
        <Search className="search-icon" />
        <input type="text" placeholder="Search" />
      </div>
      <div className="header-actions">
        <Bell size={20} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }} />
        <div className="user-avatar">AD</div>
      </div>
    </header>
  );
}

export default Header;
