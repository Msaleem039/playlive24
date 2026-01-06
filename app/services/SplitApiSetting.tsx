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
                headers.set('Content-Type', 'application/json');
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