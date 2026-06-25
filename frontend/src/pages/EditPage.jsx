import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';

function EditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchItem();
    }, [id]);

    const fetchItem = async () => {
        try {
            const response = await api.get(`/items/${id}`);
            const item = response.data;
            setName(item.name);
            setDescription(item.description || '');
            setStatus(item.status);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load item');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            await api.put(`/items/${id}`, { name, description, status });
            navigate('/items');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update item');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4" style={{ maxWidth: '500px' }}>
            <h1 className="fw-bold mb-4">Edit Item</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                        className="form-control"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="MOVED">Moved</option>
                        <option value="DECOMMISSIONED">Decommissioned</option>
                        <option value="UNAVAILABLE">Unavailable</option>
                    </select>
                </div>

                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/items')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditPage;