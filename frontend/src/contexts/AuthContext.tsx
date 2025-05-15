import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { apiCall } from '../services/api'; 

// A teljes User objektum, amit a /me végpont ad vissza
export interface User {
    id: number; 
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string; 
    bannedTill?: string | null; 
}


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>; // Sikeres bejelentkezés esetén visszaadja a bejelentkezett felhasználót
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<User | null>; // Visszaadja a usert vagy null-t
    setUserState: (user: User | null) => void; // Közvetlen user beállítás (pl. login után)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Közvetlen user beállító függvény
    const setUserState = useCallback((userData: User | null) => {
        setUser(userData);
    }, []);

    // login függvény: Bejelentkezés a /api/auth/login végponton keresztül
    const login = useCallback(async (email: string, password: string): Promise<User> => {
        try {
            const loggedInUser = await apiCall<User>('/api/auth/login', {
                method: 'POST',
                data: { email, password },
            });
            setUserState(loggedInUser);
            return loggedInUser;
        } catch {
            setUserState(null);
            throw new Error('Login failed');
        }
    }, [setUserState]);

    // Kijelentkezés
    const logout = useCallback(async () => {
        try {
            // apiCall /api/auth/logout végpont hívása
            await apiCall<void>('/api/auth/logout', { method: 'POST' });
        } catch {
        } finally {
            setUser(null); // Kliens oldali állapot törlése 
        }
    }, []);

    // Státusz ellenőrzése: /api/user/me végpont
    const checkAuthStatus = useCallback(async (): Promise<User | null> => {
        setIsLoading(true);
        try {
            const currentUser = await apiCall<User>('/api/user/me'); // Backend MeResponse -> User
            setUser(currentUser);
            return currentUser;
        } catch {
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Első betöltéskor ellenőrizzük a státuszt
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    return (
        // login hozzáadása a contexthez
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuthStatus, setUserState }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
