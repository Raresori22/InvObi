import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ItemsPage from './pages/ItemsPage';
import AdminPage from './pages/AdminPage';

// Requires a logged-in user
function ProtectedRoute({ children }) {
    const { accessToken } = useAuth();
    return accessToken ? children : <Navigate to="/login" />;
}

// Requires a logged-in user whose role is ADMIN
function AdminRoute({ children }) {
    const { accessToken, user } = useAuth();
    if (!accessToken) return <Navigate to="/login" />;
    if (user?.role !== 'ADMIN') return <Navigate to="/items" />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/items" element={
                        <ProtectedRoute>
                            <ItemsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminPage />
                        </AdminRoute>
                    } />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
