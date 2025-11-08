import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_END_POINTS } from './ApiEndpoints';
import { CricketCompetitionsResponse, CricketMatchesResponse, CricketMatchesParams } from '../../lib/types/cricket';

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
  tagTypes: ['CricketCompetitions', 'CricketMatches'],
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
    getCricketMatches: builder.query<CricketMatchesResponse, CricketMatchesParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        
        // Add query parameters if provided
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
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
  }),
});

// Export hooks for usage in functional components
export const {
  useGetCricketCompetitionsQuery,
  useGetCricketMatchesQuery,
} = cricketApi;
