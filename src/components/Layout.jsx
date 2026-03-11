import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
