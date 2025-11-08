// API service for sports data
export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  score: string
  time: string
  status: "live" | "upcoming" | "finished"
  series?: string
  league?: string
  odds?: {
    home: number
    away: number
    draw?: number
  }
}

export interface CricketMatch extends Match {
  series: string
  overs: string
  wickets: string
}

export interface SoccerMatch extends Match {
  league: string
  halfTime?: string
  cards?: {
    home: number
    away: number
  }
}

// Mock API functions - replace with actual API calls
export const getCricketMatches = async (): Promise<CricketMatch[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return [
    {
      id: "1",
      homeTeam: "India",
      awayTeam: "Australia",
      score: "245/3",
      time: "45.2",
      status: "live",
      series: "World Cup 2024",
      overs: "45.2",
      wickets: "3"
    },
    {
      id: "2",
      homeTeam: "England",
      awayTeam: "Pakistan",
      score: "180/2",
      time: "38.1",
      status: "live",
      series: "T20 Series",
      overs: "38.1",
      wickets: "2"
    },
    {
      id: "3",
      homeTeam: "South Africa",
      awayTeam: "New Zealand",
      score: "0/0",
      time: "10:30",
      status: "upcoming",
      series: "Test Series",
      overs: "0",
      wickets: "0"
    }
  ]
}

export const getSoccerMatches = async (): Promise<SoccerMatch[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return [
    {
      id: "1",
      homeTeam: "Manchester United",
      awayTeam: "Liverpool",
      score: "2-1",
      time: "67'",
      status: "live",
      league: "Premier League",
      halfTime: "1-0"
    },
    {
      id: "2",
      homeTeam: "Barcelona",
      awayTeam: "Real Madrid",
      score: "0-0",
      time: "15:30",
      status: "upcoming",
      league: "La Liga"
    }
  ]
}

export const getTennisMatches = async (): Promise<Match[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return [
    {
      id: "1",
      homeTeam: "Djokovic",
      awayTeam: "Nadal",
      score: "6-4, 3-2",
      time: "Live",
      status: "live"
    }
  ]
}

export const getHorseRaces = async (): Promise<Match[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return [
    {
      id: "1",
      homeTeam: "Thunder Strike",
      awayTeam: "Lightning Bolt",
      score: "1st/2nd",
      time: "14:30",
      status: "upcoming"
    }
  ]
}
