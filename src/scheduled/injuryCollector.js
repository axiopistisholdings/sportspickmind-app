/**
 * Injury Collector Scheduled Worker
 * Runs every 12 hours to update injury data
 */

import { InjuryTracker } from '../dataCollectors/injuryTracker.js';

export async function runInjuryCollection(env) {
  const startTime = Date.now();
  console.log(`[Injury Collector] Starting at ${new Date().toISOString()}`);

  try {
    const tracker = new InjuryTracker(env.DB);
    const results = {
      nfl: { collected: 0, updated: 0, errors: 0 },
      nba: { collected: 0, updated: 0, errors: 0 },
      mlb: { collected: 0, updated: 0, errors: 0 },
      nhl: { collected: 0, updated: 0, errors: 0 }
    };

    // Collect injuries for each sport
    const sports = ['NFL', 'NBA', 'MLB', 'NHL'];

    for (const sport of sports) {
      try {
        console.log(`[Injury Collector] Fetching ${sport} injuries...`);

        const injuries = await tracker.fetchESPNInjuries(sport);
        results[sport.toLowerCase()].collected = injuries.length;

        // Store injuries in database
        for (const injury of injuries) {
          try {
            // Check if injury already exists
            const existing = await env.DB.prepare(`
              SELECT id FROM injuries
              WHERE player_id = ? AND injury_date >= datetime('now', '-30 days')
              LIMIT 1
            `).bind(injury.player_id).first();

            if (existing) {
              // Update existing injury
              await env.DB.prepare(`
                UPDATE injuries
                SET status = ?, severity = ?, expected_return = ?,
                    description = ?, updated_at = datetime('now')
                WHERE id = ?
              `).bind(
                injury.status,
                injury.severity,
                injury.expected_return,
                injury.description,
                existing.id
              ).run();

              results[sport.toLowerCase()].updated++;
            } else {
              // Insert new injury
              await env.DB.prepare(`
                INSERT INTO injuries (
                  player_id, team_id, injury_type, severity, status,
                  injury_date, expected_return, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(
                injury.player_id,
                injury.team_id,
                injury.injury_type,
                injury.severity,
                injury.status,
                injury.injury_date,
                injury.expected_return,
                injury.description
              ).run();

              results[sport.toLowerCase()].updated++;
            }
          } catch (error) {
            console.error(`[Injury Collector] Error storing ${sport} injury:`, error);
            results[sport.toLowerCase()].errors++;
          }
        }

        console.log(`[Injury Collector] ${sport}: ${results[sport.toLowerCase()].collected} collected, ${results[sport.toLowerCase()].updated} updated`);
      } catch (error) {
        console.error(`[Injury Collector] Error collecting ${sport} injuries:`, error);
        results[sport.toLowerCase()].errors++;
      }
    }

    // Store collection run metadata
    const totalCollected = Object.values(results).reduce((sum, r) => sum + r.collected, 0);
    const totalUpdated = Object.values(results).reduce((sum, r) => sum + r.updated, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    await env.DB.prepare(`
      INSERT INTO system_logs (
        log_type, message, metadata, created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `).bind(
      'injury_collection',
      `Collected ${totalCollected} injuries, updated ${totalUpdated}, errors: ${totalErrors}`,
      JSON.stringify(results)
    ).run();

    const duration = Date.now() - startTime;
    console.log(`[Injury Collector] Completed in ${duration}ms`);
    console.log(`[Injury Collector] Results:`, JSON.stringify(results, null, 2));

    return {
      success: true,
      duration_ms: duration,
      results: results,
      total_collected: totalCollected,
      total_updated: totalUpdated,
      total_errors: totalErrors
    };

  } catch (error) {
    console.error('[Injury Collector] Fatal error:', error);

    // Log error
    try {
      await env.DB.prepare(`
        INSERT INTO system_logs (
          log_type, message, metadata, created_at
        ) VALUES (?, ?, ?, datetime('now'))
      `).bind(
        'injury_collection_error',
        error.message,
        JSON.stringify({ error: error.stack })
      ).run();
    } catch (logError) {
      console.error('[Injury Collector] Could not log error:', logError);
    }

    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    };
  }
}

export default runInjuryCollection;
