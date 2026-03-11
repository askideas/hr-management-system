import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import Shifts from './pages/Shifts';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetails />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
