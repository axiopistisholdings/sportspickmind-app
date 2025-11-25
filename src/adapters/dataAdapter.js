/**
 * Database Adapter
 * Bridges existing schema with advanced prediction engine
 *
 * Provides unified interface to query existing data (TEXT IDs, JSON metadata)
 * and transform it into format expected by prediction engine
 */

class DatabaseAdapter {
  constructor(db, kvCache = null) {
    this.db = db;
    this.cache = kvCache;
    this.cacheTTL = 3600; // 1 hour cache
  }

  // ==================== TEAM DATA ====================

  /**
   * Get team data by ID or name
   * Supports both TEXT IDs (nfl-sf) and team names (San Francisco 49ers)
   */
  async getTeam(teamIdOrName) {
    const cacheKey = `team:${teamIdOrName}`;

    // Check cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    // Query database
    const team = await this.db.prepare(`
      SELECT * FROM teams
      WHERE id = ? OR name LIKE ? OR abbreviation LIKE ?
      LIMIT 1
    `).bind(teamIdOrName, `%${teamIdOrName}%`, `%${teamIdOrName}%`).first();

    if (!team) return null;

    const result = this.transformTeam(team);

    // Cache result
    if (this.cache) {
      await this.cache.put(cacheKey, JSON.stringify(result), {
        expirationTtl: this.cacheTTL
      });
    }

    return result;
  }

  transformTeam(team) {
    return {
      id: team.id,
      name: team.name,
      city: team.city,
      abbreviation: team.abbreviation,
      sport: team.sport_id,
      conference: team.conference,
      division: team.division,
      logo_url: team.logo_url,
      venue: team.venue || null
    };
  }

  // ==================== PLAYER DATA ====================

  /**
   * Get player with stats from JSON metadata
   */
  async getPlayer(playerId) {
    const player = await this.db.prepare(`
      SELECT * FROM players WHERE id = ? LIMIT 1
    `).bind(playerId).first();

    if (!player) return null;

    return this.transformPlayer(player);
  }

  /**
   * Get all players for a team
   */
  async getTeamPlayers(teamId, position = null) {
    let query = 'SELECT * FROM players WHERE team_id = ?';
    const params = [teamId];

    if (position) {
      query += ' AND position = ?';
      params.push(position);
    }

    const result = await this.db.prepare(query).bind(...params).all();

    return result.results.map(p => this.transformPlayer(p));
  }

  transformPlayer(player) {
    const metadata = this.parseJSON(player.metadata);

    return {
      id: player.id,
      name: player.name,
      position: player.position,
      team_id: player.team_id,
      jersey_number: player.jersey_number,
      status: player.status,
      sport: player.sport_id,
      // Stats from JSON metadata
      stats: metadata,
      // Calculate derived metrics
      efficiency: this.calculatePlayerEfficiency(metadata, player.sport_id)
    };
  }

  calculatePlayerEfficiency(stats, sport) {
    if (!stats || Object.keys(stats).length === 0) return 50; // Default

    // Sport-specific efficiency calculations
    if (sport && sport.startsWith('nfl')) {
      // NFL: QB rating, rushing yards, receptions
      const passing = stats.passing_yards || 0;
      const tds = stats.touchdowns || 0;
      const rushing = stats.rushing_yards || 0;
      return Math.min(100, (passing / 30) + (tds * 5) + (rushing / 10));
    } else if (sport && sport.startsWith('nba')) {
      // NBA: Points, assists, rebounds
      const points = stats.points || 0;
      const assists = stats.assists || 0;
      const rebounds = stats.rebounds || 0;
      return Math.min(100, (points / 2) + assists + rebounds);
    } else if (sport && sport.startsWith('mlb')) {
      // MLB: Batting average, OBP
      const ba = stats.batting_average || 0;
      const obp = stats.on_base_percentage || 0;
      return Math.min(100, ((ba + obp) / 2) * 100);
    } else if (sport && sport.startsWith('nhl')) {
      // NHL: Goals, assists
      const goals = stats.goals || 0;
      const assists = stats.assists || 0;
      return Math.min(100, (goals * 3) + (assists * 2));
    }

    return 50; // Default middle value
  }

  // ==================== GAME DATA ====================

  /**
   * Get game by ID
   */
  async getGame(gameId) {
    const game = await this.db.prepare(`
      SELECT * FROM games WHERE id = ? LIMIT 1
    `).bind(gameId).first();

    if (!game) return null;

    return this.transformGame(game);
  }

  /**
   * Get team's recent games
   */
  async getTeamRecentGames(teamId, limit = 10, statusFilter = 'final') {
    const result = await this.db.prepare(`
      SELECT * FROM games
      WHERE (home_team_id = ? OR away_team_id = ?)
        AND status = ?
      ORDER BY game_date DESC
      LIMIT ?
    `).bind(teamId, teamId, statusFilter, limit).all();

    return result.results.map(g => this.transformGame(g));
  }

  /**
   * Get upcoming games for a team
   */
  async getTeamUpcomingGames(teamId, limit = 5) {
    const result = await this.db.prepare(`
      SELECT * FROM games
      WHERE (home_team_id = ? OR away_team_id = ?)
        AND status = 'scheduled'
        AND game_date > ?
      ORDER BY game_date ASC
      LIMIT ?
    `).bind(teamId, teamId, Math.floor(Date.now() / 1000), limit).all();

    return result.results.map(g => this.transformGame(g));
  }

  transformGame(game) {
    const metadata = this.parseJSON(game.metadata);

    return {
      id: game.id,
      sport: game.sport_id,
      date: new Date(game.game_date * 1000).toISOString(),
      timestamp: game.game_date,
      home_team: game.home_team_id,
      away_team: game.away_team_id,
      home_team_name: game.home_team_name,
      away_team_name: game.away_team_name,
      venue: game.venue,
      status: game.status,
      home_score: game.home_score,
      away_score: game.away_score,
      metadata: metadata
    };
  }

  // ==================== TEAM FORM ANALYSIS ====================

  /**
   * Calculate team's current form from recent games
   * Returns 0-10 score based on recent performance
   */
  async calculateTeamForm(teamId, gameCount = 10) {
    const recentGames = await this.getTeamRecentGames(teamId, gameCount, 'final');

    if (recentGames.length === 0) {
      return {
        games_played: 0,
        wins: 0,
        losses: 0,
        win_percentage: 0.5,
        avg_points_scored: 0,
        avg_points_allowed: 0,
        point_differential: 0,
        form_score: 5.0, // Neutral
        momentum: 'unknown'
      };
    }

    let wins = 0;
    let totalPointsScored = 0;
    let totalPointsAllowed = 0;
    let recentWins = 0; // Last 5 games

    recentGames.forEach((game, index) => {
      const isHome = game.home_team === teamId;
      const teamScore = isHome ? game.home_score : game.away_score;
      const oppScore = isHome ? game.away_score : game.home_score;

      if (teamScore > oppScore) {
        wins++;
        if (index < 5) recentWins++;
      }

      totalPointsScored += teamScore || 0;
      totalPointsAllowed += oppScore || 0;
    });

    const gamesPlayed = recentGames.length;
    const winPercentage = wins / gamesPlayed;
    const avgScored = totalPointsScored / gamesPlayed;
    const avgAllowed = totalPointsAllowed / gamesPlayed;
    const pointDiff = avgScored - avgAllowed;

    // Form score: 0-10 based on win%, point diff, and recent momentum
    const formScore = (
      (winPercentage * 5) + // Win% contributes 0-5
      (Math.min(Math.max(pointDiff / 10, -2.5), 2.5) + 2.5) + // Point diff contributes 0-5
      (recentWins / 5 * 2) // Recent momentum contributes 0-2
    );

    // Determine momentum
    let momentum = 'neutral';
    if (recentWins >= 4) momentum = 'hot';
    else if (recentWins >= 3) momentum = 'positive';
    else if (recentWins <= 1) momentum = 'cold';
    else if (recentWins === 2) momentum = 'neutral';

    return {
      games_played: gamesPlayed,
      wins: wins,
      losses: gamesPlayed - wins,
      win_percentage: Math.round(winPercentage * 1000) / 1000,
      avg_points_scored: Math.round(avgScored * 10) / 10,
      avg_points_allowed: Math.round(avgAllowed * 10) / 10,
      point_differential: Math.round(pointDiff * 10) / 10,
      form_score: Math.min(10, Math.max(0, Math.round(formScore * 10) / 10)),
      momentum: momentum,
      last_5_wins: recentWins
    };
  }

  // ==================== HEAD-TO-HEAD ANALYSIS ====================

  /**
   * Get historical matchup data between two teams
   */
  async getHeadToHeadHistory(team1Id, team2Id, limit = 10) {
    const result = await this.db.prepare(`
      SELECT * FROM games
      WHERE ((home_team_id = ? AND away_team_id = ?)
         OR (home_team_id = ? AND away_team_id = ?))
        AND status IN ('final', 'completed')
      ORDER BY game_date DESC
      LIMIT ?
    `).bind(team1Id, team2Id, team2Id, team1Id, limit).all();

    const games = result.results.map(g => this.transformGame(g));

    if (games.length === 0) {
      return {
        total_games: 0,
        team1_wins: 0,
        team2_wins: 0,
        team1_win_percentage: 0.5,
        avg_score_differential: 0,
        home_advantage: 0,
        recent_games: [],
        h2h_score: 5.0 // Neutral
      };
    }

    let team1Wins = 0;
    let team1Home = 0;
    let team1Away = 0;
    let totalDiff = 0;

    games.forEach(game => {
      const team1IsHome = game.home_team === team1Id;
      const team1Score = team1IsHome ? game.home_score : game.away_score;
      const team2Score = team1IsHome ? game.away_score : game.home_score;

      if (team1Score > team2Score) {
        team1Wins++;
        if (team1IsHome) team1Home++;
        else team1Away++;
      }

      totalDiff += (team1Score - team2Score);
    });

    const team1WinPct = team1Wins / games.length;
    const avgDiff = totalDiff / games.length;

    // H2H score: 0-10, where 10 = team1 dominates, 0 = team2 dominates
    const h2hScore = team1WinPct * 10;

    return {
      total_games: games.length,
      team1_wins: team1Wins,
      team2_wins: games.length - team1Wins,
      team1_win_percentage: Math.round(team1WinPct * 1000) / 1000,
      avg_score_differential: Math.round(avgDiff * 10) / 10,
      team1_home_record: `${team1Home}-${games.filter(g => g.home_team === team1Id).length - team1Home}`,
      team1_away_record: `${team1Away}-${games.filter(g => g.away_team === team1Id).length - team1Away}`,
      recent_games: games.slice(0, 5),
      h2h_score: Math.round(h2hScore * 10) / 10
    };
  }

  // ==================== TRAVEL & FATIGUE ====================

  /**
   * Estimate travel fatigue based on recent game schedule
   * TODO: Calculate actual distance when city coordinates added
   */
  async calculateTravelFatigue(teamId, currentGameDate = null) {
    const recentGames = await this.getTeamRecentGames(teamId, 5);

    if (recentGames.length === 0) {
      return {
        days_rest: 7,
        games_in_last_week: 0,
        back_to_back: false,
        fatigue_score: 0, // 0 = well rested
        estimated_miles: 0,
        time_zones_crossed: 0
      };
    }

    // Calculate days since last game
    const lastGame = recentGames[0];
    const lastGameTime = new Date(lastGame.date).getTime();
    const currentTime = currentGameDate
      ? new Date(currentGameDate).getTime()
      : Date.now();

    const daysSinceLastGame = Math.floor((currentTime - lastGameTime) / (1000 * 60 * 60 * 24));

    // Count games in last 7 days
    const oneWeekAgo = currentTime - (7 * 24 * 60 * 60 * 1000);
    const gamesLastWeek = recentGames.filter(g =>
      new Date(g.date).getTime() > oneWeekAgo
    ).length;

    // Check for back-to-back games
    const backToBack = daysSinceLastGame <= 1;

    // Fatigue score: 0-10 (0 = fresh, 10 = exhausted)
    let fatigueScore = 0;
    if (daysSinceLastGame === 0) fatigueScore = 10; // Same day
    else if (daysSinceLastGame === 1) fatigueScore = 7; // Back-to-back
    else if (daysSinceLastGame === 2) fatigueScore = 4; // 1 day rest
    else if (daysSinceLastGame === 3) fatigueScore = 2; // 2 days rest
    else fatigueScore = 0; // 3+ days rest

    // Add penalty for many recent games
    fatigueScore += Math.min(3, gamesLastWeek - 2);

    return {
      days_rest: daysSinceLastGame,
      games_in_last_week: gamesLastWeek,
      back_to_back: backToBack,
      fatigue_score: Math.min(10, Math.max(0, fatigueScore)),
      estimated_miles: 0, // TODO: Calculate actual distance
      time_zones_crossed: 0 // TODO: Calculate from cities
    };
  }

  // ==================== INJURIES (PLACEHOLDER) ====================

  /**
   * Get injury information for a team
   * Currently returns placeholder until injury tracker is running
   */
  async getTeamInjuries(teamId) {
    // Check if injuries table has data
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM injuries
      WHERE team_id = ? AND status != 'healthy'
    `).bind(teamId).first();

    if (result && result.count > 0) {
      // Return real injury data
      const injuries = await this.db.prepare(`
        SELECT * FROM injuries
        WHERE team_id = ? AND status != 'healthy'
      `).bind(teamId).all();

      return {
        total_injuries: injuries.results.length,
        key_players_out: injuries.results.filter(i => i.player_importance === 'key').length,
        impact_score: this.calculateInjuryImpact(injuries.results),
        details: injuries.results
      };
    }

    // Return placeholder (no injuries)
    return {
      total_injuries: 0,
      key_players_out: 0,
      impact_score: 0, // 0-10, 0 = no impact
      details: []
    };
  }

  calculateInjuryImpact(injuries) {
    if (injuries.length === 0) return 0;

    let impact = 0;
    injuries.forEach(injury => {
      if (injury.severity === 'severe') impact += 3;
      else if (injury.severity === 'moderate') impact += 2;
      else if (injury.severity === 'minor') impact += 1;
    });

    return Math.min(10, impact);
  }

  // ==================== UTILITY METHODS ====================

  parseJSON(jsonString) {
    if (!jsonString) return {};
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return {};
    }
  }

  daysBetween(date1, date2) {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get home advantage factor for a venue
   * Returns 0-10 score (5 = neutral, 10 = strong home advantage)
   */
  getHomeAdvantage(sport) {
    // Sport-specific home advantages (based on historical data)
    const advantages = {
      'nba': 5.5,
      'nfl': 6.0,
      'mlb': 5.0,
      'nhl': 5.5
    };

    const sportKey = sport ? sport.split('-')[0] : 'nba';
    return advantages[sportKey] || 5.0;
  }
}

export default DatabaseAdapter;
