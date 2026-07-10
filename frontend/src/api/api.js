import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });


api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
f
        if (
            (status === 401 || status === 403) &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/user/token') &&
            !originalRequest.url.includes('/user/login')
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {

                const res = await axios.post('http://localhost:3000/user/token', {
                    token: refreshToken
                });
                const newAccessToken = res.data.accessToken;

                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;


                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;