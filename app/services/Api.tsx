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
        method: "PATCH",
        body: data,
      }),
    }),

    toggleUserStatus: builder.mutation({
      query: ({ userId, isActive }) => ({
        url: API_END_POINTS.toggleUserStatus.replace(":targetUserId", userId),
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ['User'] as any,
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

    /////////////////////////////<===SETTLEMENT QUERIES===>//////////////////////////////
    getAllSettlementReport: builder.query({
      query: () => ({
        url: API_END_POINTS.getallsettlementreport,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),
    getSettlementHistory: builder.query({
      query: (params: { startDate?: string; endDate?: string; limit?: number; offset?: number }) => {
        const queryParams = new URLSearchParams()
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.offset) queryParams.append('offset', params.offset.toString())
        return {
          url: `${API_END_POINTS.getSettlementHistory}?${queryParams.toString()}`,
          method: "GET",
        }
      },
      providesTags: ['Settlement'] as any,
    }),
    getPendingSettlements: builder.query({
      query: () => ({
        url: API_END_POINTS.getPendingSettlements,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),

    getPendingSettlementsByMatch: builder.query({
      query: (matchId: string | number) => ({
        url: API_END_POINTS.getPendingSettlementsByMatch.replace(":matchId", String(matchId)),
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),

    getSettlementDetails: builder.query({
      query: (settlementId: string) => ({
        url: `${API_END_POINTS.getSettlementDetails}?settlement_id=${settlementId}`,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),

    getSettlementBets: builder.query({
      query: (params: { status?: string; match_id?: string; settlement_id?: string; user_id?: string; limit?: number }) => {
        const queryParams = new URLSearchParams()
        if (params.status) queryParams.append('status', params.status)
        if (params.match_id) queryParams.append('match_id', params.match_id)
        if (params.settlement_id) queryParams.append('settlement_id', params.settlement_id)
        if (params.user_id) queryParams.append('user_id', params.user_id)
        if (params.limit) queryParams.append('limit', params.limit.toString())
        return {
          url: `${API_END_POINTS.getSettlementBets}?${queryParams.toString()}`,
          method: "GET",
        }
      },
      providesTags: ['Settlement'] as any,
    }),

    getMyPendingBets: builder.query({
      query: () => ({
        url: API_END_POINTS.getMyPendingBets,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),

    /////////////////////////////<===SETTLEMENT MUTATIONS===>//////////////////////////////
    manualSettlement: builder.mutation({
      query: (data: { match_id: string; selection_id: number; gtype: string; bet_name: string; winner_id: number }) => ({
        url: API_END_POINTS.manualSettlement,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    reverseSettlement: builder.mutation({
      query: (data: { settlement_id: string }) => ({
        url: API_END_POINTS.reverseSettlement,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    settleFancy: builder.mutation({
      query: (data: { eventId: string; selectionId: string; decisionRun?: number; isCancel: boolean; marketId?: string }) => ({
        url: API_END_POINTS.settleFancy,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    settleMatchOdds: builder.mutation({
      query: (data: { eventId: string; marketId: string; winnerSelectionId: string; betId?: string | number }) => ({
        url: API_END_POINTS.settleMatchOdds,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    settleBookmaker: builder.mutation({
      query: (data: { eventId: string; marketId: string; winnerSelectionId: string }) => ({
        url: API_END_POINTS.settleBookmaker,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    rollbackSettlement: builder.mutation({
      query: (data: { settlementId: string }) => ({
        url: API_END_POINTS.rollbackSettlement,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    /////////////////////////////<===ADMIN MATCHES===>//////////////////////////////
    getAdminMatches: builder.query({
      query: () => ({
        url: API_END_POINTS.getAdminMatches,
        method: "GET",
      }),
      providesTags: ['AdminMatches'] as any,
    }),

    toggleMatchVisibility: builder.mutation({
      query: ({ eventId, isEnabled }: { eventId: string; isEnabled: boolean }) => ({
        url: API_END_POINTS.toggleMatchVisibility.replace(":eventId", eventId),
        method: "PATCH",
        body: { isEnabled },
      }),
      invalidatesTags: ['AdminMatches'] as any,
    }),
  }),
});


export const {
    /////////////////////////////<===AUTH MUTATIONS===>//////////////////////////////
    useLoginMutation,
    useRegisterMutation,
    useChangePasswordMutation,
    useToggleUserStatusMutation,
    useTopupBalanceMutation,
    useTopDownBalanceMutation,
    useSuperAdminSelfTopupMutation,
    usePlaceBetMutation,

    /////////////////////////////<===USER QUERIES===>//////////////////////////////
    useGetUserQuery,
    useGetDashboardDataQuery,
    useGetWalletQuery,

    /////////////////////////////<===SETTLEMENT QUERIES===>//////////////////////////////
    useGetPendingSettlementsQuery,
    useGetPendingSettlementsByMatchQuery,
    useGetSettlementDetailsQuery,
    useGetSettlementBetsQuery,
    useGetMyPendingBetsQuery,
    useGetAllSettlementReportQuery,
    useGetSettlementHistoryQuery,

    /////////////////////////////<===SETTLEMENT MUTATIONS===>//////////////////////////////
    useManualSettlementMutation,
    useReverseSettlementMutation,
    useSettleFancyMutation,
    useSettleMatchOddsMutation,
    useSettleBookmakerMutation,
    useRollbackSettlementMutation,

    /////////////////////////////<===ADMIN MATCHES===>//////////////////////////////
    useGetAdminMatchesQuery,
    useToggleMatchVisibilityMutation,
    
} = api;
