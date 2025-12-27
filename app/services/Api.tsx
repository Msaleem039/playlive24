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
      // Performance: Keep user data longer (changes infrequently)
      keepUnusedDataFor: 600,
    }),
    getDashboardData: builder.query({
      query: () => ({
        url: API_END_POINTS.getDashboardData,
        method: "GET",
      }),
      // Performance: Dashboard data changes frequently, keep for shorter time
      keepUnusedDataFor: 60,
    }),
    getWallet: builder.query({
      query: () => ({
        url: API_END_POINTS.getWallet,
        method: "GET",
      }),
      providesTags: ['Wallet'] as any,
      // Performance: Wallet data should be fresh, but cache briefly
      keepUnusedDataFor: 30,
    }),

    /////////////////////////////<===SETTLEMENT QUERIES===>//////////////////////////////
    getAllSettlementReport: builder.query({
      query: () => ({
        url: API_END_POINTS.getallsettlementreport,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
      // Performance: Reports are historical data, cache longer
      keepUnusedDataFor: 300,
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
      // Performance: History is historical data, cache longer
      keepUnusedDataFor: 300,
    }),
    getPendingSettlements: builder.query({
      query: () => ({
        url: API_END_POINTS.getPendingSettlements,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
      // Performance: Pending settlements change frequently, keep cache short
      keepUnusedDataFor: 30,
    }),

    getPendingSettlementsByMatch: builder.query({
      query: (matchId: string | number) => ({
        url: API_END_POINTS.getPendingSettlementsByMatch.replace(":matchId", String(matchId)),
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
      // Performance: Match-specific pending settlements change frequently
      keepUnusedDataFor: 30,
    }),

    getSettlementDetails: builder.query({
      query: (settlementId: string) => ({
        url: `${API_END_POINTS.getSettlementDetails}?settlement_id=${settlementId}`,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
      // Performance: Settlement details are relatively static once created
      keepUnusedDataFor: 300,
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
      // Performance: Bet data changes frequently, keep cache short
      keepUnusedDataFor: 30,
    }),

    getMyPendingBets: builder.query({
      query: () => ({
        url: API_END_POINTS.getMyPendingBets,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
      // Performance: User's pending bets change frequently, keep cache short
      keepUnusedDataFor: 15,
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

    settleMatchOdds: builder.mutation({
      query: (data: { eventId: string; marketId: string; winnerSelectionId: string; betIds?: string[] }) => ({
        url: API_END_POINTS.settleMatchOdds,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    settleFancy: builder.mutation({
      query: (data: { eventId: string; selectionId: string; decisionRun?: number; isCancel: boolean; marketId?: string; betIds?: string[] }) => ({
        url: API_END_POINTS.settleFancy,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    settleBookmaker: builder.mutation({
      query: (data: { eventId: string; marketId: string; winnerSelectionId: string; betIds?: string[] }) => ({
        url: API_END_POINTS.settleBookmaker,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    rollbackSettlement: builder.mutation({
      query: (data: { settlementId: string; betIds?: string[] }) => ({
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
      // Performance: Admin matches list changes infrequently, cache longer
      keepUnusedDataFor: 180,
    }),

    toggleMatchVisibility: builder.mutation({
      query: ({ eventId, isEnabled }: { eventId: string; isEnabled: boolean }) => ({
        url: API_END_POINTS.toggleMatchVisibility.replace(":eventId", eventId),
        method: "PATCH",
        body: { isEnabled },
      }),
      invalidatesTags: ['AdminMatches'] as any,
    }),

    /////////////////////////////<===SITE VIDEO===>//////////////////////////////
    getSiteVideo: builder.query({
      query: () => ({
        url: API_END_POINTS.getSiteVideo,
        method: "GET",
      }),
      // Performance: Site video config changes infrequently, cache longer
      keepUnusedDataFor: 600,
      providesTags: ['SiteVideo'] as any,
    }),

    updateSiteVideo: builder.mutation({
      query: (data: { videoUrl?: string; file?: File }) => {
        // If file is provided, use FormData
        if (data.file) {
          const formData = new FormData()
          // Backend expects field name to be "videoUrl" (as shown in Postman)
          formData.append("videoUrl", data.file)
          return {
            url: API_END_POINTS.updateSiteVideo,
            method: "POST",
            body: formData,
          }
        }
        // Otherwise, use JSON with videoUrl
        return {
          url: API_END_POINTS.updateSiteVideo,
          method: "POST",
          body: { videoUrl: data.videoUrl },
        }
      },
      invalidatesTags: ['SiteVideo'] as any,
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

    /////////////////////////////<===SITE VIDEO===>//////////////////////////////
    useGetSiteVideoQuery,
    useUpdateSiteVideoMutation,
    
} = api;
