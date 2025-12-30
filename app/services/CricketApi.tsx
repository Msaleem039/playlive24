import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_END_POINTS } from './ApiEndpoints';
import { CricketCompetitionsResponse, CricketMatchesResponse, CricketMatchesParams, CricketAggregatorResponse, SportsResponse } from '../../lib/types/cricket';

// Create a separate API for cricket/sports data
export const cricketApi = createApi({
  reducerPath: 'cricketApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '',
    prepareHeaders: (headers) => {
      headers.set('accept', 'application/json');
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['CricketCompetitions', 'CricketMatches', 'Sports'],
  endpoints: (builder) => ({
    // Get cricket competitions (what the API actually returns)
    getCricketCompetitions: builder.query<CricketCompetitionsResponse, void>({
      query: () => ({
        url: API_END_POINTS.cricketMatches,
        method: 'GET',
      }),
      providesTags: ['CricketCompetitions'],
    }),
    
    // Get cricket matches with optional filters (if this endpoint exists)
    getCricketMatches: builder.query<CricketAggregatorResponse | CricketMatchesResponse, CricketMatchesParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        
        // Add query parameters if provided (pagination removed - not used in backend)
        if (params?.format) searchParams.append('format', params.format.toString());
        if (params?.status) searchParams.append('status', params.status.toString());
        if (params?.competition_id) searchParams.append('competition_id', params.competition_id.toString());
        if (params?.team_id) searchParams.append('team_id', params.team_id.toString());
        if (params?.date_from) searchParams.append('date_from', params.date_from);
        if (params?.date_to) searchParams.append('date_to', params.date_to);

        const queryString = searchParams.toString();
        return {
          url: `${API_END_POINTS.cricketMatches}${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get cricket match markets by eventId
    getCricketMatchMarkets: builder.query<any, { eventId: string | number }>({
      query: ({ eventId }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('eventId', eventId.toString());
        
        return {
          url: `${API_END_POINTS.cricketMatchMarkets}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get cricket match odds by marketIds - uses direct API polling (backend has cronjob)
    // API has a limit of maximum 10 marketIds per request, so we batch requests
    getCricketMatchOdds: builder.query<any, { marketIds: string[] }>({
      queryFn: async ({ marketIds }, _queryApi, _extraOptions, baseQuery) => {
        // API limit: maximum 10 marketIds per request
        const MAX_MARKET_IDS_PER_REQUEST = 10;
        
        // Split marketIds into chunks of 10
        const chunks: string[][] = [];
        for (let i = 0; i < marketIds.length; i += MAX_MARKET_IDS_PER_REQUEST) {
          chunks.push(marketIds.slice(i, i + MAX_MARKET_IDS_PER_REQUEST));
        }
        
        try {
          // Make parallel requests for each chunk using RTK Query's baseQuery
          const requests = chunks.map(async (chunk) => {
            const marketIdsString = chunk.join(',');
            const result = await baseQuery({
              url: `${API_END_POINTS.cricketMatchOdds}?marketIds=${marketIdsString}`,
              method: 'GET',
            });
            
            if (result.error) {
              throw result.error;
            }
            
            return result.data;
          });
          
          // Wait for all requests to complete
          const responses = await Promise.all(requests);
          
          // Combine all successful responses
          const combinedData = {
            status: true,
            data: [] as any[]
          };
          
          responses.forEach((responseData: any) => {
            if (responseData?.status && Array.isArray(responseData.data)) {
              combinedData.data.push(...responseData.data);
            } else if (Array.isArray(responseData)) {
              combinedData.data.push(...responseData);
            } else if (responseData?.data && Array.isArray(responseData.data)) {
              combinedData.data.push(...responseData.data);
            }
          });
          
          return { data: combinedData };
        } catch (error: any) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error.message || 'Failed to fetch odds',
              data: error
            } 
          };
        }
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get bookmaker and fancy markets by eventId
    getCricketBookmakerFancy: builder.query<any, { eventId: string | number }>({
      query: ({ eventId }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('eventId', eventId.toString());
        
        return {
          url: `${API_END_POINTS.cricketBookmakerFancy}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get all sports
    getAllSports: builder.query<SportsResponse, void>({
      query: () => ({
        url: API_END_POINTS.getAllSports,
        method: 'GET',
      }),
      providesTags: ['Sports'],
    }),
    
    // Get cricket scorecard by eventId
    getCricketScorecard: builder.query<any, { eventId: string | number }>({
      query: ({ eventId }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('eventId', eventId.toString());
        
        return {
          url: `${API_END_POINTS.cricketScorecard}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetCricketCompetitionsQuery,
  useGetCricketMatchesQuery,
  useGetCricketMatchMarketsQuery,
  useGetCricketMatchOddsQuery,
  useGetCricketBookmakerFancyQuery,
  useGetAllSportsQuery,
  useGetCricketScorecardQuery,
} = cricketApi;
