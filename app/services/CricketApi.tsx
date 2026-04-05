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
    
    // Get cricket match detail by marketid (for live detail screen)
    getCricketMatchMarkets: builder.query<any, { marketid: string | number }>({
      query: ({ marketid }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('marketid', marketid.toString());
        
        return {
          url: `${API_END_POINTS.cricketMatchDetail}?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['CricketMatches'],
    }),
    
    // Get cricket match odds by eventId (single request per match)
    getCricketMatchOdds: builder.query<any, { eventId: string | number }>({
      query: ({ eventId }) => {
        const searchParams = new URLSearchParams();
        searchParams.append('eventId', eventId.toString());

        return {
          url: `${API_END_POINTS.cricketMatchOdds}?${searchParams.toString()}`,
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

    // Fancyres dashboard scores (tennis / soccer) — external JSON
    getFancyresTennisScore: builder.query<unknown, { eventId: string | number }>({
      query: ({ eventId }) => ({
        url: API_END_POINTS.fancyresTennisScore(eventId),
        method: 'GET',
      }),
      providesTags: ['CricketMatches'],
    }),
    getFancyresSoccerScore: builder.query<unknown, { eventId: string | number }>({
      query: ({ eventId }) => ({
        url: API_END_POINTS.fancyresSoccerScore(eventId),
        method: 'GET',
      }),
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
  useGetFancyresTennisScoreQuery,
  useGetFancyresSoccerScoreQuery,
} = cricketApi;
