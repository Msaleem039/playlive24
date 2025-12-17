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
    getCricketMatchOdds: builder.query<any, { marketIds: string[] }>({
      query: ({ marketIds }) => {
        const searchParams = new URLSearchParams();
        marketIds.forEach(id => searchParams.append('marketIds', id));
        
        return {
          url: `${API_END_POINTS.cricketMatchOdds}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get cricket match details by gmid (legacy)
    getCricketMatchDetail: builder.query<any, { sid: number; gmid: number }>({
      query: ({ sid, gmid }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('sid', sid.toString());
        searchParams.append('gmid', gmid.toString());
        
        return {
          url: `${API_END_POINTS.cricketMatchDetail}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get cricket match private data (fancy, odds, all markets)
    getCricketMatchPrivate: builder.query<any, { sid: number; gmid: number }>({
      query: ({ sid, gmid }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('sid', sid.toString());
        searchParams.append('gmid', gmid.toString());
        
        return {
          url: `${API_END_POINTS.cricketMatchPrivate}?${searchParams.toString()}`,
          method: 'GET',
        };
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
  }),
});

// Export hooks for usage in functional components
export const {
  useGetCricketCompetitionsQuery,
  useGetCricketMatchesQuery,
  useGetCricketMatchMarketsQuery,
  useGetCricketMatchOddsQuery,
  useGetCricketMatchDetailQuery,
  useGetCricketMatchPrivateQuery,
  useGetCricketBookmakerFancyQuery,
  useGetAllSportsQuery,
} = cricketApi;
