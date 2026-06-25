import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.post('/user/login', { username, password });
            const { user, accessToken, refreshToken } = response.data;
            login(user, accessToken, refreshToken);
            // Admins go to the admin hub, everyone else to the items page
            navigate(user.role === 'ADMIN' ? '/admin' : '/items');
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
                    <p className="text-muted mb-4">Sign in to your account</p>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input
                                className="form-control"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
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
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                        <button type="submit" className="btn btn-primary w-100 mt-2" onClick={() => navigate('/register')} disabled={loading}>
                            {loading ? 'Redirecting...' : 'Register'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
