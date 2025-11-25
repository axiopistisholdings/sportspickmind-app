/**
 * AI News Generator
 * Generates sports news articles about upcoming games and AI insights
 */

import DatabaseAdapter from '../adapters/dataAdapter.js';

export class AINewsGenerator {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.adapter = new DatabaseAdapter(env.DB, env.CACHE);
    this.groqApiKey = env.GROQ_API_KEY;
  }

  /**
   * Generate multiple news articles for upcoming games
   */
  async generateDailyNews() {
    const results = {
      generated: 0,
      errors: 0,
      articles: []
    };

    try {
      // Get upcoming games (next 3 days)
      const upcomingGames = await this.getUpcomingGames(20);

      console.log(`[News Generator] Found ${upcomingGames.length} upcoming games`);

      // Generate game previews for top games
      const topGames = upcomingGames.slice(0, 5);

      for (const game of topGames) {
        try {
          const article = await this.generateGamePreview(game);
          if (article) {
            await this.saveArticle(article);
            results.generated++;
            results.articles.push(article.headline);
          }
        } catch (error) {
          console.error(`[News Generator] Error generating preview for game ${game.id}:`, error);
          results.errors++;
        }
      }

      // Generate prediction insights article
      try {
        const insightsArticle = await this.generatePredictionInsights();
        if (insightsArticle) {
          await this.saveArticle(insightsArticle);
          results.generated++;
          results.articles.push(insightsArticle.headline);
        }
      } catch (error) {
        console.error('[News Generator] Error generating insights:', error);
        results.errors++;
      }

      // Generate injury report if there are new injuries
      try {
        const injuryArticle = await this.generateInjuryReport();
        if (injuryArticle) {
          await this.saveArticle(injuryArticle);
          results.generated++;
          results.articles.push(injuryArticle.headline);
        }
      } catch (error) {
        console.error('[News Generator] Error generating injury report:', error);
        results.errors++;
      }

      return results;
    } catch (error) {
      console.error('[News Generator] Fatal error:', error);
      return { ...results, error: error.message };
    }
  }

  /**
   * Get upcoming games from database
   */
  async getUpcomingGames(limit = 20) {
    const now = Math.floor(Date.now() / 1000);
    const threeDaysFromNow = now + (3 * 24 * 60 * 60);

    const result = await this.db.prepare(`
      SELECT g.*,
             ht.name as home_team_name,
             at.name as away_team_name
      FROM games g
      LEFT JOIN teams ht ON g.home_team_id = ht.id
      LEFT JOIN teams at ON g.away_team_id = at.id
      WHERE g.status = 'scheduled'
        AND g.game_date >= ?
        AND g.game_date <= ?
      ORDER BY g.game_date ASC
      LIMIT ?
    `).bind(now, threeDaysFromNow, limit).all();

    return result.results.map(g => this.adapter.transformGame(g));
  }

  /**
   * Generate a game preview article
   */
  async generateGamePreview(game) {
    try {
      // Get prediction for this game
      const prediction = await this.getPredictionForGame(game.id);

      // Get team form data
      const [homeForm, awayForm] = await Promise.all([
        this.adapter.calculateTeamForm(game.home_team, 5),
        this.adapter.calculateTeamForm(game.away_team, 5)
      ]);

      // Get H2H history
      const h2h = await this.adapter.getHeadToHeadHistory(game.home_team, game.away_team, 5);

      // Prepare context for AI
      const context = {
        game: game,
        prediction: prediction,
        homeForm: homeForm,
        awayForm: awayForm,
        h2h: h2h
      };

      // Generate article using AI
      const article = await this.callGroqAPI('game_preview', context);

      return {
        article_type: 'game_preview',
        headline: article.headline,
        subheadline: article.subheadline,
        content: article.content,
        summary: article.summary,
        sport: game.sport,
        game_id: game.id,
        team_ids: `${game.home_team},${game.away_team}`,
        slug: this.generateSlug(article.headline),
        keywords: article.keywords,
        read_time_minutes: Math.ceil(article.content.split(' ').length / 200),
        ai_model: 'groq-llama3',
        confidence_score: prediction?.confidence_score || 75,
        sources_used: JSON.stringify(['predictions', 'team_form', 'h2h_history']),
        status: 'published',
        published_at: new Date().toISOString(),
        expires_at: game.date // Expire after game starts
      };
    } catch (error) {
      console.error('[News Generator] Error in generateGamePreview:', error);
      return null;
    }
  }

  /**
   * Generate prediction insights article
   */
  async generatePredictionInsights() {
    try {
      // Get recent predictions with outcomes
      const recentPredictions = await this.db.prepare(`
        SELECT * FROM ai_predictions_enhanced
        WHERE validated_at IS NOT NULL
          AND created_at >= datetime('now', '-7 days')
        ORDER BY confidence_score DESC
        LIMIT 10
      `).all();

      if (recentPredictions.results.length < 3) {
        return null; // Not enough data
      }

      // Calculate accuracy stats
      const total = recentPredictions.results.length;
      const correct = recentPredictions.results.filter(p => p.was_correct === 1).length;
      const accuracy = (correct / total * 100).toFixed(1);

      const context = {
        predictions: recentPredictions.results,
        accuracy: accuracy,
        total: total,
        correct: correct
      };

      const article = await this.callGroqAPI('prediction_insights', context);

      return {
        article_type: 'prediction_insight',
        headline: article.headline,
        subheadline: article.subheadline,
        content: article.content,
        summary: article.summary,
        slug: this.generateSlug(article.headline),
        keywords: article.keywords,
        read_time_minutes: Math.ceil(article.content.split(' ').length / 200),
        ai_model: 'groq-llama3',
        confidence_score: 85,
        sources_used: JSON.stringify(['prediction_accuracy', 'ai_predictions']),
        status: 'published',
        published_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('[News Generator] Error in generatePredictionInsights:', error);
      return null;
    }
  }

  /**
   * Generate injury report article
   */
  async generateInjuryReport() {
    try {
      // Get recent injuries
      const injuries = await this.db.prepare(`
        SELECT i.*,
               p.name as player_name,
               p.position,
               t.name as team_name,
               t.sport_id as sport
        FROM injuries i
        JOIN players p ON i.player_id = p.id
        JOIN teams t ON i.team_id = t.id
        WHERE i.status != 'healthy'
          AND i.created_at >= datetime('now', '-3 days')
        ORDER BY i.severity DESC, i.created_at DESC
        LIMIT 20
      `).all();

      if (injuries.results.length === 0) {
        return null; // No new injuries
      }

      const context = {
        injuries: injuries.results,
        count: injuries.results.length
      };

      const article = await this.callGroqAPI('injury_report', context);

      return {
        article_type: 'injury_report',
        headline: article.headline,
        subheadline: article.subheadline,
        content: article.content,
        summary: article.summary,
        slug: this.generateSlug(article.headline),
        keywords: article.keywords,
        read_time_minutes: Math.ceil(article.content.split(' ').length / 200),
        ai_model: 'groq-llama3',
        confidence_score: 90,
        sources_used: JSON.stringify(['injuries', 'players', 'teams']),
        status: 'published',
        published_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('[News Generator] Error in generateInjuryReport:', error);
      return null;
    }
  }

  /**
   * Call Groq API to generate article content
   */
  async callGroqAPI(articleType, context) {
    const prompts = {
      game_preview: this.buildGamePreviewPrompt(context),
      prediction_insights: this.buildPredictionInsightsPrompt(context),
      injury_report: this.buildInjuryReportPrompt(context)
    };

    const systemPrompt = `You are a professional sports journalist specializing in AI-powered analysis. Write engaging, informative articles that combine data insights with compelling storytelling. Always maintain objectivity and cite specific statistics. Format your response as JSON with keys: headline, subheadline, content, summary, keywords.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompts[articleType] }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      const articleData = JSON.parse(data.choices[0].message.content);

      return articleData;
    } catch (error) {
      console.error('[News Generator] Groq API error:', error);
      // Return a fallback article
      return this.generateFallbackArticle(articleType, context);
    }
  }

  /**
   * Build game preview prompt
   */
  buildGamePreviewPrompt(context) {
    const { game, prediction, homeForm, awayForm, h2h } = context;

    return `Write a compelling game preview article for an upcoming ${game.sport} matchup:

MATCHUP: ${game.away_team_name || game.away_team} @ ${game.home_team_name || game.home_team}
DATE: ${game.date}
VENUE: ${game.venue}

AI PREDICTION:
- Predicted Winner: ${prediction?.predicted_winner_name || 'Unknown'}
- Confidence: ${prediction?.confidence_score || 'N/A'}%
- Predicted Score: ${prediction?.predicted_away_score || '?'} - ${prediction?.predicted_home_score || '?'}

HOME TEAM FORM (${game.home_team_name || game.home_team}):
- Record: ${homeForm.wins}-${homeForm.losses} (Last ${homeForm.games_played} games)
- Win %: ${(homeForm.win_percentage * 100).toFixed(1)}%
- Avg Points Scored: ${homeForm.avg_points_scored}
- Avg Points Allowed: ${homeForm.avg_points_allowed}
- Momentum: ${homeForm.momentum}

AWAY TEAM FORM (${game.away_team_name || game.away_team}):
- Record: ${awayForm.wins}-${awayForm.losses} (Last ${awayForm.games_played} games)
- Win %: ${(awayForm.win_percentage * 100).toFixed(1)}%
- Avg Points Scored: ${awayForm.avg_points_scored}
- Avg Points Allowed: ${awayForm.avg_points_allowed}
- Momentum: ${awayForm.momentum}

HEAD-TO-HEAD:
- Total Meetings: ${h2h.total_games}
- Home Team Wins: ${h2h.team1_wins}
- Away Team Wins: ${h2h.team2_wins}

Write a 300-400 word article that:
1. Opens with an engaging hook about the matchup
2. Analyzes each team's current form and momentum
3. Highlights key matchup factors
4. Explains the AI prediction and confidence level
5. Mentions head-to-head history
6. Concludes with what to watch for

Return JSON with: headline (catchy, 8-12 words), subheadline (one sentence), content (full article in paragraphs), summary (2-3 sentences), keywords (comma-separated, 5-8 relevant terms).`;
  }

  /**
   * Build prediction insights prompt
   */
  buildPredictionInsightsPrompt(context) {
    const { predictions, accuracy, total, correct } = context;

    return `Write an insightful article analyzing our AI prediction system's recent performance:

PERFORMANCE STATS:
- Total Predictions (Last 7 Days): ${total}
- Correct Predictions: ${correct}
- Accuracy Rate: ${accuracy}%

TOP PREDICTIONS:
${predictions.slice(0, 5).map((p, i) => `
${i + 1}. Confidence: ${p.confidence_score}% | Result: ${p.was_correct ? '✓ CORRECT' : '✗ INCORRECT'}
`).join('')}

Write a 250-350 word article that:
1. Opens with the week's accuracy rate
2. Highlights what factors predicted most accurately
3. Analyzes any surprising upsets or misses
4. Explains what the AI learned
5. Teases improvements for next week

Return JSON with: headline, subheadline, content, summary, keywords.`;
  }

  /**
   * Build injury report prompt
   */
  buildInjuryReportPrompt(context) {
    const { injuries, count } = context;

    return `Write a breaking injury report article covering recent injuries:

INJURY COUNT: ${count} players

KEY INJURIES:
${injuries.slice(0, 10).map((inj, i) => `
${i + 1}. ${inj.player_name} (${inj.team_name}) - ${inj.position}
   Status: ${inj.status} | Severity: ${inj.severity}
   Injury: ${inj.injury_type || 'Undisclosed'}
`).join('')}

Write a 200-300 word article that:
1. Opens with the most significant injury
2. Summarizes impact on affected teams
3. Lists other notable injuries by sport
4. Mentions expected return timelines
5. Concludes with betting/fantasy implications

Return JSON with: headline, subheadline, content, summary, keywords.`;
  }

  /**
   * Generate fallback article if API fails
   */
  generateFallbackArticle(type, context) {
    // Simple template-based article generation
    if (type === 'game_preview') {
      const { game, prediction } = context;
      return {
        headline: `${game.away_team_name || game.away_team} vs ${game.home_team_name || game.home_team}: AI Preview`,
        subheadline: `Our AI predicts ${prediction?.predicted_winner_name || 'a close matchup'} with ${prediction?.confidence_score || 'moderate'} confidence`,
        content: `The ${game.away_team_name || game.away_team} face the ${game.home_team_name || game.home_team} in an upcoming ${game.sport} matchup. Our AI analysis gives the edge to ${prediction?.predicted_winner_name || 'the home team'}. Check back for detailed analysis.`,
        summary: `AI preview of ${game.away_team_name || game.away_team} at ${game.home_team_name || game.home_team}.`,
        keywords: `${game.sport}, prediction, AI analysis, ${game.away_team}, ${game.home_team}`
      };
    }
    // Add other fallbacks as needed
    return null;
  }

  /**
   * Get prediction for a game
   */
  async getPredictionForGame(gameId) {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM ai_predictions_enhanced
        WHERE game_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(gameId).first();

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save article to database
   */
  async saveArticle(article) {
    try {
      const result = await this.db.prepare(`
        INSERT INTO ai_news_articles (
          article_type, headline, subheadline, content, summary,
          sport, game_id, team_ids, slug, keywords,
          read_time_minutes, ai_model, confidence_score,
          sources_used, status, published_at, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        article.article_type,
        article.headline,
        article.subheadline,
        article.content,
        article.summary,
        article.sport || null,
        article.game_id || null,
        article.team_ids || null,
        article.slug,
        article.keywords,
        article.read_time_minutes,
        article.ai_model,
        article.confidence_score,
        article.sources_used,
        article.status,
        article.published_at,
        article.expires_at || null
      ).run();

      console.log(`[News Generator] Saved article: ${article.headline}`);
      return result;
    } catch (error) {
      console.error('[News Generator] Error saving article:', error);
      throw error;
    }
  }

  /**
   * Generate URL-friendly slug
   */
  generateSlug(headline) {
    return headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) + '-' + Date.now();
  }
}

/**
 * Main function to run news generation
 */
export async function runNewsGeneration(env) {
  const startTime = Date.now();
  console.log(`[News Generation] Starting at ${new Date().toISOString()}`);

  try {
    const generator = new AINewsGenerator(env);
    const results = await generator.generateDailyNews();

    // Log to system_logs
    await env.DB.prepare(`
      INSERT INTO system_logs (
        log_type, message, metadata, created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `).bind(
      'news_generation',
      `Generated ${results.generated} articles, ${results.errors} errors`,
      JSON.stringify(results)
    ).run();

    const duration = Date.now() - startTime;
    console.log(`[News Generation] Completed in ${duration}ms`);
    console.log(`[News Generation] Generated: ${results.generated}, Errors: ${results.errors}`);

    return {
      success: true,
      duration_ms: duration,
      ...results
    };
  } catch (error) {
    console.error('[News Generation] Fatal error:', error);

    // Log error
    try {
      await env.DB.prepare(`
        INSERT INTO system_logs (
          log_type, message, metadata, created_at
        ) VALUES (?, ?, ?, datetime('now'))
      `).bind(
        'news_generation_error',
        error.message,
        JSON.stringify({ error: error.stack })
      ).run();
    } catch (logError) {
      console.error('[News Generation] Could not log error:', logError);
    }

    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    };
  }
}

export default runNewsGeneration;
