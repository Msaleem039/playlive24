/**
 * Mock matches data for sports that don't have API integration yet
 * Returns empty arrays or mock data based on sport type
 */

export interface MockMatch {
  id: string
  name: string
  sport: string
  status: string
  [key: string]: any
}

/**
 * Get mock matches by sport type
 * @param sport - The sport name (soccer, tennis, horse, greyhound, etc.)
 * @returns Array of mock matches
 */
export function getMatchesBySport(sport: string): MockMatch[] {
  // For now, return empty arrays since these sports don't have API integration
  // You can add mock data here if needed for development/testing
  const sportLower = sport.toLowerCase()
  
  // Return empty array for all sports (they can be populated with real API data later)
  return []
  
  // Example mock data structure (commented out):
  // if (sportLower === "soccer") {
  //   return [
  //     {
  //       id: "1",
  //       name: "Team A vs Team B",
  //       sport: "soccer",
  //       status: "live",
  //       // ... other fields
  //     }
  //   ]
  // }
  // return []
}


