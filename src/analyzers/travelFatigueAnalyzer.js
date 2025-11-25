/**
 * Travel & Fatigue Analyzer
 * Analyzes team travel schedules, rest days, and fatigue factors
 */

export class TravelFatigueAnalyzer {
  constructor(db) {
    this.db = db;
  }

  /**
   * Calculate distance between two cities
   */
  calculateDistance(city1, city2) {
    // City coordinates database (major US cities)
    const cityCoords = {
      'Los Angeles': { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
      'New York': { lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
      'Chicago': { lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
      'Houston': { lat: 29.7604, lon: -95.3698, tz: 'America/Chicago' },
      'Phoenix': { lat: 33.4484, lon: -112.0740, tz: 'America/Phoenix' },
      'Philadelphia': { lat: 39.9526, lon: -75.1652, tz: 'America/New_York' },
      'San Antonio': { lat: 29.4241, lon: -98.4936, tz: 'America/Chicago' },
      'San Diego': { lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' },
      'Dallas': { lat: 32.7767, lon: -96.7970, tz: 'America/Chicago' },
      'San Jose': { lat: 37.3382, lon: -121.8863, tz: 'America/Los_Angeles' },
      'Austin': { lat: 30.2672, lon: -97.7431, tz: 'America/Chicago' },
      'Jacksonville': { lat: 30.3322, lon: -81.6557, tz: 'America/New_York' },
      'San Francisco': { lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
      'Columbus': { lat: 39.9612, lon: -82.9988, tz: 'America/New_York' },
      'Indianapolis': { lat: 39.7684, lon: -86.1581, tz: 'America/Indiana/Indianapolis' },
      'Fort Worth': { lat: 32.7555, lon: -97.3308, tz: 'America/Chicago' },
      'Charlotte': { lat: 35.2271, lon: -80.8431, tz: 'America/New_York' },
      'Seattle': { lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
      'Denver': { lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
      'Washington': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
      'Boston': { lat: 42.3601, lon: -71.0589, tz: 'America/New_York' },
      'Detroit': { lat: 42.3314, lon: -83.0458, tz: 'America/Detroit' },
      'Nashville': { lat: 36.1627, lon: -86.7816, tz: 'America/Chicago' },
      'Memphis': { lat: 35.1495, lon: -90.0490, tz: 'America/Chicago' },
      'Portland': { lat: 45.5152, lon: -122.6784, tz: 'America/Los_Angeles' },
      'Oklahoma City': { lat: 35.4676, lon: -97.5164, tz: 'America/Chicago' },
      'Las Vegas': { lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
      'Louisville': { lat: 38.2527, lon: -85.7585, tz: 'America/Kentucky/Louisville' },
      'Baltimore': { lat: 39.2904, lon: -76.6122, tz: 'America/New_York' },
      'Milwaukee': { lat: 43.0389, lon: -87.9065, tz: 'America/Chicago' },
      'Albuquerque': { lat: 35.0844, lon: -106.6504, tz: 'America/Denver' },
      'Tucson': { lat: 32.2226, lon: -110.9747, tz: 'America/Phoenix' },
      'Fresno': { lat: 36.7378, lon: -119.7871, tz: 'America/Los_Angeles' },
      'Sacramento': { lat: 38.5816, lon: -121.4944, tz: 'America/Los_Angeles' },
      'Kansas City': { lat: 39.0997, lon: -94.5786, tz: 'America/Chicago' },
      'Mesa': { lat: 33.4152, lon: -111.8315, tz: 'America/Phoenix' },
      'Atlanta': { lat: 33.7490, lon: -84.3880, tz: 'America/New_York' },
      'Omaha': { lat: 41.2565, lon: -95.9345, tz: 'America/Chicago' },
      'Colorado Springs': { lat: 38.8339, lon: -104.8214, tz: 'America/Denver' },
      'Raleigh': { lat: 35.7796, lon: -78.6382, tz: 'America/New_York' },
      'Miami': { lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
      'Cleveland': { lat: 41.4993, lon: -81.6944, tz: 'America/New_York' },
      'Tampa': { lat: 27.9506, lon: -82.4572, tz: 'America/New_York' },
      'Pittsburgh': { lat: 40.4406, lon: -79.9959, tz: 'America/New_York' },
      'Cincinnati': { lat: 39.1031, lon: -84.5120, tz: 'America/New_York' },
      'Minneapolis': { lat: 44.9778, lon: -93.2650, tz: 'America/Chicago' },
      'Orlando': { lat: 28.5383, lon: -81.3792, tz: 'America/New_York' },
      'New Orleans': { lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
      'Salt Lake City': { lat: 40.7608, lon: -111.8910, tz: 'America/Denver' }
    };

    const coords1 = cityCoords[city1] || cityCoords['New York'];
    const coords2 = cityCoords[city2] || cityCoords['Los Angeles'];

    // Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(coords2.lat - coords1.lat);
    const dLon = this.toRad(coords2.lon - coords1.lon);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coords1.lat)) * Math.cos(this.toRad(coords2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate time zones crossed
    const timeZones = {
      'America/New_York': -5,
      'America/Chicago': -6,
      'America/Denver': -7,
      'America/Phoenix': -7,
      'America/Los_Angeles': -8,
      'America/Detroit': -5,
      'America/Indiana/Indianapolis': -5,
      'America/Kentucky/Louisville': -5
    };

    const tz1 = timeZones[coords1.tz] || -5;
    const tz2 = timeZones[coords2.tz] || -5;
    const tzCrossed = Math.abs(tz2 - tz1);

    return {
      distance_miles: Math.round(distance),
      time_zones_crossed: tzCrossed,
      travel_hours: Math.round((distance / 500) * 10) / 10 // Assume 500 mph flight speed
    };
  }

  /**
   * Convert degrees to radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Analyze team travel for a game
   */
  async analyzeTeamTravel(teamId, gameId, previousGames) {
    if (!previousGames || previousGames.length === 0) {
      return {
        distance_miles: 0,
        time_zones_crossed: 0,
        travel_duration_hours: 0,
        is_back_to_back: false,
        days_rest: 3,
        fatigue_score: 0
      };
    }

    const lastGame = previousGames[0];
    const currentGame = await this.getGameDetails(gameId);

    // Calculate travel distance
    const travelStats = this.calculateDistance(
      lastGame.city,
      currentGame.city
    );

    // Check if back-to-back games
    const lastGameDate = new Date(lastGame.date);
    const currentGameDate = new Date(currentGame.date);
    const daysBetween = Math.floor((currentGameDate - lastGameDate) / (1000 * 60 * 60 * 24));
    const isBackToBack = daysBetween <= 1;

    // Calculate fatigue score (0-10, higher = more fatigued)
    let fatigueScore = 0;

    // Distance factor (every 500 miles = 1 point)
    fatigueScore += travelStats.distance_miles / 500;

    // Time zone factor (each zone = 1.5 points)
    fatigueScore += travelStats.time_zones_crossed * 1.5;

    // Back-to-back penalty (3 points)
    if (isBackToBack) fatigueScore += 3;

    // Rest factor (less rest = more fatigue)
    if (daysBetween === 0) fatigueScore += 3;
    else if (daysBetween === 1) fatigueScore += 1.5;
    else if (daysBetween === 2) fatigueScore += 0.5;

    // Cap at 10
    fatigueScore = Math.min(10, fatigueScore);

    return {
      team_id: teamId,
      game_id: gameId,
      departure_city: lastGame.city,
      arrival_city: currentGame.city,
      distance_miles: travelStats.distance_miles,
      time_zones_crossed: travelStats.time_zones_crossed,
      travel_duration_hours: travelStats.travel_hours,
      is_back_to_back: isBackToBack,
      days_rest: daysBetween,
      fatigue_score: Math.round(fatigueScore * 10) / 10
    };
  }

  /**
   * Analyze overall rest and recovery
   */
  async analyzeRestAndRecovery(teamId, gameId, recentGames) {
    if (!recentGames || recentGames.length === 0) {
      return {
        days_since_last_game: 3,
        games_in_last_7_days: 0,
        games_in_last_14_days: 0,
        total_travel_miles_last_7_days: 0,
        is_jet_lagged: false,
        overall_fatigue_score: 0
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Count games in recent periods
    const gamesLast7 = recentGames.filter(g => new Date(g.date) >= sevenDaysAgo).length;
    const gamesLast14 = recentGames.filter(g => new Date(g.date) >= fourteenDaysAgo).length;

    // Calculate total travel miles
    let totalTravelMiles = 0;
    for (let i = 0; i < recentGames.length - 1 && i < 5; i++) {
      const travel = this.calculateDistance(recentGames[i].city, recentGames[i + 1].city);
      totalTravelMiles += travel.distance_miles;
    }

    // Check for jet lag (crossed 2+ time zones in last 3 days)
    let isJetLagged = false;
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentTrips = recentGames.filter(g => new Date(g.date) >= threeDaysAgo);
    if (recentTrips.length >= 2) {
      const travel = this.calculateDistance(recentTrips[0].city, recentTrips[1].city);
      isJetLagged = travel.time_zones_crossed >= 2;
    }

    // Days since last game
    const lastGameDate = recentGames[0] ? new Date(recentGames[0].date) : fourteenDaysAgo;
    const daysSinceLastGame = Math.floor((now - lastGameDate) / (1000 * 60 * 60 * 24));

    // Calculate overall fatigue score (0-10)
    let fatigueScore = 0;

    // Games frequency factor
    if (gamesLast7 >= 5) fatigueScore += 4;
    else if (gamesLast7 >= 4) fatigueScore += 3;
    else if (gamesLast7 >= 3) fatigueScore += 2;

    // Travel miles factor (every 1000 miles = 1 point)
    fatigueScore += totalTravelMiles / 1000;

    // Jet lag penalty
    if (isJetLagged) fatigueScore += 2;

    // Insufficient rest penalty
    if (daysSinceLastGame === 0) fatigueScore += 2;
    else if (daysSinceLastGame === 1) fatigueScore += 1;

    // Long rest bonus (reduces fatigue)
    if (daysSinceLastGame >= 4) fatigueScore = Math.max(0, fatigueScore - 2);

    fatigueScore = Math.min(10, Math.max(0, fatigueScore));

    return {
      team_id: teamId,
      game_id: gameId,
      days_since_last_game: daysSinceLastGame,
      games_in_last_7_days: gamesLast7,
      games_in_last_14_days: gamesLast14,
      total_travel_miles_last_7_days: totalTravelMiles,
      is_jet_lagged: isJetLagged,
      overall_fatigue_score: Math.round(fatigueScore * 10) / 10
    };
  }

  /**
   * Compare team fatigue levels
   */
  compareFatigueAdvantage(homeTeamFatigue, awayTeamFatigue) {
    const differential = awayTeamFatigue - homeTeamFatigue;

    let advantage = 'neutral';
    let advantageScore = 0;

    if (differential > 2) {
      advantage = 'home';
      advantageScore = Math.min(10, differential);
    } else if (differential < -2) {
      advantage = 'away';
      advantageScore = Math.min(10, Math.abs(differential));
    }

    return {
      advantage: advantage,
      advantage_score: advantageScore,
      home_fatigue: homeTeamFatigue,
      away_fatigue: awayTeamFatigue,
      differential: Math.round(differential * 10) / 10
    };
  }

  /**
   * Get game details (mock - implement with real DB query)
   */
  async getGameDetails(gameId) {
    // TODO: Query from D1 database
    return {
      id: gameId,
      city: 'Los Angeles',
      date: new Date()
    };
  }

  /**
   * Calculate schedule difficulty
   */
  calculateScheduleDifficulty(upcomingGames) {
    if (!upcomingGames || upcomingGames.length === 0) return 5;

    let difficultyScore = 0;
    let totalTravel = 0;
    let backToBackCount = 0;

    for (let i = 0; i < upcomingGames.length && i < 10; i++) {
      const game = upcomingGames[i];

      // Factor in opponent strength (if available)
      if (game.opponent_ranking) {
        difficultyScore += (11 - game.opponent_ranking) * 0.5;
      }

      // Factor in travel
      if (i > 0) {
        const travel = this.calculateDistance(
          upcomingGames[i - 1].city,
          game.city
        );
        totalTravel += travel.distance_miles;

        // Back-to-back games
        const daysBetween = Math.floor(
          (new Date(game.date) - new Date(upcomingGames[i - 1].date)) / (1000 * 60 * 60 * 24)
        );
        if (daysBetween <= 1) backToBackCount++;
      }
    }

    // Add travel difficulty
    difficultyScore += totalTravel / 1000;

    // Add back-to-back penalty
    difficultyScore += backToBackCount * 2;

    // Normalize to 0-10 scale
    return Math.min(10, difficultyScore);
  }
}

export default TravelFatigueAnalyzer;
