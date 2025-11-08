// Cricket API Types based on actual API response
export interface Competition {
  id: string;
  name: string;
}

export interface CompetitionData {
  competition: Competition;
  competitionRegion: string;
  marketCount: number;
}

export interface CricketCompetitionsResponse {
  message: string;
  data: CompetitionData[];
}

// Legacy types for individual matches (if they exist)
export interface Team {
  team_id: number;
  name: string;
  short_name: string;
  logo_url: string;
  scores_full: string;
  scores: string;
  overs: string;
}

export interface Venue {
  venue_id: string;
  name: string;
  location: string;
  country: string;
  timezone: string;
}

export interface Toss {
  text: string;
  winner: number;
  decision: number;
}

export interface CricketMatch {
  match_id: number;
  title: string;
  short_title: string;
  subtitle: string;
  match_number: string;
  format: number;
  format_str: string;
  status: number;
  status_str: string;
  status_note: string;
  verified: string;
  pre_squad: string;
  odds_available: string;
  oddstype: string;
  session_odds_available: boolean;
  game_state: number;
  game_state_str: string;
  domestic: string;
  competition: Competition;
  teama: Team;
  teamb: Team;
  date_start: string;
  date_end: string;
  timestamp_start: number;
  timestamp_end: number;
  date_start_ist: string;
  date_end_ist: string;
  venue: Venue;
  umpires: string;
  referee: string;
  equation: string;
  live: string;
  result: string;
  result_type: number;
  win_margin: string;
  winning_team_id: number;
  commentary: number;
  wagon: number;
  latest_inning_number: number;
  presquad_time: string;
  verify_time: string;
  match_dls_affected: string;
  day: string;
  session: string;
  toss: Toss;
}

export interface CricketMatchesResponse {
  status: string;
  response: {
    items: CricketMatch[];
    total_items: number;
    total_pages: number;
  };
  etag: string;
  modified: string;
  datetime: string;
  api_version: string;
}

export interface CricketMatchesParams {
  page?: number;
  per_page?: number;
  format?: number; // 1=ODI, 2=Test, 6=T20, etc.
  status?: number; // 1=Live, 2=Completed, 3=Upcoming
  competition_id?: number;
  team_id?: number;
  date_from?: string;
  date_to?: string;
}


