// Alapvető API hívás funkció

const API_BASE_URL = '/api'; // A Vite proxy miatt ezt használjuk

interface ApiCallOptions extends RequestInit {
    data?: unknown; // Adatok küldéséhez (pl. POST, PUT)
}

// Típus a backend által küldött hibaobjektumhoz
interface BackendError {
    errors?: string[];
    message?: string;
    title?: string; // ASP.NET Core alapértelmezett hiba esetén
    status?: number; // ASP.NET Core alapértelmezett hiba esetén
}

export async function apiCall<T>(
    endpoint: string,
    options: ApiCallOptions = {}
): Promise<T> {
    const { data, headers: customHeaders, ...restOptions } = options;

    const config: RequestInit = {
        method: options.method || (data ? 'POST' : 'GET'),
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...customHeaders,
        },
        credentials: 'include', // Fontos a cookie-alapú auth miatt!
        ...restOptions,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorData: BackendError | string = `HTTP error! status: ${response.status}`;
            try {
                // Próbáljuk megolvasni a hibaüzenetet a backendtől
                errorData = await response.json();
            } catch (e) {
                // Ha a válasz nem JSON, vagy üres, marad az alapértelmezett hibaüzenet
                console.error("Could not parse error response as JSON", e);
            }

            // Formázzuk a hibaüzenetet a dobáshoz
            let errorMessage = "An unknown error occurred.";
            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (errorData?.errors && Array.isArray(errorData.errors)) {
                errorMessage = errorData.errors.join(', '); // Backend által küldött hibalista
            } else if (errorData?.message) {
                errorMessage = errorData.message;
            } else if (errorData?.title) { // ASP.NET Core default error
                errorMessage = errorData.title;
            }

            // Dobjunk egy Error objektumot a formázott üzenettel
            throw new Error(errorMessage);
        }

        // Ha a válasz státusza 204 No Content, nincs szükség JSON parse-ra
        if (response.status === 204 || response.headers.get('content-length') === '0') {
             // A Register végpont Ok()-t ad vissza tartalom nélkül, ami 200 OK, de üres body-val.
             // A Logout szintén.
            return undefined as T;
        }

        // Ha a válasz 200 OK és van tartalom (pl. Login)
        return await response.json() as T;

    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        // Továbbdobjuk a hibát (ami már Error objektum kell legyen)
        throw error;
    }
}
