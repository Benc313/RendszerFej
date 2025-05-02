import { notifications } from '@mantine/notifications';

// Alap URL a backendhez (Vite proxy miatt relatív útvonal is működhet,
// de a teljes URL egyértelműbb lehet)
// Removed unused API_BASE_URL constant

interface ApiCallOptions extends RequestInit {
    data?: unknown; // Adatok küldéséhez (pl. POST, PUT)
}

/**
 * Központosított API hívó függvény.
 * Kezeli a base URL-t, JSON body-t, credentials-t és az alapvető hibakezelést.
 * @param endpoint A hívandó API végpont (pl. '/movies', '/api/user/me').
 * @param options Fetch API opciók, kiegészítve egy 'data' mezővel a body-hoz.
 * @returns A válasz JSON adatai T típusként.
 * @throws Hiba esetén dob egy Error objektumot a hibaüzenettel.
 */
export async function apiCall<T>(endpoint: string, options: ApiCallOptions = {}): Promise<T> {
    // const url = `${API_BASE_URL}${endpoint}`; // Teljes URL összeállítása - Modified
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`; // Ensure endpoint starts with /
    const config: RequestInit = {
        method: options.method || (options.data ? 'POST' : 'GET'), // Alapértelmezett metódus
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // Cookie-k küldése/fogadása
        ...options,
    };

    // Ha van 'data' opció, azt JSON stringgé alakítjuk és beállítjuk a body-ba
    if (options.data) {
        config.body = JSON.stringify(options.data);
    }

    console.log(`API Call: ${config.method} ${url}`, options.data ? `with data: ${JSON.stringify(options.data)}` : ''); // Debug log

    try {
        const response = await fetch(url, config);

        console.log(`API Response Status: ${response.status} for ${url}`); // Debug log

        // Speciális kezelés a 204 No Content válaszra (pl. Logout, Delete)
        if (response.status === 204) {
            return undefined as T; // Nincs tartalom, undefined-ot adunk vissza
        }

        // Check Content-Type before assuming JSON
        const contentType = response.headers.get("content-type");
        let responseData: any; // Use 'any' temporarily

        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json(); // Parse JSON only if header indicates it
        } else {
             // If not JSON, try to get text for error messages, but don't assume JSON structure
             const textResponse = await response.text();
             // Try to parse as JSON in case the content-type header was missing/wrong
             try {
                 responseData = JSON.parse(textResponse);
             } catch {
                 // If parsing fails, treat the text as the message
                 responseData = { message: textResponse };
             }
        }

        if (!response.ok) {
            // Próbáljuk meg kinyerni a hibaüzenetet a backend válaszából
            let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
            // Use optional chaining and check types more carefully
            if (responseData && typeof responseData === 'object') {
                // Handle ASP.NET Core validation problem details
                 if (typeof responseData.errors === 'object' && responseData.errors !== null) {
                    const validationErrors = Object.values(responseData.errors).flat(); // Get all error messages
                    if (validationErrors.length > 0 && validationErrors.every(e => typeof e === 'string')) {
                        errorMessage = validationErrors.join(', ');
                    }
                 }
                 // Handle custom error messages or other structures
                 else if (typeof responseData.message === 'string') {
                    errorMessage = responseData.message; // Backend által küldött üzenet
                } else if (Array.isArray(responseData.errors) && responseData.errors.every((e: unknown) => typeof e === 'string')) {
                    errorMessage = responseData.errors.join(', '); // Backend validációs hibák (ha lista)
                } else if (typeof responseData.title === 'string') {
                    errorMessage = responseData.title; // ASP.NET Core probléma részletek címe
                } else if (typeof responseData.Message === 'string') { // Check for PascalCase 'Message'
                     errorMessage = responseData.Message;
                 }
            } else if (typeof responseData === 'string') {
                 // Handle cases where responseData might be a plain string (e.g., from response.text())
                 errorMessage = responseData;
            }

            console.error('API Error:', errorMessage, 'Response Data:', responseData); // Részletesebb logolás

            // Értesítés megjelenítése
            notifications.show({
                title: 'API Error',
                message: errorMessage,
                color: 'red',
            });

            throw new Error(errorMessage);
        }

        console.log(`API Success: ${config.method} ${url}`, responseData); // Debug log
        return responseData as T;

    } catch (error) {
        console.error(`API Call failed for ${url}:`, error);

        // Ha nem HTTP hiba volt (pl. hálózati hiba), akkor is jelenítsünk meg értesítést
        if (!(error instanceof Error && error.message.startsWith('HTTP error'))) {
             notifications.show({
                title: 'Network or Application Error',
                message: error instanceof Error ? error.message : 'An unknown error occurred',
                color: 'red',
            });
        }
        // Az eredeti vagy az általunk generált Error objektumot továbbdobjuk
        throw error;
    }
}
