import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Loader2 } from 'lucide-react';

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [shifts, setShifts] = useState({});
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(null);
  const [savingAll, setSavingAll] = useState(false);

  // Use today's date formatted as YYYY-MM-DD
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = todayDate.substring(0, 7); // YYYY-MM

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const empSnap = await getDocs(collection(db, 'employees'));
      const empData = empSnap.docs.map(doc => doc.data());
      setEmployees(empData);

      // Fetch today's attendance
      const attSnap = await getDocs(collection(db, `attendance/${todayDate}/records`));
      const attData = {};
      attSnap.docs.forEach(doc => {
        attData[doc.id] = doc.data().status;
      });
      setAttendance(attData);

      // Fetch shifts
      const shiftSnap = await getDocs(collection(db, 'shifts'));
      const shiftsMap = {};
      shiftSnap.docs.forEach(doc => {
        shiftsMap[doc.id] = doc.data();
      });
      setShifts(shiftsMap);

      // Fetch assignments for the current month
      const assignSnap = await getDocs(collection(db, `shiftAssignments/${currentMonth}/assignments`));
      const assignData = {};
      assignSnap.docs.forEach(doc => {
        assignData[doc.id] = doc.data().shiftId;
      });
      setAssignments(assignData);

    } catch (error) {
      console.error("Error fetching data: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (empId, status) => {
    setSavingStatus(empId);
    try {
      await setDoc(doc(db, `attendance/${todayDate}/records`, empId), {
        empId,
        status,
        date: todayDate,
        timestamp: new Date().toISOString()
      });
      setAttendance({ ...attendance, [empId]: status });
    } catch (error) {
      console.error("Error updating attendance: ", error);
      alert("Failed to update status.");
    } finally {
      setSavingStatus(null);
    }
  };

  const markAllAsPresent = async () => {
    setSavingAll(true);
    try {
      const newAtt = { ...attendance };
      for (const emp of employees) {
        if (!newAtt[emp.empId]) {
          await setDoc(doc(db, `attendance/${todayDate}/records`, emp.empId), {
            empId: emp.empId,
            status: 'Present',
            date: todayDate,
            timestamp: new Date().toISOString()
          });
          newAtt[emp.empId] = 'Present';
        }
      }
      setAttendance(newAtt);
      alert("Marked remaining as present.");
    } catch (error) {
      console.error("Error marking all as present: ", error);
      alert("Failed to mark all as present.");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance - {todayDate}</h1>
          <p style={{ color: '#5c5f62', marginTop: '0.5rem' }}>Mark daily attendance for your employees.</p>
        </div>
        <button className="btn btn-primary" onClick={markAllAsPresent} disabled={savingAll}>
          {savingAll ? <><Loader2 className="animate-spin" size={16} /> Marking...</> : <><CheckCircle size={16} /> Mark Remaining Present</>}
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Shift Information</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">No employees found.</div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const shiftId = assignments[emp.empId];
                  const shiftDef = shiftId ? shifts[shiftId] : null;

                  return (
                    <tr key={emp.empId}>
                      <td><strong>{emp.empId}</strong></td>
                      <td>{emp.name}</td>
                      <td>{emp.department}</td>
                      <td>
                        {shiftDef ? (
                          <>
                            <div style={{ fontWeight: 600, color: '#334155' }}>{shiftDef.shiftName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {shiftDef.startTime} - {shiftDef.endTime}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select 
                            className="form-control" 
                            value={attendance[emp.empId] || ''} 
                            onChange={(e) => handleStatusChange(emp.empId, e.target.value)}
                            disabled={savingStatus === emp.empId}
                            style={{ maxWidth: '200px', backgroundColor: 
                              attendance[emp.empId] === 'Present' ? '#dcfce7' : 
                              attendance[emp.empId] === 'Absent' ? '#fee2e2' : 
                              attendance[emp.empId] === 'Leave' ? '#fef9c3' : 'white',
                              color: attendance[emp.empId] ? '#0f172a' : 'inherit'
                            }}
                          >
                            <option value="">-- Select Status --</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Leave">Leave</option>
                          </select>
                          {savingStatus === emp.empId && <Loader2 className="animate-spin" size={16} color="#2563eb" />}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
