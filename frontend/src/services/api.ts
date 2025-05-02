

// Removed unused API_BASE_URL constant

interface ApiCallOptions extends RequestInit {
    data?: unknown;
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
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const { data, ...restOptions } = options;
    const config: RequestInit = {
        method: options.method || (data ? 'POST' : 'GET'),
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
        ...restOptions,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // eslint-disable-next-line no-console
    console.log(`API Call: ${config.method} ${url}`, data ? `with data: ${JSON.stringify(data)}` : '');

    try {
        const response = await fetch(url, config);

        // eslint-disable-next-line no-console
        console.log(`API Response Status: ${response.status} for ${url}`);

        if (response.status === 204) {
            return undefined as T;
        }

        const contentType = response.headers.get('content-type');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let responseData: any;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            try {
                responseData = JSON.parse(textResponse);
            } catch {
                responseData = { message: textResponse };
            }
        }

        if (!response.ok) {
            let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
            if (responseData && typeof responseData === 'object') {
                if (typeof responseData.errors === 'object' && responseData.errors !== null) {
                    const validationErrors = Object.values(responseData.errors).flat();
                    if (validationErrors.length > 0 && validationErrors.every(e => typeof e === 'string')) {
                        errorMessage = validationErrors.join(', ');
                    }
                } else if (typeof responseData.message === 'string') {
                    errorMessage = responseData.message;
                } else if (Array.isArray(responseData.errors) && responseData.errors.every((e: unknown) => typeof e === 'string')) {
                    errorMessage = responseData.errors.join(', ');
                } else if (typeof responseData.title === 'string') {
                    errorMessage = responseData.title;
                } else if (
                    typeof responseData === 'object' &&
                    responseData !== null &&
                    'Message' in responseData &&
                    typeof (responseData as Record<string, unknown>).Message === 'string'
                ) {
                    errorMessage = (responseData as Record<string, unknown>).Message as string;
                }
            } else if (typeof responseData === 'string') {
                errorMessage = responseData;
            }

            throw new Error(errorMessage);
        }

        // eslint-disable-next-line no-console
        console.log(`API Success: ${config.method} ${url}`, responseData);
        return responseData as T;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`API Call failed for ${url}:`, error);

        throw error;
    }
}
