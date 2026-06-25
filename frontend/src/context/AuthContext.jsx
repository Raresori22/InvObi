import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
});
    const [accessToken, setAccessToken] = useState(
        localStorage.getItem('accessToken') || null
    );

    const login = (userData, token, refreshToken) => {
        setUser(userData);
        setAccessToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}