import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Loader2 } from 'lucide-react';

function Shifts() {
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'definitions'
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Definitions State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingDef, setSavingDef] = useState(false);
  const [formData, setFormData] = useState({ shiftName: '', startTime: '', endTime: '' });
  
  // Assignments State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('All');
  const [assignments, setAssignments] = useState({}); // { empId: shiftId }
  const [savingAssignment, setSavingAssignment] = useState(null); // tracking empId being saved
  
  const [loading, setLoading] = useState(true);

  // Initial Fetch: Shifts and Employees
  useEffect(() => {
    const fetchBaseData = async () => {
      setLoading(true);
      try {
        const shiftsSnap = await getDocs(collection(db, 'shifts'));
        const shiftsData = shiftsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShifts(shiftsData);

        const empSnap = await getDocs(collection(db, 'employees'));
        const empData = empSnap.docs.map(doc => doc.data());
        setEmployees(empData);
      } catch (error) {
        console.error("Error fetching base data:", error);
      }
      setLoading(false);
    };
    fetchBaseData();
  }, []);

  // Fetch Assignments when month changes
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedMonth) return;
      try {
        const querySnapshot = await getDocs(collection(db, `shiftAssignments/${selectedMonth}/assignments`));
        const currentAssignments = {};
        querySnapshot.docs.forEach(doc => {
          currentAssignments[doc.id] = doc.data().shiftId;
        });
        setAssignments(currentAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, [selectedMonth]);

  // Handle saving generic shift
  const handleSaveShiftDef = async (e) => {
    e.preventDefault();
    setSavingDef(true);
    try {
      await addDoc(collection(db, 'shifts'), formData);
      setIsModalOpen(false);
      // refetch shifts
      const shiftsSnap = await getDocs(collection(db, 'shifts'));
      setShifts(shiftsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error adding shift:", error);
      alert("Failed to add shift.");
    } finally {
      setSavingDef(false);
    }
  };

  // Handle assigning an employee a shift for the selected month
  const handleAssignShift = async (empId, shiftId) => {
    if (!selectedMonth) {
      alert("Please select a month first.");
      return;
    }
    
    setSavingAssignment(empId);
    
    // Optimistic UI update
    setAssignments(prev => ({ ...prev, [empId]: shiftId }));
    
    try {
      await setDoc(doc(db, `shiftAssignments/${selectedMonth}/assignments`, empId), {
        empId,
        shiftId,
        assignedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error assigning shift:", error);
      alert("Failed to save assignment.");
      // Revert if failed (simple version doesn't perfectly revert, but good enough for now)
    } finally {
      setSavingAssignment(null);
    }
  };

  // Filter employees for Assignment Tab
  const filteredEmployees = employees.filter(emp => {
    const empShiftId = assignments[emp.empId];
    if (selectedShiftFilter !== 'All') {
      if (selectedShiftFilter === 'Unassigned') {
        return !empShiftId;
      }
      return empShiftId === selectedShiftFilter;
    }
    return true;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'block' }}>
        <h1 className="page-title">Manage Shifts</h1>
        
        {/* Custom Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <button 
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.95rem',
              fontWeight: activeTab === 'assignments' ? 600 : 500, 
              color: activeTab === 'assignments' ? '#2563eb' : '#64748b', 
              borderBottom: activeTab === 'assignments' ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-1px'
            }}
            onClick={() => setActiveTab('assignments')}
          >
            Employee Assignments
          </button>
          <button 
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.95rem',
              fontWeight: activeTab === 'definitions' ? 600 : 500, 
              color: activeTab === 'definitions' ? '#2563eb' : '#64748b', 
              borderBottom: activeTab === 'definitions' ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-1px'
            }}
            onClick={() => setActiveTab('definitions')}
          >
            Shift Definitions
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}>Loading data...</div>
      ) : (
        <>
          {activeTab === 'assignments' && (
            <div className="card">
              <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Month Wise Assignment</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Month:</label>
                    <input 
                      type="month" 
                      className="form-control" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)} 
                      style={{ width: 'auto' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Filter By Shift:</label>
                    <select 
                      className="form-control" 
                      style={{ width: 'auto', minWidth: '150px' }}
                      value={selectedShiftFilter}
                      onChange={(e) => setSelectedShiftFilter(e.target.value)}
                    >
                      <option value="All">All Employees</option>
                      <option value="Unassigned">Unassigned</option>
                      {shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>{shift.shiftName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Assigned Shift ({selectedMonth})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          <div className="empty-state">No employees match your filter.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.empId}>
                          <td><strong>{emp.empId}</strong></td>
                          <td>{emp.name}</td>
                          <td>{emp.department}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <select 
                                className="form-control" 
                                value={assignments[emp.empId] || ''} 
                                onChange={(e) => handleAssignShift(emp.empId, e.target.value)}
                                disabled={savingAssignment === emp.empId}
                                style={{ maxWidth: '250px', backgroundColor: assignments[emp.empId] ? '#f1f5f9' : '#fff' }}
                              >
                                <option value="">-- Select Shift --</option>
                                {shifts.map((shift) => (
                                  <option key={shift.id} value={shift.id}>
                                    {shift.shiftName} ({shift.startTime} - {shift.endTime})
                                  </option>
                                ))}
                              </select>
                              {savingAssignment === emp.empId && <Loader2 className="animate-spin" size={16} color="#2563eb" />}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'definitions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setFormData({ shiftName: '', startTime: '', endTime: '' });
                  setIsModalOpen(true);
                }}>
                  <Plus size={16} /> Add Shift Definition
                </button>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Shift Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.length === 0 ? (
                        <tr>
                          <td colSpan="3">
                            <div className="empty-state">No shift definitions found. Create one above!</div>
                          </td>
                        </tr>
                      ) : (
                        shifts.map((shift) => (
                          <tr key={shift.id}>
                            <td><strong style={{ color: '#2563eb' }}>{shift.shiftName}</strong></td>
                            <td>{shift.startTime}</td>
                            <td>{shift.endTime}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {isModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>Add Shift Definition</h3>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', border: 'none', boxShadow: 'none' }}
                        onClick={() => setIsModalOpen(false)}
                      >&times;</button>
                    </div>
                    <form onSubmit={handleSaveShiftDef}>
                      <div className="modal-body">
                        <div className="form-group">
                          <label>Shift Name</label>
                          <input type="text" className="form-control" required placeholder="e.g., Morning Shift"
                            value={formData.shiftName} onChange={(e) => setFormData({...formData, shiftName: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Start Time</label>
                          <input type="time" className="form-control" required
                            value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>End Time</label>
                          <input type="time" className="form-control" required
                            value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" disabled={savingDef} onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={savingDef}>
                          {savingDef ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save Shift'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Shifts;
