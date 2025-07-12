import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                await axios.get('http://localhost:5000/health');
                setDemoMode(false);
            } catch (error) {
                console.log('Backend not available - running in demo mode');
                setDemoMode(true);
            }
            setLoading(false);
        };

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        checkBackend();
    }, [token]);

    const login = async (email, password) => {
        if (demoMode) {
            const demoUser = {
                id: 1,
                username: 'demo_user',
                email: email,
                fullName: 'Demo User'
            };
            setUser(demoUser);
            setToken('demo_token');
            localStorage.setItem('token', 'demo_token');
            return { success: true };
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        if (demoMode) {
            const demoUser = {
                id: 1,
                username: userData.username,
                email: userData.email,
                fullName: userData.fullName
            };
            setUser(demoUser);
            setToken('demo_token');
            localStorage.setItem('token', 'demo_token');
            return { success: true };
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', userData);

            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        loading,
        demoMode
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
