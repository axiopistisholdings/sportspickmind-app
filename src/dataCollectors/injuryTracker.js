/**
 * Injury Tracking System
 * Monitors player injuries, recovery, and impact on performance
 */

export class InjuryTracker {
  constructor(db) {
    this.db = db;
  }

  /**
   * Fetch current injuries from ESPN
   */
  async fetchESPNInjuries(sport) {
    let apiUrl;

    switch (sport.toLowerCase()) {
      case 'nba':
        apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries';
        break;
      case 'nfl':
        apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries';
        break;
      case 'mlb':
        apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/injuries';
        break;
      default:
        return [];
    }

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      const injuries = [];

      if (data.injuries) {
        for (const teamInjuries of data.injuries) {
          const teamId = teamInjuries.team?.id;

          for (const injury of teamInjuries.athletes || []) {
            injuries.push({
              player_id: injury.athlete?.id,
              player_name: injury.athlete?.displayName,
              team_id: teamId,
              injury_type: injury.type || 'unknown',
              injury_severity: this.classifyInjurySeverity(injury.status),
              body_part: injury.details?.location || injury.type,
              status: injury.status,
              description: injury.details?.detail || injury.longComment,
              injury_date: injury.date,
              expected_return_date: injury.details?.returnDate,
              is_active: injury.status !== 'Healthy',
              source: 'ESPN'
            });
          }
        }
      }

      return injuries;
    } catch (error) {
      console.error('Error fetching ESPN injuries:', error);
      return [];
    }
  }

  /**
   * Classify injury severity
   */
  classifyInjurySeverity(status) {
    const statusLower = (status || '').toLowerCase();

    if (statusLower.includes('out') || statusLower.includes('ir')) return 'severe';
    if (statusLower.includes('doubtful')) return 'moderate';
    if (statusLower.includes('questionable')) return 'minor';
    if (statusLower.includes('day-to-day')) return 'minor';
    if (statusLower.includes('probable')) return 'minor';

    return 'unknown';
  }

  /**
   * Calculate injury impact score
   */
  calculateInjuryImpact(injuries, teamId, playerImportance = {}) {
    if (!injuries || injuries.length === 0) return 0;

    let totalImpact = 0;

    for (const injury of injuries) {
      if (injury.team_id !== teamId) continue;
      if (!injury.is_active) continue;

      // Base severity score
      let severityScore = 0;
      switch (injury.injury_severity) {
        case 'severe': severityScore = 10; break;
        case 'moderate': severityScore = 7; break;
        case 'minor': severityScore = 4; break;
        default: severityScore = 5;
      }

      // Adjust by player importance (if we have it)
      const importance = playerImportance[injury.player_id] || 5; // 1-10 scale
      const adjustedImpact = (severityScore * importance) / 10;

      totalImpact += adjustedImpact;
    }

    // Normalize to 0-10 scale
    return Math.min(10, totalImpact);
  }

  /**
   * Analyze injury patterns for reinjury risk
   */
  analyzeInjuryHistory(playerId, injuryHistory) {
    if (!injuryHistory || injuryHistory.length === 0) {
      return { reinjury_risk: 0.1, pattern: 'healthy' };
    }

    // Check for recurring injuries
    const injuryTypes = {};
    for (const injury of injuryHistory) {
      const type = injury.injury_type || injury.body_part;
      injuryTypes[type] = (injuryTypes[type] || 0) + 1;
    }

    // Find most common injury
    let maxCount = 0;
    let mostCommon = null;
    for (const [type, count] of Object.entries(injuryTypes)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }

    // Calculate reinjury risk
    let reinjuryRisk = 0.1; // Base 10% risk
    if (maxCount >= 3) reinjuryRisk = 0.6; // 60% for chronic issues
    else if (maxCount === 2) reinjuryRisk = 0.35; // 35% for recurring
    else reinjuryRisk = 0.15; // 15% for single occurrence

    // Check recent injury rate
    const recentYear = injuryHistory.filter(i => {
      const injuryDate = new Date(i.injury_date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return injuryDate >= oneYearAgo;
    });

    if (recentYear.length >= 3) reinjuryRisk += 0.2; // Injury prone recently

    return {
      reinjury_risk: Math.min(1.0, reinjuryRisk),
      pattern: maxCount >= 3 ? 'chronic' : maxCount >= 2 ? 'recurring' : 'occasional',
      most_common_injury: mostCommon,
      total_injuries: injuryHistory.length,
      recent_year_injuries: recentYear.length
    };
  }

  /**
   * Predict recovery timeline
   */
  predictRecoveryTime(injury) {
    // Base recovery times in days by injury type and severity
    const recoveryMatrix = {
      ankle: { minor: 7, moderate: 21, severe: 60 },
      knee: { minor: 14, moderate: 42, severe: 180 },
      shoulder: { minor: 10, moderate: 30, severe: 120 },
      hamstring: { minor: 14, moderate: 28, severe: 90 },
      back: { minor: 7, moderate: 21, severe: 60 },
      concussion: { minor: 7, moderate: 14, severe: 30 },
      wrist: { minor: 14, moderate: 42, severe: 90 },
      foot: { minor: 14, moderate: 35, severe: 120 }
    };

    const injuryType = (injury.body_part || injury.injury_type || '').toLowerCase();
    const severity = injury.injury_severity || 'moderate';

    // Find matching injury type
    let recoveryDays = 21; // default
    for (const [type, recoveryTimes] of Object.entries(recoveryMatrix)) {
      if (injuryType.includes(type)) {
        recoveryDays = recoveryTimes[severity] || recoveryTimes.moderate;
        break;
      }
    }

    // Adjust based on player age (if available)
    // Older players typically take 20-30% longer to recover
    // This would need player age data

    return {
      estimated_recovery_days: recoveryDays,
      estimated_return_date: new Date(Date.now() + recoveryDays * 24 * 60 * 60 * 1000),
      confidence: 0.7 // 70% confidence in estimate
    };
  }

  /**
   * Analyze team injury depth
   */
  async analyzeTeamInjuryDepth(teamId, injuries, roster) {
    const analysis = {
      team_id: teamId,
      total_injuries: 0,
      by_position: {},
      critical_positions_affected: [],
      depth_score: 10, // 0-10 scale, 10 = full depth
      overall_health_rating: 10
    };

    for (const injury of injuries) {
      if (injury.team_id !== teamId || !injury.is_active) continue;

      analysis.total_injuries++;

      // Track by position
      const position = injury.player_position || 'unknown';
      analysis.by_position[position] = (analysis.by_position[position] || 0) + 1;

      // Reduce depth score
      const impactMultiplier = {
        severe: 2,
        moderate: 1.5,
        minor: 0.5
      };
      analysis.depth_score -= (impactMultiplier[injury.injury_severity] || 1);
    }

    // Normalize scores
    analysis.depth_score = Math.max(0, analysis.depth_score);
    analysis.overall_health_rating = Math.max(0, 10 - (analysis.total_injuries * 0.5));

    // Identify critical positions
    for (const [position, count] of Object.entries(analysis.by_position)) {
      if (count >= 2) {
        analysis.critical_positions_affected.push(position);
      }
    }

    return analysis;
  }

  /**
   * Get injury report for game prediction
   */
  async getGameInjuryReport(homeTeamId, awayTeamId) {
    const homeInjuries = await this.fetchActiveInjuries(homeTeamId);
    const awayInjuries = await this.fetchActiveInjuries(awayTeamId);

    return {
      home_team: {
        team_id: homeTeamId,
        injury_count: homeInjuries.length,
        impact_score: this.calculateInjuryImpact(homeInjuries, homeTeamId),
        key_players_out: homeInjuries.filter(i => i.injury_severity === 'severe'),
        questionable_players: homeInjuries.filter(i => i.status === 'Questionable')
      },
      away_team: {
        team_id: awayTeamId,
        injury_count: awayInjuries.length,
        impact_score: this.calculateInjuryImpact(awayInjuries, awayTeamId),
        key_players_out: awayInjuries.filter(i => i.injury_severity === 'severe'),
        questionable_players: awayInjuries.filter(i => i.status === 'Questionable')
      },
      advantage: null // Will be calculated: 'home', 'away', or 'neutral'
    };
  }

  /**
   * Fetch active injuries for a team
   */
  async fetchActiveInjuries(teamId) {
    // TODO: Query from D1 database
    // For now return mock structure
    return [];
  }
}

export default InjuryTracker;
