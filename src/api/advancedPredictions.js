/**
 * Advanced Predictions API Handler
 * Professional AI handicapper with comprehensive factor analysis
 */

import { corsHeaders } from '../utils/cors.js';
import { AdvancedPredictionEngine } from '../engine/advancedPredictionEngine.js';
import DatabaseAdapter from '../adapters/dataAdapter.js';

export async function handleAdvancedPredictions(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST with game data.'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse request body
    let games;
    try {
      const body = await request.json();
      games = body.games || [];
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!games || games.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        predictions: [],
        message: 'No games provided'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize prediction engine
    const engine = new AdvancedPredictionEngine(env);

    // Generate predictions for all games
    const predictions = [];
    const startTime = Date.now();

    for (const game of games) {
      try {
        // Validate game data
        if (!game.homeTeam || !game.awayTeam || !game.sport) {
          predictions.push({
            error: 'Invalid game data',
            game: game
          });
          continue;
        }

        // Enrich game data with IDs if available
        const enrichedGame = await enrichGameData(game, env.DB);

        // Generate comprehensive prediction
        const prediction = await engine.generatePrediction(enrichedGame);

        // Store prediction in database for future validation
        try {
          await env.DB.prepare(`
            INSERT INTO ai_predictions_enhanced (
              game_id, sport, home_team_id, away_team_id,
              predicted_winner_team_id, predicted_winner_name,
              confidence_score, predicted_home_score, predicted_away_score,
              predicted_spread, predicted_total_score,
              player_stats_confidence, injury_impact_confidence,
              travel_fatigue_confidence, form_momentum_confidence,
              head_to_head_confidence, weather_impact_confidence,
              home_advantage_confidence, rest_differential_confidence,
              top_factor_1, top_factor_1_impact,
              top_factor_2, top_factor_2_impact,
              top_factor_3, top_factor_3_impact,
              upset_probability, variance_score,
              ai_model, model_version, algorithm, features_used,
              features, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            prediction.game_id,
            game.sport,
            enrichedGame.homeTeamId,
            enrichedGame.awayTeamId,
            prediction.predicted_winner_team_id,
            prediction.predicted_winner_name,
            prediction.confidence_score,
            prediction.predicted_home_score,
            prediction.predicted_away_score,
            prediction.predicted_spread,
            prediction.predicted_total_score,
            prediction.player_stats_confidence,
            prediction.injury_impact_confidence,
            prediction.travel_fatigue_confidence,
            prediction.form_momentum_confidence,
            prediction.head_to_head_confidence,
            prediction.weather_impact_confidence,
            prediction.home_advantage_confidence,
            prediction.rest_differential_confidence,
            prediction.top_factor_1,
            prediction.top_factor_1_impact,
            prediction.top_factor_2,
            prediction.top_factor_2_impact,
            prediction.top_factor_3,
            prediction.top_factor_3_impact,
            prediction.upset_probability,
            prediction.variance_score,
            prediction.ai_model,
            prediction.model_version,
            prediction.algorithm,
            prediction.features_used,
            JSON.stringify(prediction.features)
          ).run();
        } catch (dbError) {
          console.error('Error storing prediction:', dbError);
          // Continue even if storage fails
        }

        predictions.push({
          ...prediction,
          game_info: {
            home_team: game.homeTeam,
            away_team: game.awayTeam,
            sport: game.sport,
            date: game.date,
            venue: game.venue
          }
        });

      } catch (error) {
        console.error(`Error predicting game ${game.homeTeam} vs ${game.awayTeam}:`, error);
        predictions.push({
          error: 'Prediction failed',
          message: error.message,
          game: game
        });
      }
    }

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      predictions: predictions,
      metadata: {
        games_analyzed: games.length,
        predictions_generated: predictions.filter(p => !p.error).length,
        processing_time_ms: processingTime,
        engine: 'Advanced Prediction Engine v2.0',
        factors_analyzed: [
          'Team Form & Momentum',
          'Player Performance Stats',
          'Injury Reports',
          'Travel & Fatigue',
          'Head-to-Head History',
          'Home Court Advantage',
          'Rest Differential',
          'Weather Conditions',
          'Team News & Sentiment',
          'Betting Market Intelligence'
        ],
        generated_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime}ms`
      }
    });

  } catch (error) {
    console.error('Error in advanced predictions handler:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: env.NODE_ENV === 'development' ? error.message : 'Unable to generate predictions'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Enrich game data with team IDs and additional info from database
 */
async function enrichGameData(game, db) {
  // Try to find team IDs from database using adapter
  try {
    const adapter = new DatabaseAdapter(db);

    const [homeTeam, awayTeam] = await Promise.all([
      adapter.getTeam(game.homeTeam),
      adapter.getTeam(game.awayTeam)
    ]);

    return {
      ...game,
      homeTeamId: homeTeam?.id || null,
      awayTeamId: awayTeam?.id || null,
      homeTeamName: homeTeam?.name || game.homeTeam,
      awayTeamName: awayTeam?.name || game.awayTeam,
      id: game.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    console.error('Error enriching game data:', error);
    return {
      ...game,
      id: game.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

/**
 * Get prediction by game ID
 */
export async function getPredictionById(gameId, env) {
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM ai_predictions_enhanced WHERE game_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(gameId).first();

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prediction not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      prediction: result
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching prediction:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch prediction'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Get prediction accuracy stats
 */
export async function getPredictionAccuracy(env) {
  try {
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_predictions,
        SUM(CASE WHEN prediction_correct = 1 THEN 1 ELSE 0 END) as correct_predictions,
        AVG(confidence_level) as avg_confidence,
        AVG(margin_of_error) as avg_error
      FROM prediction_accuracy
      WHERE created_at >= datetime('now', '-30 days')
    `).first();

    const accuracy = stats.total_predictions > 0
      ? ((stats.correct_predictions / stats.total_predictions) * 100).toFixed(2)
      : 0;

    return new Response(JSON.stringify({
      success: true,
      accuracy: {
        total_predictions: stats.total_predictions || 0,
        correct_predictions: stats.correct_predictions || 0,
        accuracy_percentage: parseFloat(accuracy),
        average_confidence: Math.round((stats.avg_confidence || 0) * 10) / 10,
        average_error: Math.round((stats.avg_error || 0) * 10) / 10,
        period: 'Last 30 days'
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching accuracy stats:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch accuracy statistics'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

export default handleAdvancedPredictions;
