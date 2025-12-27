import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { BASE_URL } from './ApiEndpoints';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || BASE_URL || '',
    prepareHeaders: async (headers, { getState, endpoint }) => {
        try {
            let token = (getState() as any).auth?.token;
            // Only use js-cookie on client
            if (!token && typeof window !== 'undefined') {
                // @ts-ignore
                token = Cookies.get('token');
            }
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
                headers.set('accept', 'application/json');
            } else {
                headers.set('authorization', '');
            }
        } catch (err) {
            headers.set('authorization', '');
        }
        return headers;
    },
    // Custom fetch function to handle FormData properly
    fetchFn: async (input, init) => {
        // If body is FormData, don't set Content-Type (browser will set it with boundary)
        if (init?.body instanceof FormData) {
            const headers = new Headers(init.headers)
            headers.delete('Content-Type')
            return fetch(input, { ...init, headers })
        }
        // For JSON, set Content-Type
        if (init?.body && typeof init.body === 'string') {
            const headers = new Headers(init.headers)
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json')
            }
            return fetch(input, { ...init, headers })
        }
        return fetch(input, init)
    }
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    let result = await baseQuery(args, api, extraOptions);
    // Handle 401 errors by dispatching logout action
    if (result.error && result.error.status === 401) {
        // Import logout action dynamically to avoid circular dependency
        const { logout } = await import('../store/slices/authSlice');
        api.dispatch(logout());
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    return result;
};

export const SplitApiSettings = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    endpoints: () => ({}),
    tagTypes: ['User', 'Wallet', 'Settlement', 'AdminMatches', 'SiteVideo'],
    // Performance: Keep unused data for 5 minutes (default is 60s)
    // This reduces refetches for data that's still valid
    keepUnusedDataFor: 300,
    // Performance: Only refetch on mount if data is stale (>5min) or args changed
    // Prevents unnecessary refetches when navigating back to a page
    refetchOnMountOrArgChange: false,
    // Performance: Don't refetch on reconnect unless data is stale
    refetchOnReconnect: false,
    // Performance: Don't refetch on window focus unless data is stale
    refetchOnFocus: false,
});