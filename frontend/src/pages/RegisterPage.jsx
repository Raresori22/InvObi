import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/user', { username, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
            <div className="card shadow-sm" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="card-body p-4">
                    <h1 className="fw-bold mb-1">InvObi</h1>
                    <p className="text-muted mb-4">Create an account</p>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input
                                className="form-control"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                                className="form-control"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input
                                className="form-control"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                        <button type="submit" className="btn btn-primary w-100 mt-2" onClick={() => navigate('/login')} disabled={loading}>
                            {loading ? 'Redirecting...' : 'Have an account? Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;