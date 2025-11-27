import { API_END_POINTS } from "./ApiEndpoints";
import { SplitApiSettings } from "./SplitApiSetting";

export const api = SplitApiSettings.injectEndpoints({
  endpoints: (builder) => ({
    /////////////////////////////<===AUTH MUTATIONS===>//////////////////////////////
    login: builder.mutation({
      query: (data) => ({
        url: API_END_POINTS.login,
        method: "POST",
        body: data,
      }),
    }),

    register: builder.mutation({
      query: (data) => ({
        url: API_END_POINTS.register,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: API_END_POINTS.changePassword,
        method: "POST",
        body: data,
      }),
    }),

    // topupBalance: builder.mutation({
    //   query: ({ userId, ...data }) => ({
    //     url: API_END_POINTS.topupBalance.replace(":targetUserId", userId),
    //     method: "POST",
    //     body: data,
    //   }),
    // }),

    // topDownBalance: builder.mutation({
    //   query: ({ userId, ...data }) => ({
    //     url: API_END_POINTS.topDownBalance.replace(":targetUserId", userId),
    //     method: "POST",
    //     body: data,
    //   }),
    // }),
    

    topupBalance: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: API_END_POINTS.topupBalance.replace(":targetUserId", userId),
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['User', 'Wallet'] as any,
    }),
    
    topDownBalance: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: API_END_POINTS.topDownBalance.replace(":targetUserId", userId),
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['User', 'Wallet'] as any,
    }),

    superAdminSelfTopup: builder.mutation({
      query: (data) => ({
        url: API_END_POINTS.superAdminSelfTopup,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['User', 'Wallet'] as any,
    }),

    placeBet: builder.mutation({
      query: (data) => ({
        url: API_END_POINTS.placeBet,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Wallet'] as any,
    }),
    
    // forgotPassword: builder.mutation({
    //   query: (data) => ({
    //     url: API_END_POINTS.forgotPassword,
    //     method: "POST",
    //     body: data,
    //   }),
    // }),

    // changePassword: builder.mutation({
    //   query: (data) => ({
    //     url: API_END_POINTS.changePassword,
    //     method: "POST",
    //     body: data,
    //   }),
    // }),

    /////////////////////////////<===USER QUERIES===>//////////////////////////////
    getUser: builder.query({
      query: () => ({
        url: API_END_POINTS.getUser,
        method: "GET",
      }),
      providesTags: ['User'],
    }),
    getDashboardData: builder.query({
      query: () => ({
        url: API_END_POINTS.getDashboardData,
        method: "GET",
      }),
    }),
    getWallet: builder.query({
      query: () => ({
        url: API_END_POINTS.getWallet,
        method: "GET",
      }),
      providesTags: ['Wallet'] as any,
    }),
  }),
});


export const {
    /////////////////////////////<===AUTH MUTATIONS===>//////////////////////////////
    useLoginMutation,
    useRegisterMutation,
    useChangePasswordMutation,
    useTopupBalanceMutation,
    useTopDownBalanceMutation,
    useSuperAdminSelfTopupMutation,
    usePlaceBetMutation,

    /////////////////////////////<===USER QUERIES===>//////////////////////////////
    useGetUserQuery,
    useGetDashboardDataQuery,
    useGetWalletQuery,
    
} = api;
