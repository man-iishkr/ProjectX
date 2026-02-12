import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe, loginUser } from '../api/auth.api';

interface AuthContextType {
    user: any;
    loading: boolean;
    login: (creds: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const res = await getMe();
            if (res.success) {
                setUser(res.data);
            }
        } catch (err) {

            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (creds: any) => {
        const res = await loginUser(creds);
        if (res.success) {
            setUser(res.user); // or fetch me
        }
    };

    const logout = () => {
        setUser(null);
        // document.cookie = ... to clear if needed
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
