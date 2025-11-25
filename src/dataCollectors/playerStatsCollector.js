/**
 * Player Stats Data Collector
 * Fetches comprehensive player statistics from multiple sources
 */

export class PlayerStatsCollector {
  constructor(db) {
    this.db = db;
  }

  /**
   * Collect player stats from ESPN API
   */
  async collectESPNPlayerStats(sport, season = '2024') {
    const stats = [];
    let apiUrl;

    switch (sport.toLowerCase()) {
      case 'nba':
        apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes';
        break;
      case 'nfl':
        apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes';
        break;
      case 'mlb':
        apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/athletes';
        break;
      default:
        throw new Error(`Unsupported sport: ${sport}`);
    }

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.athletes) {
        for (const athlete of data.athletes) {
          const playerStat = this.parseESPNPlayerData(athlete, sport);
          stats.push(playerStat);
        }
      }

      return stats;
    } catch (error) {
      console.error('Error collecting ESPN player stats:', error);
      return [];
    }
  }

  /**
   * Parse ESPN player data into our format
   */
  parseESPNPlayerData(athlete, sport) {
    return {
      external_id: athlete.id,
      name: athlete.displayName || athlete.fullName,
      position: athlete.position?.displayName || athlete.position?.abbreviation,
      jersey_number: athlete.jersey,
      team_id: athlete.team?.id,
      height: athlete.height,
      weight: athlete.weight,
      age: athlete.age,
      birth_date: athlete.birthDate,
      birth_place: athlete.birthPlace?.city,
      nationality: athlete.citizenship,
      college: athlete.college?.name,
      photo_url: athlete.headshot?.href,
      is_active: athlete.active !== false,
      stats: athlete.statistics || []
    };
  }

  /**
   * Collect advanced player performance metrics
   */
  async collectAdvancedMetrics(playerId, sport, season) {
    const metrics = {
      player_id: playerId,
      season: season
    };

    try {
      // Fetch player's recent game logs
      const gameLogs = await this.fetchPlayerGameLogs(playerId, sport);

      // Calculate advanced metrics based on sport
      switch (sport.toLowerCase()) {
        case 'nba':
          Object.assign(metrics, this.calculateNBAAdvancedMetrics(gameLogs));
          break;
        case 'nfl':
          Object.assign(metrics, this.calculateNFLAdvancedMetrics(gameLogs));
          break;
        case 'mlb':
          Object.assign(metrics, this.calculateMLBAdvancedMetrics(gameLogs));
          break;
      }

      // Calculate universal metrics
      Object.assign(metrics, {
        consistency_score: this.calculateConsistencyScore(gameLogs),
        clutch_performance_rating: this.calculateClutchRating(gameLogs),
        home_vs_away_differential: this.calculateHomeAwayDiff(gameLogs),
        vs_top_teams_rating: this.calculateVsTopTeamsRating(gameLogs)
      });

      return metrics;
    } catch (error) {
      console.error('Error collecting advanced metrics:', error);
      return null;
    }
  }

  /**
   * Calculate NBA advanced metrics
   */
  calculateNBAAdvancedMetrics(gameLogs) {
    if (!gameLogs || gameLogs.length === 0) return {};

    let totalPER = 0, totalTS = 0, totalUSG = 0;
    let totalORtg = 0, totalDRtg = 0, totalPlusMinus = 0;
    let games = 0;

    for (const game of gameLogs) {
      if (!game.stats) continue;

      // Player Efficiency Rating (simplified)
      const per = this.calculatePER(game.stats);
      totalPER += per;

      // True Shooting %
      const ts = this.calculateTrueShootingPct(game.stats);
      totalTS += ts;

      // Usage Rate
      const usg = this.calculateUsageRate(game.stats);
      totalUSG += usg;

      // Offensive/Defensive Rating (simplified)
      totalORtg += game.stats.offensiveRating || 100;
      totalDRtg += game.stats.defensiveRating || 100;

      // Plus/Minus
      totalPlusMinus += game.stats.plusMinus || 0;

      games++;
    }

    return {
      player_efficiency_rating: games > 0 ? totalPER / games : 0,
      true_shooting_percentage: games > 0 ? totalTS / games : 0,
      usage_rate: games > 0 ? totalUSG / games : 0,
      offensive_rating: games > 0 ? totalORtg / games : 0,
      defensive_rating: games > 0 ? totalDRtg / games : 0,
      plus_minus: games > 0 ? totalPlusMinus / games : 0,
      games_played: games
    };
  }

  /**
   * Calculate NFL advanced metrics
   */
  calculateNFLAdvancedMetrics(gameLogs) {
    if (!gameLogs || gameLogs.length === 0) return {};

    let totalQBR = 0, totalYPA = 0, totalCompPct = 0;
    let totalPasserRating = 0, totalRushYPC = 0;
    let games = 0;

    for (const game of gameLogs) {
      if (!game.stats) continue;

      totalQBR += game.stats.qbr || 0;
      totalYPA += game.stats.yardsPerAttempt || 0;
      totalCompPct += game.stats.completionPercentage || 0;
      totalPasserRating += game.stats.passerRating || 0;
      totalRushYPC += game.stats.rushYardsPerCarry || 0;

      games++;
    }

    return {
      qbr: games > 0 ? totalQBR / games : 0,
      yards_per_attempt: games > 0 ? totalYPA / games : 0,
      completion_percentage: games > 0 ? totalCompPct / games : 0,
      passer_rating: games > 0 ? totalPasserRating / games : 0,
      rush_yards_per_carry: games > 0 ? totalRushYPC / games : 0,
      games_played: games
    };
  }

  /**
   * Calculate MLB advanced metrics
   */
  calculateMLBAdvancedMetrics(gameLogs) {
    if (!gameLogs || gameLogs.length === 0) return {};

    let totalBA = 0, totalOBP = 0, totalSLG = 0;
    let totalOPS = 0, totalERA = 0, totalWHIP = 0;
    let games = 0;

    for (const game of gameLogs) {
      if (!game.stats) continue;

      totalBA += game.stats.battingAverage || 0;
      totalOBP += game.stats.onBasePercentage || 0;
      totalSLG += game.stats.sluggingPercentage || 0;
      totalOPS += game.stats.ops || 0;
      totalERA += game.stats.era || 0;
      totalWHIP += game.stats.whip || 0;

      games++;
    }

    return {
      batting_average: games > 0 ? totalBA / games : 0,
      on_base_percentage: games > 0 ? totalOBP / games : 0,
      slugging_percentage: games > 0 ? totalSLG / games : 0,
      ops: games > 0 ? totalOPS / games : 0,
      era: games > 0 ? totalERA / games : 0,
      whip: games > 0 ? totalWHIP / games : 0,
      games_played: games
    };
  }

  /**
   * Helper: Calculate Player Efficiency Rating
   */
  calculatePER(stats) {
    // Simplified PER calculation
    const points = stats.points || 0;
    const rebounds = (stats.offensiveRebounds || 0) + (stats.defensiveRebounds || 0);
    const assists = stats.assists || 0;
    const steals = stats.steals || 0;
    const blocks = stats.blocks || 0;
    const turnovers = stats.turnovers || 0;
    const fgMissed = (stats.fieldGoalsAttempted || 0) - (stats.fieldGoalsMade || 0);
    const ftMissed = (stats.freeThrowsAttempted || 0) - (stats.freeThrowsMade || 0);

    return (points + rebounds + assists + steals + blocks - turnovers - fgMissed - ftMissed) /
           (stats.minutesPlayed || 1);
  }

  /**
   * Helper: Calculate True Shooting Percentage
   */
  calculateTrueShootingPct(stats) {
    const points = stats.points || 0;
    const fga = stats.fieldGoalsAttempted || 0;
    const fta = stats.freeThrowsAttempted || 0;

    if (fga + (0.44 * fta) === 0) return 0;
    return points / (2 * (fga + (0.44 * fta)));
  }

  /**
   * Helper: Calculate Usage Rate
   */
  calculateUsageRate(stats) {
    const fga = stats.fieldGoalsAttempted || 0;
    const fta = stats.freeThrowsAttempted || 0;
    const turnovers = stats.turnovers || 0;
    const minutes = stats.minutesPlayed || 0;

    if (minutes === 0) return 0;
    return ((fga + (0.44 * fta) + turnovers) / minutes) * 100;
  }

  /**
   * Calculate consistency score (lower standard deviation = more consistent)
   */
  calculateConsistencyScore(gameLogs) {
    if (!gameLogs || gameLogs.length < 3) return 5.0; // default middle score

    const performances = gameLogs.map(g => g.stats?.performanceScore || 0);
    const mean = performances.reduce((a, b) => a + b, 0) / performances.length;
    const variance = performances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performances.length;
    const stdDev = Math.sqrt(variance);

    // Convert to 0-10 scale (lower stdDev = higher consistency)
    return Math.max(0, Math.min(10, 10 - (stdDev / 2)));
  }

  /**
   * Calculate clutch performance rating
   */
  calculateClutchRating(gameLogs) {
    if (!gameLogs || gameLogs.length === 0) return 5.0;

    let clutchGames = gameLogs.filter(g => g.isClutchSituation);
    if (clutchGames.length === 0) return 5.0;

    const clutchPerformance = clutchGames.reduce((sum, g) => sum + (g.stats?.performanceScore || 0), 0) / clutchGames.length;
    const regularPerformance = gameLogs.reduce((sum, g) => sum + (g.stats?.performanceScore || 0), 0) / gameLogs.length;

    // Compare clutch vs regular performance
    const differential = clutchPerformance - regularPerformance;
    return Math.max(0, Math.min(10, 5 + differential));
  }

  /**
   * Calculate home vs away performance differential
   */
  calculateHomeAwayDiff(gameLogs) {
    if (!gameLogs || gameLogs.length === 0) return 0;

    const homeGames = gameLogs.filter(g => g.isHomeGame);
    const awayGames = gameLogs.filter(g => !g.isHomeGame);

    if (homeGames.length === 0 || awayGames.length === 0) return 0;

    const homeAvg = homeGames.reduce((sum, g) => sum + (g.stats?.performanceScore || 0), 0) / homeGames.length;
    const awayAvg = awayGames.reduce((sum, g) => sum + (g.stats?.performanceScore || 0), 0) / awayGames.length;

    return homeAvg - awayAvg;
  }

  /**
   * Calculate performance vs top teams
   */
  calculateVsTopTeamsRating(gameLogs) {
    if (!gameLogs || gameLogs.length === 0) return 5.0;

    const vsTopTeams = gameLogs.filter(g => g.opponentRanking && g.opponentRanking <= 10);
    if (vsTopTeams.length === 0) return 5.0;

    const avgPerformance = vsTopTeams.reduce((sum, g) => sum + (g.stats?.performanceScore || 0), 0) / vsTopTeams.length;
    return Math.max(0, Math.min(10, avgPerformance));
  }

  /**
   * Fetch player game logs (mock for now, implement with real API)
   */
  async fetchPlayerGameLogs(playerId, sport) {
    // TODO: Implement real API calls to ESPN or other sources
    // For now, return mock data structure
    return [];
  }

  /**
   * Detect player streaks (hot/cold)
   */
  async detectPlayerStreaks(playerId, sport) {
    const gameLogs = await this.fetchPlayerGameLogs(playerId, sport);
    if (!gameLogs || gameLogs.length < 5) return null;

    const recentGames = gameLogs.slice(0, 5);
    const performances = recentGames.map(g => g.stats?.performanceScore || 0);
    const avgRecent = performances.reduce((a, b) => a + b, 0) / performances.length;

    // Get season average
    const seasonAvg = gameLogs.reduce((sum, g) => sum + (g.stats?.performanceScore || 0), 0) / gameLogs.length;

    const differential = avgRecent - seasonAvg;

    let streakType;
    if (differential > 2) streakType = 'hot';
    else if (differential < -2) streakType = 'cold';
    else if (differential > 0.5) streakType = 'improving';
    else if (differential < -0.5) streakType = 'declining';
    else streakType = 'stable';

    return {
      player_id: playerId,
      streak_type: streakType,
      metric: 'performance_score',
      current_streak: recentGames.length,
      average_during_streak: avgRecent,
      vs_season_average_differential: differential,
      is_active: true
    };
  }
}

export default PlayerStatsCollector;
