/**
 * Weight Tuner Scheduled Worker
 * Runs weekly to analyze prediction accuracy and optimize feature weights
 */

export async function runWeightTuning(env) {
  const startTime = Date.now();
  console.log(`[Weight Tuner] Starting at ${new Date().toISOString()}`);

  try {
    // Analyze predictions from last 30 days
    const predictions = await env.DB.prepare(`
      SELECT
        p.*,
        a.prediction_correct,
        a.margin_of_error
      FROM ai_predictions_enhanced p
      JOIN prediction_accuracy a ON p.id = a.prediction_id
      WHERE p.created_at >= datetime('now', '-30 days')
        AND p.features IS NOT NULL
    `).all();

    console.log(`[Weight Tuner] Analyzing ${predictions.results.length} predictions`);

    if (predictions.results.length < 20) {
      console.log('[Weight Tuner] Not enough data yet (minimum 20 predictions required)');
      return {
        success: true,
        message: 'Insufficient data for tuning',
        predictions_analyzed: predictions.results.length,
        minimum_required: 20
      };
    }

    // Analyze factor performance
    const factorPerformance = {
      team_form: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 },
      player_stats: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 },
      injuries: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 },
      travel_fatigue: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 },
      head_to_head: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 },
      home_advantage: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 },
      rest_differential: { correct: 0, incorrect: 0, avg_impact: 0, count: 0 }
    };

    // Analyze each prediction
    for (const pred of predictions.results) {
      const features = typeof pred.features === 'string'
        ? JSON.parse(pred.features)
        : pred.features;

      const wasCorrect = pred.prediction_correct === 1;

      // Analyze team form impact
      if (features.home_team_form !== undefined && features.away_team_form !== undefined) {
        const formDiff = Math.abs(features.home_team_form - features.away_team_form);
        factorPerformance.team_form.count++;
        factorPerformance.team_form.avg_impact += formDiff;
        if (wasCorrect) factorPerformance.team_form.correct++;
        else factorPerformance.team_form.incorrect++;
      }

      // Analyze player stats impact
      if (features.home_player_advantage !== undefined && features.away_player_advantage !== undefined) {
        const playerDiff = Math.abs(features.home_player_advantage - features.away_player_advantage);
        factorPerformance.player_stats.count++;
        factorPerformance.player_stats.avg_impact += playerDiff;
        if (wasCorrect) factorPerformance.player_stats.correct++;
        else factorPerformance.player_stats.incorrect++;
      }

      // Analyze injury impact
      if (features.home_injury_impact !== undefined && features.away_injury_impact !== undefined) {
        const injuryDiff = Math.abs(features.home_injury_impact - features.away_injury_impact);
        factorPerformance.injuries.count++;
        factorPerformance.injuries.avg_impact += injuryDiff;
        if (wasCorrect) factorPerformance.injuries.correct++;
        else factorPerformance.injuries.incorrect++;
      }

      // Analyze fatigue impact
      if (features.home_fatigue !== undefined && features.away_fatigue !== undefined) {
        const fatigueDiff = Math.abs(features.home_fatigue - features.away_fatigue);
        factorPerformance.travel_fatigue.count++;
        factorPerformance.travel_fatigue.avg_impact += fatigueDiff;
        if (wasCorrect) factorPerformance.travel_fatigue.correct++;
        else factorPerformance.travel_fatigue.incorrect++;
      }

      // Analyze H2H impact
      if (features.h2h_advantage !== undefined) {
        const h2hImpact = Math.abs(features.h2h_advantage - 5); // Distance from neutral
        factorPerformance.head_to_head.count++;
        factorPerformance.head_to_head.avg_impact += h2hImpact;
        if (wasCorrect) factorPerformance.head_to_head.correct++;
        else factorPerformance.head_to_head.incorrect++;
      }

      // Analyze home advantage
      if (features.home_court_advantage !== undefined) {
        factorPerformance.home_advantage.count++;
        factorPerformance.home_advantage.avg_impact += features.home_court_advantage;
        if (wasCorrect) factorPerformance.home_advantage.correct++;
        else factorPerformance.home_advantage.incorrect++;
      }

      // Analyze rest differential
      if (features.rest_advantage !== undefined) {
        const restImpact = Math.abs(features.rest_advantage);
        factorPerformance.rest_differential.count++;
        factorPerformance.rest_differential.avg_impact += restImpact;
        if (wasCorrect) factorPerformance.rest_differential.correct++;
        else factorPerformance.rest_differential.incorrect++;
      }
    }

    // Calculate accuracy rates for each factor
    const factorAccuracy = {};
    for (const [factor, perf] of Object.entries(factorPerformance)) {
      if (perf.count > 0) {
        perf.avg_impact = perf.avg_impact / perf.count;
        factorAccuracy[factor] = {
          accuracy: (perf.correct / perf.count * 100).toFixed(2),
          correct: perf.correct,
          incorrect: perf.incorrect,
          total: perf.count,
          avg_impact: perf.avg_impact.toFixed(2)
        };
      }
    }

    // Current weights
    const currentWeights = {
      team_form: 0.15,
      player_stats: 0.20,
      injuries: 0.18,
      travel_fatigue: 0.12,
      head_to_head: 0.10,
      home_advantage: 0.08,
      rest_differential: 0.07
    };

    // Calculate optimized weights based on accuracy
    // Higher accuracy factors get higher weights
    const totalAccuracy = Object.values(factorAccuracy).reduce((sum, f) => sum + parseFloat(f.accuracy), 0);
    const optimizedWeights = {};

    for (const [factor, stats] of Object.entries(factorAccuracy)) {
      const accuracyScore = parseFloat(stats.accuracy) / totalAccuracy;
      const currentWeight = currentWeights[factor] || 0.10;

      // Gradual adjustment: move 30% toward optimal
      const adjustment = (accuracyScore - currentWeight) * 0.3;
      optimizedWeights[factor] = Math.max(0.02, Math.min(0.30, currentWeight + adjustment));
    }

    // Normalize weights to sum to 1.0
    const weightSum = Object.values(optimizedWeights).reduce((sum, w) => sum + w, 0);
    for (const factor in optimizedWeights) {
      optimizedWeights[factor] = (optimizedWeights[factor] / weightSum).toFixed(3);
    }

    // Store tuning results
    await env.DB.prepare(`
      INSERT INTO system_logs (
        log_type, message, metadata, created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `).bind(
      'weight_tuning',
      `Analyzed ${predictions.results.length} predictions and optimized weights`,
      JSON.stringify({
        predictions_analyzed: predictions.results.length,
        factor_accuracy: factorAccuracy,
        current_weights: currentWeights,
        optimized_weights: optimizedWeights,
        recommendations: generateRecommendations(factorAccuracy, currentWeights, optimizedWeights)
      })
    ).run();

    const duration = Date.now() - startTime;
    console.log(`[Weight Tuner] Completed in ${duration}ms`);
    console.log(`[Weight Tuner] Factor Accuracy:`, JSON.stringify(factorAccuracy, null, 2));
    console.log(`[Weight Tuner] Optimized Weights:`, JSON.stringify(optimizedWeights, null, 2));

    return {
      success: true,
      duration_ms: duration,
      predictions_analyzed: predictions.results.length,
      factor_accuracy: factorAccuracy,
      current_weights: currentWeights,
      optimized_weights: optimizedWeights,
      recommendations: generateRecommendations(factorAccuracy, currentWeights, optimizedWeights)
    };

  } catch (error) {
    console.error('[Weight Tuner] Fatal error:', error);

    // Log error
    try {
      await env.DB.prepare(`
        INSERT INTO system_logs (
          log_type, message, metadata, created_at
        ) VALUES (?, ?, ?, datetime('now'))
      `).bind(
        'weight_tuning_error',
        error.message,
        JSON.stringify({ error: error.stack })
      ).run();
    } catch (logError) {
      console.error('[Weight Tuner] Could not log error:', logError);
    }

    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    };
  }
}

/**
 * Generate human-readable recommendations
 */
function generateRecommendations(factorAccuracy, currentWeights, optimizedWeights) {
  const recommendations = [];

  for (const [factor, stats] of Object.entries(factorAccuracy)) {
    const accuracy = parseFloat(stats.accuracy);
    const currentWeight = currentWeights[factor] || 0;
    const optimizedWeight = parseFloat(optimizedWeights[factor]) || 0;
    const change = ((optimizedWeight - currentWeight) / currentWeight * 100).toFixed(1);

    if (accuracy >= 70) {
      recommendations.push({
        factor: factor,
        status: 'excellent',
        accuracy: accuracy,
        message: `${factor} performing well (${accuracy}% accuracy)`,
        weight_change: `${change > 0 ? '+' : ''}${change}%`,
        action: change > 10 ? 'Increase weight significantly' : 'Maintain or slightly increase'
      });
    } else if (accuracy >= 55) {
      recommendations.push({
        factor: factor,
        status: 'good',
        accuracy: accuracy,
        message: `${factor} performing adequately (${accuracy}% accuracy)`,
        weight_change: `${change > 0 ? '+' : ''}${change}%`,
        action: 'Maintain current weight'
      });
    } else {
      recommendations.push({
        factor: factor,
        status: 'needs_improvement',
        accuracy: accuracy,
        message: `${factor} underperforming (${accuracy}% accuracy)`,
        weight_change: `${change > 0 ? '+' : ''}${change}%`,
        action: change < -10 ? 'Decrease weight significantly' : 'Consider improving data quality'
      });
    }
  }

  return recommendations;
}

export default runWeightTuning;
