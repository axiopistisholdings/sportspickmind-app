/**
 * Prediction Validator Scheduled Worker
 * Runs every 6 hours to validate predictions against actual results
 */

export async function runPredictionValidation(env) {
  const startTime = Date.now();
  console.log(`[Prediction Validator] Starting at ${new Date().toISOString()}`);

  try {
    let validated = 0;
    let correct = 0;
    let incorrect = 0;

    // Find predictions that need validation
    // Look for predictions where the game has completed but prediction hasn't been validated
    const predictions = await env.DB.prepare(`
      SELECT
        p.*,
        g.home_score,
        g.away_score,
        g.status
      FROM ai_predictions_enhanced p
      JOIN games g ON p.game_id = g.id
      WHERE g.status IN ('final', 'completed')
        AND p.actual_outcome IS NULL
        AND p.created_at >= datetime('now', '-7 days')
      LIMIT 100
    `).all();

    console.log(`[Prediction Validator] Found ${predictions.results.length} predictions to validate`);

    for (const pred of predictions.results) {
      try {
        // Determine actual winner
        const actualWinner = pred.home_score > pred.away_score
          ? pred.home_team_id
          : pred.away_team_id;

        const predictedWinner = pred.predicted_winner_team_id;
        const wasCorrect = actualWinner === predictedWinner;

        // Calculate margin of error
        const actualSpread = pred.home_score - pred.away_score;
        const predictedSpread = pred.predicted_spread || 0;
        const marginOfError = Math.abs(actualSpread - predictedSpread);

        // Update prediction with actual outcome
        await env.DB.prepare(`
          UPDATE ai_predictions_enhanced
          SET
            actual_outcome = ?,
            was_correct = ?,
            margin_of_error = ?,
            validated_at = datetime('now')
          WHERE id = ?
        `).bind(
          actualWinner,
          wasCorrect ? 1 : 0,
          marginOfError,
          pred.id
        ).run();

        // Insert into prediction_accuracy table
        await env.DB.prepare(`
          INSERT INTO prediction_accuracy (
            prediction_id,
            game_id,
            predicted_winner,
            actual_winner,
            prediction_correct,
            confidence_level,
            margin_of_error,
            sport,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          pred.id,
          pred.game_id,
          predictedWinner,
          actualWinner,
          wasCorrect ? 1 : 0,
          pred.confidence_score,
          marginOfError,
          pred.sport || 'unknown'
        ).run();

        validated++;
        if (wasCorrect) correct++;
        else incorrect++;

        console.log(`[Prediction Validator] Game ${pred.game_id}: ${wasCorrect ? 'CORRECT' : 'INCORRECT'} (confidence: ${pred.confidence_score}%)`);

      } catch (error) {
        console.error(`[Prediction Validator] Error validating prediction ${pred.id}:`, error);
      }
    }

    // Calculate overall accuracy stats
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN prediction_correct = 1 THEN 1 ELSE 0 END) as correct,
        AVG(confidence_level) as avg_confidence,
        AVG(margin_of_error) as avg_error
      FROM prediction_accuracy
      WHERE created_at >= datetime('now', '-7 days')
    `).first();

    const accuracy = stats.total > 0
      ? ((stats.correct / stats.total) * 100).toFixed(2)
      : 0;

    // Store validation run metadata
    await env.DB.prepare(`
      INSERT INTO system_logs (
        log_type, message, metadata, created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `).bind(
      'prediction_validation',
      `Validated ${validated} predictions: ${correct} correct, ${incorrect} incorrect`,
      JSON.stringify({
        validated,
        correct,
        incorrect,
        seven_day_stats: {
          total: stats.total,
          correct: stats.correct,
          accuracy_pct: parseFloat(accuracy),
          avg_confidence: Math.round(stats.avg_confidence || 0),
          avg_error: Math.round(stats.avg_error || 0)
        }
      })
    ).run();

    const duration = Date.now() - startTime;
    console.log(`[Prediction Validator] Completed in ${duration}ms`);
    console.log(`[Prediction Validator] Validated: ${validated}, Correct: ${correct}, Incorrect: ${incorrect}`);
    console.log(`[Prediction Validator] 7-day accuracy: ${accuracy}%`);

    return {
      success: true,
      duration_ms: duration,
      validated,
      correct,
      incorrect,
      accuracy_pct: parseFloat(accuracy),
      seven_day_stats: stats
    };

  } catch (error) {
    console.error('[Prediction Validator] Fatal error:', error);

    // Log error
    try {
      await env.DB.prepare(`
        INSERT INTO system_logs (
          log_type, message, metadata, created_at
        ) VALUES (?, ?, ?, datetime('now'))
      `).bind(
        'prediction_validation_error',
        error.message,
        JSON.stringify({ error: error.stack })
      ).run();
    } catch (logError) {
      console.error('[Prediction Validator] Could not log error:', logError);
    }

    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    };
  }
}

export default runPredictionValidation;
