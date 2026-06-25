import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
 
function AdminPage() {
    const [users, setUsers] = useState([]);
    const [gestiuni, setGestiuni] = useState([]);
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [responsiblePersons, setResponsiblePersons] = useState([]);
 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
 

    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddType, setQuickAddType] = useState('gestiune');
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddEmail, setQuickAddEmail] = useState('');
    const [quickAddError, setQuickAddError] = useState(null);
    const [quickAddSaving, setQuickAddSaving] = useState(false);
 
    const { user, logout } = useAuth();
    const navigate = useNavigate();
 
    useEffect(() => {
        fetchAll();
    }, []);
 
    const fetchAll = async () => {
        try {
            setLoading(true);
            const [usersRes, gestRes, locRes, catRes, respRes] = await Promise.all([
                api.get('/user'),
                api.get('/gestiune'),
                api.get('/location'),
                api.get('/category'),
                api.get('/responsibleperson')
            ]);
            setUsers(usersRes.data);
            setGestiuni(gestRes.data);
            setLocations(locRes.data);
            setCategories(catRes.data);
            setResponsiblePersons(respRes.data);
        } catch (err) {
            if (err.response?.status === 401) {
                logout();
                navigate('/login');
            }
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };
 
    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            await api.delete('/user/logout', { data: { token: refreshToken } });
        } catch (err) {
            // logout locally even if request fails
        } finally {
            logout();
            navigate('/login');
        }
    };
 
    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/user/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };
 
    const quickAddEndpoints = {
        gestiune: '/gestiune',
        location: '/location',
        category: '/category',
        responsibleperson: '/responsibleperson'
    };
 
    const quickAddLabels = {
        gestiune: 'Gestiune',
        location: 'Location',
        category: 'Category',
        responsibleperson: 'Responsible Person'
    };
 
    const openQuickAddModal = () => {
        setQuickAddType('gestiune');
        setQuickAddName('');
        setQuickAddEmail('');
        setQuickAddError(null);
        setShowQuickAddModal(true);
    };
 
    const closeQuickAddModal = () => {
        setShowQuickAddModal(false);
    };
 
    const handleQuickAddSubmit = async (e) => {
        e.preventDefault();
        setQuickAddError(null);
 
        if (!quickAddName.trim()) {
            setQuickAddError('Name is required');
            return;
        }
 
        setQuickAddSaving(true);
 
        try {
            const payload = quickAddType === 'responsibleperson'
                ? { name: quickAddName.trim(), email: quickAddEmail.trim() || undefined }
                : { name: quickAddName.trim() };
 
            await api.post(quickAddEndpoints[quickAddType], payload);
 
            if (quickAddType === 'gestiune') {
                const res = await api.get('/gestiune');
                setGestiuni(res.data);
            } else if (quickAddType === 'location') {
                const res = await api.get('/location');
                setLocations(res.data);
            } else if (quickAddType === 'category') {
                const res = await api.get('/category');
                setCategories(res.data);
            } else if (quickAddType === 'responsibleperson') {
                const res = await api.get('/responsibleperson');
                setResponsiblePersons(res.data);
            }
 
            setQuickAddName('');
            setQuickAddEmail('');
        } catch (err) {
            setQuickAddError(err.response?.data?.error || 'Failed to create');
        } finally {
            setQuickAddSaving(false);
        }
    };
 
    const refreshQuickAddList = async (type) => {
        if (type === 'gestiune') {
            const res = await api.get('/gestiune');
            setGestiuni(res.data);
        } else if (type === 'location') {
            const res = await api.get('/location');
            setLocations(res.data);
        } else if (type === 'category') {
            const res = await api.get('/category');
            setCategories(res.data);
        } else if (type === 'responsibleperson') {
            const res = await api.get('/responsibleperson');
            setResponsiblePersons(res.data);
        }
    };
 
    const handleQuickAddDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        setQuickAddError(null);
        try {
            await api.delete(`${quickAddEndpoints[quickAddType]}/${id}`);
            await refreshQuickAddList(quickAddType);
        } catch (err) {
            setQuickAddError(
                err.response?.data?.error ||
                'Could not delete — this entry is probably still assigned to an item.'
            );
        }
    };
 
    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }
 
    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }
 
    return (
        <div>
            <nav className="navbar navbar-dark bg-dark px-4">
                <span className="navbar-brand fw-bold">InvObi — Admin</span>
                <div className="d-flex align-items-center gap-3">
                    <span className="text-light small">Hello, {user?.username}</span>
                    <button onClick={() => navigate('/items')} className="btn btn-outline-light btn-sm">
                        Go to Items
                    </button>
                    <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
                        Logout
                    </button>
                </div>
            </nav>
 
            <div className="container py-4">

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h2 className="mb-0">Users</h2>
                    <button className="btn btn-outline-primary" onClick={openQuickAddModal}>
                        + Manage Lists
                    </button>
                </div>
 
                {users.length === 0 ? (
                    <div className="text-center text-muted py-5 bg-white rounded">
                        No users found.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover bg-white rounded shadow-sm">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`badge ${u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            {u.id === user?.id ? (
                                                <span className="text-muted small">You</span>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteUser(u.id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
 
            {showQuickAddModal && (
                <>
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Manage Lists</h5>
                                    <button type="button" className="btn-close" onClick={closeQuickAddModal}></button>
                                </div>
                                <form onSubmit={handleQuickAddSubmit}>
                                    <div className="modal-body">
                                        {quickAddError && <div className="alert alert-danger">{quickAddError}</div>}
 
                                        <div className="mb-3">
                                            <label className="form-label">Type</label>
                                            <select
                                                className="form-select"
                                                value={quickAddType}
                                                onChange={(e) => {
                                                    setQuickAddType(e.target.value);
                                                    setQuickAddName('');
                                                    setQuickAddEmail('');
                                                }}
                                            >
                                                <option value="gestiune">Gestiune</option>
                                                <option value="location">Location</option>
                                                <option value="category">Category</option>
                                                <option value="responsibleperson">Responsible Person</option>
                                            </select>
                                        </div>
 
                                        <div className="mb-3">
                                            <label className="form-label">Name</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={quickAddName}
                                                onChange={(e) => setQuickAddName(e.target.value)}
                                                required
                                            />
                                        </div>
 
                                        {quickAddType === 'responsibleperson' && (
                                            <div className="mb-3">
                                                <label className="form-label">Email (optional)</label>
                                                <input
                                                    className="form-control"
                                                    type="email"
                                                    value={quickAddEmail}
                                                    onChange={(e) => setQuickAddEmail(e.target.value)}
                                                />
                                            </div>
                                        )}
 
                                        <div className="mt-3">
                                            <label className="form-label small text-muted">
                                                Existing {quickAddLabels[quickAddType]}s
                                            </label>
                                            <ul className="list-group">
                                                {(quickAddType === 'gestiune' ? gestiuni
                                                    : quickAddType === 'location' ? locations
                                                    : quickAddType === 'category' ? categories
                                                    : responsiblePersons
                                                ).map(entry => (
                                                    <li
                                                        key={entry.id}
                                                        className="list-group-item py-1 small d-flex justify-content-between align-items-center"
                                                    >
                                                        <span>{entry.name}</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleQuickAddDelete(entry.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeQuickAddModal}>
                                            Close
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={quickAddSaving}>
                                            {quickAddSaving ? 'Adding...' : 'Add'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </>
            )}
        </div>
    );
}
 
export default AdminPage;
 