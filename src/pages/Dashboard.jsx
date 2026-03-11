import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Clock, Calendar } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalShifts: 0,
    presentToday: 0
  });

  const [loading, setLoading] = useState(true);
  const todayDate = new Date().toISOString().split('T')[0];

  const fetchStats = async () => {
    setLoading(true);
    try {
      const empSnap = await getDocs(collection(db, 'employees'));
      const shiftSnap = await getDocs(collection(db, 'shifts'));
      const attSnap = await getDocs(collection(db, `attendance/${todayDate}/records`));
      
      let presentCount = 0;
      attSnap.docs.forEach(doc => {
        if (doc.data().status === 'Present') {
          presentCount++;
        }
      });

      setStats({
        totalEmployees: empSnap.size,
        totalShifts: shiftSnap.size,
        presentToday: presentCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}>Loading dashboard data...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: '#e4e5e7', padding: '1rem', borderRadius: '8px' }}>
                <Users size={24} color="#202223" />
              </div>
              <div>
                <div style={{ color: '#5c5f62', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Employees</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalEmployees}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: '#e4e5e7', padding: '1rem', borderRadius: '8px' }}>
                <Clock size={24} color="#202223" />
              </div>
              <div>
                <div style={{ color: '#5c5f62', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Shifts</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalShifts}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: '#e4e5e7', padding: '1rem', borderRadius: '8px' }}>
                <Calendar size={24} color="#202223" />
              </div>
              <div>
                <div style={{ color: '#5c5f62', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Present Today</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.presentToday}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3>Welcome</h3>
            <p style={{ marginTop: '1rem', color: '#5c5f62' }}>
              This is your HR Management System overview. Use the sidebar to manage employees, shifts, and attendance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
