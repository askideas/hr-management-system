import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Clock, Calendar, Download } from 'lucide-react';

function Reports() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalShifts: 0,
    presentToday: 0
  });

  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  
  const [dateRangeType, setDateRangeType] = useState('today');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const fetchStatsAndEmployees = async () => {
    setLoading(true);
    try {
      const empSnap = await getDocs(collection(db, 'employees'));
      const empData = empSnap.docs.map(doc => doc.data());
      setEmployees(empData);

      const shiftSnap = await getDocs(collection(db, 'shifts'));
      
      const attSnap = await getDocs(collection(db, `attendance/${getTodayStr()}/records`));
      let presentCount = 0;
      attSnap.docs.forEach(doc => {
        if (doc.data().status === 'Present') presentCount++;
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
    fetchStatsAndEmployees();
  }, []);

  const calculateDateRange = () => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch(dateRangeType) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'this_week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6: 1); // adjust when day is sunday
        start.setDate(diff);
        break;
      case 'last_week':
        start.setDate(today.getDate() - today.getDay() - 6);
        end.setDate(today.getDate() - today.getDay());
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this_year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last_year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        if(customFromDate && customToDate) {
          start = new Date(customFromDate);
          end = new Date(customToDate);
        }
        break;
      default:
        break;
    }
    return { 
      startDate: start.toISOString().split('T')[0], 
      endDate: end.toISOString().split('T')[0] 
    };
  };

  const generateReport = async () => {
    if (dateRangeType === 'custom' && (!customFromDate || !customToDate)) {
      alert("Please select both from and to dates.");
      return;
    }

    setReportLoading(true);
    const { startDate, endDate } = calculateDateRange();
    
    // Generate dates array between start and end date (inclusive, up to today max if generating this year to avoid useless future queries)
    const datesToFetch = [];
    let currDate = new Date(startDate);
    const endBound = new Date(endDate);
    const absoluteMax = new Date(); // don't fetch future dates
    const safeEndBound = endBound > absoluteMax ? absoluteMax : endBound;

    while (currDate <= safeEndBound) {
      datesToFetch.push(currDate.toISOString().split('T')[0]);
      currDate.setDate(currDate.getDate() + 1);
    }

    try {
      const recordsMap = {}; // { empId: { present: 0, absent: 0, leave: 0 } }
      
      // Initialize zero state
      employees.forEach(emp => {
        recordsMap[emp.empId] = { empId: emp.empId, name: emp.name, department: emp.department, present: 0, absent: 0, leave: 0, total: 0 };
      });

      // Split into chunks to avoid too many simultaneous requests
      const chunkSize = 15;
      for (let i = 0; i < datesToFetch.length; i += chunkSize) {
        const chunk = datesToFetch.slice(i, i + chunkSize);
        const promises = chunk.map(dateStr => getDocs(collection(db, `attendance/${dateStr}/records`)));
        const snaps = await Promise.all(promises);
        
        snaps.forEach(snap => {
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (recordsMap[data.empId]) {
              if (data.status === 'Present') recordsMap[data.empId].present++;
              if (data.status === 'Absent') recordsMap[data.empId].absent++;
              if (data.status === 'Leave') recordsMap[data.empId].leave++;
              recordsMap[data.empId].total++;
            }
          });
        });
      }

      setReportData(Object.values(recordsMap));
    } catch(err) {
      console.error(err);
      alert("Error generating report");
    }
    setReportLoading(false);
  };

  useEffect(() => {
    if (employees.length > 0 && dateRangeType !== 'custom') {
      generateReport();
    }
  }, [dateRangeType, employees]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading reports data...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h3>Attendance Report</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              className="form-control" 
              style={{ width: 'auto', minWidth: '150px' }}
              value={dateRangeType}
              onChange={(e) => {
                setDateRangeType(e.target.value);
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Date</option>
            </select>

            {dateRangeType === 'custom' && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="date" 
                  className="form-control" 
                  style={{ width: 'auto' }}
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                />
                <span style={{ color: '#64748b' }}>to</span>
                <input 
                  type="date" 
                  className="form-control"
                  style={{ width: 'auto' }}
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                />
                <button className="btn btn-primary" onClick={generateReport}>Generate</button>
              </div>
            )}

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '120px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>
            
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Total Recorded</th>
              </tr>
            </thead>
            <tbody>
              {reportLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Fetching report data...</td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">No attendance records found for this period.</div>
                  </td>
                </tr>
              ) : (
                reportData
                  .filter(row => {
                    if (statusFilter === 'All') return true;
                    if (statusFilter === 'Present') return row.present > 0;
                    if (statusFilter === 'Absent') return row.absent > 0;
                    if (statusFilter === 'Leave') return row.leave > 0;
                    return true;
                  })
                  .map((row) => (
                    <tr key={row.empId}>
                      <td><strong>{row.empId}</strong></td>
                      <td>{row.name}</td>
                      <td>{row.department}</td>
                      <td>{row.present > 0 ? <span className="badge badge-success">{row.present}</span> : <span style={{ color: '#cbd5e1' }}>0</span>}</td>
                      <td>{row.absent > 0 ? <span className="badge badge-danger" style={{backgroundColor: '#fee2e2', color: '#991b1b'}}>{row.absent}</span> : <span style={{ color: '#cbd5e1' }}>0</span>}</td>
                      <td>{row.leave > 0 ? <span className="badge badge-warning">{row.leave}</span> : <span style={{ color: '#cbd5e1' }}>0</span>}</td>
                      <td>{row.total}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
