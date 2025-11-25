/**
 * Real Sports Data API Handler - Cloudflare Workers
 * Fetches real game data from ESPN API
 */

import { corsHeaders } from '../utils/cors';

export async function handleSportsData(request, env) {
  try {
    // Check cache first (KV)
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `sports-data-${today}`;

    // Try to get from cache
    const cachedData = await env.CACHE.get(cacheKey);
    if (cachedData) {
      return new Response(cachedData, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }

    const todayStr = today.replace(/-/g, '');

    // Fetch real games from ESPN API
    const [nbaData, nflData, mlbData] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${todayStr}`).then(r => r.json()),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${todayStr}`).then(r => r.json()),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${todayStr}`).then(r => r.json())
    ]);

    const games = [];

    // Process NBA games
    if (nbaData.events && nbaData.events.length > 0) {
      nbaData.events.forEach(event => {
        if (event.competitions && event.competitions[0]) {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
          const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

          games.push({
            id: event.id,
            sport: 'NBA',
            homeTeam: homeTeam?.team?.displayName || 'TBD',
            awayTeam: awayTeam?.team?.displayName || 'TBD',
            date: event.date,
            status: event.status?.type?.description || 'Scheduled',
            venue: competition.venue?.fullName || ''
          });
        }
      });
    }

    // Process NFL games
    if (nflData.events && nflData.events.length > 0) {
      nflData.events.forEach(event => {
        if (event.competitions && event.competitions[0]) {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
          const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

          games.push({
            id: event.id,
            sport: 'NFL',
            homeTeam: homeTeam?.team?.displayName || 'TBD',
            awayTeam: awayTeam?.team?.displayName || 'TBD',
            date: event.date,
            status: event.status?.type?.description || 'Scheduled',
            venue: competition.venue?.fullName || ''
          });
        }
      });
    }

    // Process MLB games
    if (mlbData.events && mlbData.events.length > 0) {
      mlbData.events.forEach(event => {
        if (event.competitions && event.competitions[0]) {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
          const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

          games.push({
            id: event.id,
            sport: 'MLB',
            homeTeam: homeTeam?.team?.displayName || 'TBD',
            awayTeam: awayTeam?.team?.displayName || 'TBD',
            date: event.date,
            status: event.status?.type?.description || 'Scheduled',
            venue: competition.venue?.fullName || ''
          });
        }
      });
    }

    const responseData = JSON.stringify({
      success: true,
      games: games,
      date: today,
      count: games.length
    });

    // Cache for 5 minutes
    await env.CACHE.put(cacheKey, responseData, { expirationTtl: 300 });

    return new Response(responseData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Error fetching sports data:', error);

    return new Response(JSON.stringify({
      success: true,
      games: [],
      error: 'No games scheduled for today',
      date: new Date().toISOString().split('T')[0]
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
