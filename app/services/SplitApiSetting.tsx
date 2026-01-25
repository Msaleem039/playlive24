import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { BASE_URL } from './ApiEndpoints';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || BASE_URL || '',
    prepareHeaders: async (headers, { getState }) => {
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
                // Don't set Content-Type here - RTK Query will set it automatically when body is present
                // This avoids issues with DELETE requests without body
            } else {
                headers.set('authorization', '');
            }
        } catch (err) {
            headers.set('authorization', '');
        }
        return headers;
    }
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    // For DELETE requests without body, remove Content-Type header if it was set
    if (args?.method === 'DELETE' && !args?.body) {
        // Create a custom prepareHeaders that removes Content-Type
        const originalPrepareHeaders = baseQuery.prepareHeaders;
        if (originalPrepareHeaders) {
            args.prepareHeaders = async (headers: Headers, api: any) => {
                const result = await originalPrepareHeaders(headers, api);
                // Remove Content-Type for DELETE without body
                result.delete('Content-Type');
                return result;
            };
        }
    }
    
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
    // refetchOnMountOrArgChange: true,
    baseQuery: baseQueryWithReauth,
    endpoints: () => ({}),
    tagTypes: ['User', 'Wallet', 'Settlement', 'Positions']
});