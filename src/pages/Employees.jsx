import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    empId: '',
    name: '',
    department: '',
    role: '',
    mobile: ''
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeesData = querySnapshot.docs.map(doc => doc.data());
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = () => {
    // Generate unique number
    const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData({
      empId: uniqueId,
      name: '',
      department: '',
      role: '',
      mobile: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Document ID is with employee id only
      await setDoc(doc(db, 'employees', formData.empId), formData);
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={16} /> Add Employee
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
                <th>Role</th>
                <th>Mobile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">No employees found.</div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.empId}>
                    <td><strong>{emp.empId}</strong></td>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.role}</td>
                    <td>{emp.mobile}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate(`/employees/${emp.empId}`)}
                      >
                        View
                      </button>
                    </td>
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
              <h3>Add Employee</h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', border: 'none', boxShadow: 'none' }}
                onClick={() => setIsModalOpen(false)}
              >&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" className="form-control" value={formData.empId} disabled />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" className="form-control" required 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" className="form-control" required
                    value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" className="form-control" required
                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="text" className="form-control" required
                    value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
