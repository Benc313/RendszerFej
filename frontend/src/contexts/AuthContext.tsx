import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { apiCall } from '../services/api'; // Import apiCall

// A teljes User objektum, amit a /me végpont ad vissza
export interface User {
    id: number; // Backend alapján int
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string; // MeResponse alapján
    bannedTill?: string | null; // Backend string-ként küldi, frontend Date-ként is kezelheti
}

// A /me végpont válasza (MeResponse) megegyezik a User interfésszel
// type MeResponse = User;

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

    // --- Login Function Implementation ---
    const login = useCallback(async (email: string, password: string): Promise<User> => {
        try {
            // Javított végpont: /api/auth/login
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
            // Használjuk az apiCall-t a /api/auth/logout végpont hívásához
            await apiCall<void>('/api/auth/logout', { method: 'POST' });
        } catch {
            // Az apiCall már kezeli a hiba logolását és notificationt
        } finally {
            setUser(null); // Kliens oldali állapot törlése mindenképp
        }
    }, []);

    // Státusz ellenőrzése: Hívja a /api/user/me végpontot
    const checkAuthStatus = useCallback(async (): Promise<User | null> => {
        setIsLoading(true);
        try {
            // Használjuk az apiCall-t a /api/user/me végpont hívásához
            const currentUser = await apiCall<User>('/api/user/me'); // Backend MeResponse -> User
            setUser(currentUser);
            return currentUser;
        } catch {
            // Az apiCall már kezeli a hiba logolását és notificationt (pl. 401 esetén)
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
        // Add login to the context value
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuthStatus, setUserState }}>
            {children}
        </AuthContext.Provider>
    );
};

// Export only the AuthProvider as default to avoid Fast Refresh warning
export default AuthProvider;

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
