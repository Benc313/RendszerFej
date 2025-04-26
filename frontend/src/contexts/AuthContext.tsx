import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { apiCall } from '../services/api';

// A teljes User objektum, amit a /me végpont ad vissza
interface User {
    id: number; // Backend alapján int
    name: string;
    email: string;
    role: 'Admin' | 'Cashier' | 'User';
    phone: string; // MeResponse alapján
    bannedTill?: Date | string | null; // Hozzáadva és opcionálissá/nullázhatóvá téve
}

// A /me végpont válasza megegyezik a User interfésszel
// type MeResponse = User; // Használhatjuk közvetlenül a User-t

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
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

    // Kijelentkezés
    const logout = useCallback(async () => {
        console.log("Attempting logout..."); // Debug
        try {
            // Hívjuk a backend logout végpontot
            await apiCall<void>('/logout', { method: 'POST' });
            console.log("Logout API call successful"); // Debug
        } catch (error) {
            // Még ha a backend hívás sikertelen is (pl. már lejárt a token),
            // a kliens oldali állapotot akkor is töröljük.
            console.error("Logout API call failed:", error);
        } finally {
            setUser(null); // Kliens oldali állapot törlése
            // A HttpOnly cookie-t a böngészőnek kellene törölnie a backend válasza alapján,
            // vagy a lejáratakor. Kliens oldalról nem tudjuk megbízhatóan törölni.
            console.log("User state set to null"); // Debug
        }
    }, []);

    // Státusz ellenőrzése: Hívja a /users/me végpontot
    const checkAuthStatus = useCallback(async (): Promise<User | null> => {
        console.log("Checking auth status via /users/me..."); // Debug
        setIsLoading(true);
        try {
            // Használjuk közvetlenül a User típust a MeResponse helyett
            const currentUser = await apiCall<User>('/users/me');
            // A dátum stringként érkezhet JSON-ból, konvertáljuk Date objektummá, ha szükséges
            if (currentUser.bannedTill && typeof currentUser.bannedTill === 'string') {
                currentUser.bannedTill = new Date(currentUser.bannedTill);
            }
            setUser(currentUser);
            console.log("Auth status check successful, user:", currentUser); // Debug
            return currentUser; // Visszaadja a usert
        } catch (error) {
            console.log("Auth status check failed (likely not logged in):", error.message); // Debug
            setUser(null); // Nincs érvényes session
            return null; // Visszaad null-t
        } finally {
            setIsLoading(false);
            console.log("Auth status check finished."); // Debug
        }
    }, []);

    // Első betöltéskor ellenőrizzük a státuszt
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]); // Dependency array helyes használata

    return (
        // login prop eltávolítva, helyette setUserState
        <AuthContext.Provider value={{ user, isLoading, logout, checkAuthStatus, setUserState }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
