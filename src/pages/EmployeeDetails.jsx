import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingShift, setSavingShift] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      // Fetch Employee
      const empRef = doc(db, 'employees', id);
      const empSnap = await getDoc(empRef);

      if (empSnap.exists()) {
        setEmployee(empSnap.data());
      } else {
        alert("Employee not found");
        navigate('/employees');
      }

      // Fetch Shifts
      const shiftSnap = await getDocs(collection(db, 'shifts'));
      const shiftsData = shiftSnap.docs.map(s => ({ id: s.id, ...s.data() }));
      setShifts(shiftsData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchAssignmentForMonth = async () => {
    try {
      const assignRef = doc(db, `shiftAssignments/${selectedMonth}/assignments`, id);
      const assignSnap = await getDoc(assignRef);
      if (assignSnap.exists()) {
        setSelectedShift(assignSnap.data().shiftId);
      } else {
        setSelectedShift('');
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    if (employee && selectedMonth) {
      fetchAssignmentForMonth();
    }
  }, [selectedMonth, employee]);

  const handleAssignShift = async () => {
    if (!selectedMonth) {
      alert("Please select a month."); return; 
    }
    setSavingShift(true);
    try {
      // Use setDoc to create/overwrite the specific employee's assignment for that month
      await setDoc(doc(db, `shiftAssignments/${selectedMonth}/assignments`, id), {
        empId: id,
        shiftId: selectedShift,
        assignedAt: new Date().toISOString()
      });
      alert(`Shift assigned successfully for ${selectedMonth}!`);
    } catch (error) {
      console.error("Error updating shift: ", error);
      alert("Failed to assign shift.");
    } finally {
      setSavingShift(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading employee details...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/employees')}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Employee Details</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'revert', gap: '1.5rem', maxWidth: '800px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Profile Information</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, max-content) 1fr', gap: '1rem' }}>
              <div style={{ color: '#5c5f62' }}>Employee ID</div>
              <div><strong>{employee.empId}</strong></div>
              
              <div style={{ color: '#5c5f62' }}>Name</div>
              <div>{employee.name}</div>
              
              <div style={{ color: '#5c5f62' }}>Department</div>
              <div>{employee.department}</div>
              
              <div style={{ color: '#5c5f62' }}>Role</div>
              <div>{employee.role}</div>

              <div style={{ color: '#5c5f62' }}>Mobile Number</div>
              <div>{employee.mobile}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Assign Shift</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1fr', gap: '1rem' }}>
              <div>
                <label>Month</label>
                <input 
                  type="month" 
                  className="form-control" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                />
              </div>

              <div>
                <label>Select Shift for Month</label>
                <select 
                  className="form-control" 
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  <option value="">-- No Shift Assigned --</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shiftName} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" disabled={savingShift} onClick={handleAssignShift}>
              {savingShift ? <><Loader2 className="animate-spin" size={16} /> Assigning...</> : <><Save size={16} /> Assign Shift</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetails;
