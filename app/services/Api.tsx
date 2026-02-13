import { API_END_POINTS } from "./ApiEndpoints";
import { SplitApiSettings } from "./SplitApiSetting";
import Cookies from "js-cookie";

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
      query: (params?: { 
        parentId?: string
        userId?: string
        type?: string
        showCashEntry?: boolean | string
        showMarketPnl?: boolean | string
        showMarketCommission?: boolean | string
        showSessionPnl?: boolean | string
        showTossPnl?: boolean | string
      }) => {
        const queryParams = new URLSearchParams()
        if (params?.parentId) {
          queryParams.append('parentId', params.parentId)
        }
        if (params?.userId) {
          queryParams.append('userId', params.userId)
        }
        if (params?.type) {
          queryParams.append('type', params.type)
        }
        if (params?.showCashEntry !== undefined) {
          queryParams.append('showCashEntry', params.showCashEntry.toString())
        }
        if (params?.showMarketPnl !== undefined) {
          queryParams.append('showMarketPnl', params.showMarketPnl.toString())
        }
        if (params?.showMarketCommission !== undefined) {
          queryParams.append('showMarketCommission', params.showMarketCommission.toString())
        }
        if (params?.showSessionPnl !== undefined) {
          queryParams.append('showSessionPnl', params.showSessionPnl.toString())
        }
        if (params?.showTossPnl !== undefined) {
          queryParams.append('showTossPnl', params.showTossPnl.toString())
        }
        const queryString = queryParams.toString()
        return {
          url: queryString ? `${API_END_POINTS.getUser}?${queryString}` : API_END_POINTS.getUser,
          method: "GET",
        }
      },
      providesTags: (result, error, params) => {
        // Provide different tags based on whether we're fetching bets or users
        if (params?.type === 'bets') {
          return ['User', 'BetHistory'] as any
        }
        return ['User'] as any
      },
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
    getPendingMarkets: builder.query({
      query: () => ({
        url: API_END_POINTS.getPendingMarkets,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),
    getPendingFancyMarkets: builder.query({
      query: () => ({
        url: API_END_POINTS.getPendingFancyMarkets,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),
    getPendingBookmakerMarkets: builder.query({
      query: () => ({
        url: API_END_POINTS.getPendingBookmakerMarkets,
        method: "GET",
      }),
      providesTags: ['Settlement'] as any,
    }),
    getPendingTiedMatchMarkets: builder.query({
      query: () => ({
        url: API_END_POINTS.getPendingTiedMatchMarkets,
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

    getUserBets: builder.query({
      query: (params: { userId: string; limit?: number; offset?: number }) => {
        const queryParams = new URLSearchParams()
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.offset) queryParams.append('offset', params.offset.toString())
        return {
          url: `${API_END_POINTS.getUserBets.replace(':userId', params.userId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
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
    settleTiedMatch: builder.mutation({
      query: (data: { eventId: string; marketId: string; winnerSelectionId: string }) => ({
        url: API_END_POINTS.settleTiedMatch,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Settlement'] as any,
    }),

    cancelBets: builder.mutation({
      query: (data: { eventId: string; marketId: string; selectionId: string; betIds: string[] }) => ({
        url: API_END_POINTS.cancelBets,
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
    deleteBet: builder.mutation({
      queryFn: async (betId: string, api, _extraOptions, baseQuery) => {
        // Get token from Redux state or cookie
        const state = (api.getState as any)();
        let token = state?.auth?.token;
        if (!token && typeof window !== 'undefined') {
          token = Cookies.get('token');
        }
        
        const url = API_END_POINTS.deleteBet.replace(':betId', betId);
        // Get base URL - API_END_POINTS already includes BASE_URL, so if url doesn't start with http, we need to construct it
        // Since API_END_POINTS.deleteBet already includes BASE_URL, we can use it directly
        const fullUrl = url;
        
        try {
          const response = await fetch(fullUrl, {
            method: 'DELETE',
            headers: {
              'authorization': token ? `Bearer ${token}` : '',
              'accept': 'application/json',
              // Explicitly don't set Content-Type for DELETE without body
            },
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            return { error: { status: response.status, data } };
          }
          
          return { data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Settlement', 'BetHistory', 'User'] as any,
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

    /////////////////////////////<===SITE VIDEO===>//////////////////////////////
    getSiteVideo: builder.query({
      query: () => ({
        url: API_END_POINTS.getSiteVideo,
        method: "GET",
      }),
    }),

    updateSiteVideo: builder.mutation({
      query: (data) => ({
        url: API_END_POINTS.updateSiteVideo,
        method: "POST",
        body: data,
      }),
    }),

    /////////////////////////////<===COMPLAINT===>//////////////////////////////
    submitComplaint: builder.mutation({
      query: (data: { name: string; contactNumber: string; message: string }) => ({
        url: API_END_POINTS.submitComplaint,
        method: "POST",
        body: data,
      }),
    }),

    getComplaints: builder.query({
      query: () => ({
        url: API_END_POINTS.getComplaints,
        method: "GET",
      }),
      providesTags: ['Complaints'] as any,
    }),

    /////////////////////////////<===NEWS BAR===>//////////////////////////////
    getNewsBar: builder.query({
      query: () => ({
        url: API_END_POINTS.getNewsBar,
        method: "GET",
      }),
      providesTags: ['NewsBar'] as any,
    }),

    updateNewsBar: builder.mutation({
      query: (data: { text: string }) => ({
        url: API_END_POINTS.updateNewsBar,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ['NewsBar'] as any,
    }),

    /////////////////////////////<===POSITIONS QUERIES===>//////////////////////////////
    getMatchPositions: builder.query({
      query: (params?: { matchId?: string; eventId?: string }) => {
        const queryParams = new URLSearchParams()
        if (params?.matchId) queryParams.append('matchId', params.matchId)
        if (params?.eventId) queryParams.append('eventId', params.eventId)
        return {
          url: `${API_END_POINTS.getMatchPositions}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
          method: "GET",
        }
      },
      providesTags: ['Positions'] as any,
    }),

    /////////////////////////////<===ACCOUNT STATEMENT QUERIES===>//////////////////////////////
    getAccountStatement: builder.query({
      query: (params?: { fromDate?: string; toDate?: string; type?: string }) => {
        const queryParams = new URLSearchParams()
        if (params?.fromDate) queryParams.append('fromDate', params.fromDate)
        if (params?.toDate) queryParams.append('toDate', params.toDate)
        if (params?.type) queryParams.append('type', params.type)
        return {
          url: `${API_END_POINTS.getAccountStatement}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
          method: "GET",
        }
      },
      providesTags: ['AccountStatement'] as any,
    }),

    /////////////////////////////<===BET AGGREGATION===>//////////////////////////////
    getBetAggregation: builder.query({
      query: (userId: string) => ({
        url: `${API_END_POINTS.getBetAggregation}?userId=${userId}`,
        method: "GET",
      }),
    }),

    /////////////////////////////<===AGENT MATCH BOOK===>//////////////////////////////
    getAgentMatchBook: builder.query({
      query: (eventId: string | number) => ({
        url: `${API_END_POINTS.getAgentMatchBook}?event=${eventId}`,
        method: "GET",
      }),
      providesTags: ['AgentMatchBook'] as any,
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
    useLazyGetUserQuery,
    useGetDashboardDataQuery,
    useGetWalletQuery,

    /////////////////////////////<===SETTLEMENT QUERIES===>//////////////////////////////
    useGetPendingSettlementsQuery,
    useGetPendingMarketsQuery,
    useGetPendingFancyMarketsQuery,
    useGetPendingBookmakerMarketsQuery,
    useGetPendingTiedMatchMarketsQuery,
    useGetPendingSettlementsByMatchQuery,
    useGetSettlementDetailsQuery,
    useGetSettlementBetsQuery,
    useGetUserBetsQuery,
    useGetMyPendingBetsQuery,
    useGetAllSettlementReportQuery,
    useGetSettlementHistoryQuery,

    /////////////////////////////<===SETTLEMENT MUTATIONS===>//////////////////////////////
    useManualSettlementMutation,
    useReverseSettlementMutation,
    useSettleFancyMutation,
    useSettleMatchOddsMutation,
    useSettleBookmakerMutation,
    useSettleTiedMatchMutation,
    useCancelBetsMutation,
    useRollbackSettlementMutation,
    useDeleteBetMutation,
    /////////////////////////////<===ADMIN MATCHES===>//////////////////////////////
    useGetAdminMatchesQuery,
    useToggleMatchVisibilityMutation,

    /////////////////////////////<===SITE VIDEO===>//////////////////////////////
    useGetSiteVideoQuery,
    useUpdateSiteVideoMutation,

    /////////////////////////////<===POSITIONS QUERIES===>//////////////////////////////
    useGetMatchPositionsQuery,

    /////////////////////////////<===ACCOUNT STATEMENT QUERIES===>//////////////////////////////
    useGetAccountStatementQuery,

    /////////////////////////////<===BET AGGREGATION===>//////////////////////////////
    useGetBetAggregationQuery,

    /////////////////////////////<===AGENT MATCH BOOK===>//////////////////////////////
    useGetAgentMatchBookQuery,

    /////////////////////////////<===COMPLAINT===>//////////////////////////////
    useSubmitComplaintMutation,
    useGetComplaintsQuery,

    /////////////////////////////<===NEWS BAR===>//////////////////////////////
    useGetNewsBarQuery,
    useUpdateNewsBarMutation,
    
} = api;
