import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const STATUS_OPTIONS = ['ACTIVE', 'MOVED', 'DECOMMISSIONED', 'UNAVAILABLE'];

function ItemsPage() {
    const [items, setItems] = useState([]);
    const [gestiuni, setGestiuni] = useState([]);
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [responsiblePersons, setResponsiblePersons] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gestiuneFilter, setGestiuneFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [responsibleFilter, setResponsibleFilter] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formError, setFormError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);

    const [form, setForm] = useState({
        name: '',
        inventoryNumber: '',
        description: '',
        status: 'ACTIVE',
        cost: '',
        gestiuneId: '',
        locationId: '',
        responsibleId: '',
        categoryId: ''
    });

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [itemsRes, gestRes, locRes, catRes, respRes] = await Promise.all([
                api.get('/items'),
                api.get('/gestiune'),
                api.get('/location'),
                api.get('/category'),
                api.get('/responsibleperson')
            ]);
            setItems(itemsRes.data);
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/items/${id}`);
            setItems(items.filter(item => item.id !== id));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete item');
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

    const openCreateModal = () => {
        setEditingItem(null);
        setForm({
            name: '',
            inventoryNumber: '',
            description: '',
            status: 'ACTIVE',
            cost: '',
            gestiuneId: '',
            locationId: '',
            responsibleId: '',
            categoryId: ''
        });
        setFormError(null);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            inventoryNumber: item.inventoryNumber,
            description: item.description || '',
            status: item.status,
            cost: item.cost != null ? item.cost.toString() : '',
            gestiuneId: item.gestiuneId,
            locationId: item.locationId,
            responsibleId: item.responsibleId,
            categoryId: item.categoryId || ''
        });
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const openHistoryModal = (item) => {
        setHistoryItem(item);
        setShowHistoryModal(true);
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setHistoryItem(null);
    };

    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const errors = [];

        if (!form.name.trim()) errors.push('Name is required');
        if (!form.inventoryNumber.trim()) errors.push('Inventory number is required');
        if (form.inventoryNumber && !/^[A-Za-z0-9-]+$/.test(form.inventoryNumber.trim())) {
            errors.push('Inventory number can only contain letters, numbers, and hyphens');
        }
        if (!form.gestiuneId) errors.push('Gestiune is required');
        if (!form.locationId) errors.push('Location is required');
        if (!form.responsibleId) errors.push('Responsible person is required');
        if (form.cost && (isNaN(form.cost) || parseFloat(form.cost) < 0)) {
            errors.push('Cost must be a positive number');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        const errors = validateForm();
        if (errors.length > 0) {
            setFormError(errors.join('. '));
            return;
        }

        setSaving(true);

        const payload = {
            name: form.name.trim(),
            inventoryNumber: form.inventoryNumber.trim(),
            description: form.description.trim(),
            status: form.status,
            cost: form.cost ? parseFloat(form.cost) : null,
            gestiuneId: parseInt(form.gestiuneId),
            locationId: parseInt(form.locationId),
            responsibleId: parseInt(form.responsibleId),
            categoryId: form.categoryId ? parseInt(form.categoryId) : null
        };

        try {
            if (editingItem) {
                const response = await api.put(`/items/${editingItem.id}`, payload);
                setItems(items.map(i => i.id === editingItem.id ? response.data : i));
            } else {
                await api.post('/items', payload);
                await fetchAll();
            }
            closeModal();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to save item');
        } finally {
            setSaving(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.inventoryNumber.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesGestiune = !gestiuneFilter || item.gestiuneId === parseInt(gestiuneFilter);
        const matchesLocation = !locationFilter || item.locationId === parseInt(locationFilter);
        const matchesResponsible = !responsibleFilter || item.responsibleId === parseInt(responsibleFilter);
        return matchesSearch && matchesStatus && matchesGestiune && matchesLocation && matchesResponsible;
    });

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setGestiuneFilter('');
        setLocationFilter('');
        setResponsibleFilter('');
    };

    const anyFilterActive = search || statusFilter || gestiuneFilter || locationFilter || responsibleFilter;

    const totalCount = filteredItems.length;
    const totalValue = filteredItems.reduce(
        (sum, item) => sum + (item.cost != null ? Number(item.cost) : 0),
        0
    );
    const statusCounts = STATUS_OPTIONS.reduce((acc, status) => {
        acc[status] = filteredItems.filter(i => i.status === status).length;
        return acc;
    }, {});

    const escapeCsv = (value) => {
        const str = value == null ? '' : String(value);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const handleExportCSV = () => {
        const headers = [
            'Inventory Number', 'Name', 'Description', 'Cost', 'Status',
            'Gestiune', 'Location', 'Category', 'Responsible'
        ];

        const rows = filteredItems.map(item => [
            item.inventoryNumber,
            item.name,
            item.description || '',
            item.cost != null ? Number(item.cost).toFixed(2) : '',
            item.status,
            item.gestiune?.name || '',
            item.location?.name || '',
            item.category?.name || '',
            item.responsible?.name || ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(escapeCsv).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `inventory-report-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-success';
            case 'MOVED': return 'bg-warning text-dark';
            case 'DECOMMISSIONED': return 'bg-danger';
            case 'UNAVAILABLE': return 'bg-secondary';
            default: return 'bg-light text-dark';
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
                <span className="navbar-brand fw-bold">InvObi</span>
                <div className="d-flex align-items-center gap-3">
                    <span className="text-light small">Hello, {user?.username}</span>
                    {user?.role === 'ADMIN' && (
                        <button onClick={() => navigate('/admin')} className="btn btn-outline-light btn-sm">
                            Admin
                        </button>
                    )}
                    <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h2 className="mb-0">Items</h2>
                    <div className="d-flex gap-2 flex-wrap">
                        <button className="btn btn-outline-success" onClick={handleExportCSV}>
                            Export CSV
                        </button>
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            + Add Item
                        </button>
                    </div>
                </div>

                <div className="row g-2 mb-3">
                    <div className="col-6 col-md-3">
                        <div className="card text-center shadow-sm">
                            <div className="card-body py-2">
                                <div className="text-muted small">Total Items</div>
                                <div className="fs-5 fw-bold">{totalCount}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card text-center shadow-sm">
                            <div className="card-body py-2">
                                <div className="text-muted small">Total Value</div>
                                <div className="fs-5 fw-bold">€{totalValue.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card text-center shadow-sm">
                            <div className="card-body py-2">
                                <div className="text-muted small">Active</div>
                                <div className="fs-5 fw-bold text-success">{statusCounts.ACTIVE}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card text-center shadow-sm">
                            <div className="card-body py-2">
                                <div className="text-muted small">Decommissioned</div>
                                <div className="fs-5 fw-bold text-danger">{statusCounts.DECOMMISSIONED}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex gap-2 mb-4 flex-wrap">
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Search by name or inventory number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: '260px' }}
                    />
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ maxWidth: '180px' }}
                    >
                        <option value="">All statuses</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        value={gestiuneFilter}
                        onChange={(e) => setGestiuneFilter(e.target.value)}
                        style={{ maxWidth: '200px' }}
                    >
                        <option value="">All gestiuni</option>
                        {gestiuni.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        style={{ maxWidth: '200px' }}
                    >
                        <option value="">All locations</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        value={responsibleFilter}
                        onChange={(e) => setResponsibleFilter(e.target.value)}
                        style={{ maxWidth: '220px' }}
                    >
                        <option value="">All responsibles</option>
                        {responsiblePersons.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                    {anyFilterActive && (
                        <button className="btn btn-outline-secondary" onClick={clearFilters}>
                            Clear
                        </button>
                    )}
                </div>

                {filteredItems.length === 0 ? (
                    <div className="text-center text-muted py-5 bg-white rounded">
                        {items.length === 0
                            ? 'No items yet. Add one to get started.'
                            : 'No items match your search or filters.'}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover bg-white rounded shadow-sm">
                            <thead>
                                <tr>
                                    <th>Inventory #</th>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Cost</th>
                                    <th>Status</th>
                                    <th>Gestiune</th>
                                    <th>Location</th>
                                    <th>Category</th>
                                    <th>Responsible</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.inventoryNumber}</td>
                                        <td>{item.name}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>{item.cost != null ? `€${Number(item.cost).toFixed(2)}` : '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>{item.gestiune?.name || '-'}</td>
                                        <td>{item.location?.name || '-'}</td>
                                        <td>{item.category?.name || '-'}</td>
                                        <td>{item.responsible?.name || '-'}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-info me-2"
                                                onClick={() => openHistoryModal(item)}
                                            >
                                                History
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-secondary me-2"
                                                onClick={() => openEditModal(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <>
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {editingItem ? 'Edit Item' : 'Add Item'}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeModal}></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        {formError && <div className="alert alert-danger">{formError}</div>}

                                        <div className="mb-3">
                                            <label className="form-label">Name</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => handleFormChange('name', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Inventory Number</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={form.inventoryNumber}
                                                onChange={(e) => handleFormChange('inventoryNumber', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                value={form.description}
                                                onChange={(e) => handleFormChange('description', e.target.value)}
                                                rows={2}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Cost</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.cost}
                                                onChange={(e) => handleFormChange('cost', e.target.value)}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                value={form.status}
                                                onChange={(e) => handleFormChange('status', e.target.value)}
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="MOVED">Moved</option>
                                                <option value="DECOMMISSIONED">Decommissioned</option>
                                                <option value="UNAVAILABLE">Unavailable</option>
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Gestiune</label>
                                            <select
                                                className="form-select"
                                                value={form.gestiuneId}
                                                onChange={(e) => handleFormChange('gestiuneId', e.target.value)}
                                                required
                                            >
                                                <option value="">Select gestiune</option>
                                                {gestiuni.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Location</label>
                                            <select
                                                className="form-select"
                                                value={form.locationId}
                                                onChange={(e) => handleFormChange('locationId', e.target.value)}
                                                required
                                            >
                                                <option value="">Select location</option>
                                                {locations.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Responsible Person</label>
                                            <select
                                                className="form-select"
                                                value={form.responsibleId}
                                                onChange={(e) => handleFormChange('responsibleId', e.target.value)}
                                                required
                                            >
                                                <option value="">Select responsible person</option>
                                                {responsiblePersons.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Category</label>
                                            <select
                                                className="form-select"
                                                value={form.categoryId}
                                                onChange={(e) => handleFormChange('categoryId', e.target.value)}
                                            >
                                                <option value="">No category</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </>
            )}

            {showHistoryModal && historyItem && (
                <>
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Status History — {historyItem.name} ({historyItem.inventoryNumber})
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeHistoryModal}></button>
                                </div>
                                <div className="modal-body">
                                    {(!historyItem.statusHistory || historyItem.statusHistory.length === 0) ? (
                                        <p className="text-muted mb-0">
                                            No status changes recorded yet. History is written when an item's status is changed.
                                        </p>
                                    ) : (
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Note</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...historyItem.statusHistory]
                                                    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                                                    .map(entry => (
                                                        <tr key={entry.id}>
                                                            <td>
                                                                <span className={`badge ${getStatusBadgeClass(entry.status)}`}>
                                                                    {entry.status}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(entry.changedAt).toLocaleString()}</td>
                                                            <td>{entry.note || '-'}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeHistoryModal}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </>
            )}
        </div>
    );
}

export default ItemsPage;