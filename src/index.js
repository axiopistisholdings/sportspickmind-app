/**
 * Cloudflare Workers Main Entry Point
 * SportsPickMind API - Replaces Netlify Functions
 */

import { handleSportsData } from './api/realSportsData.js';
import { handlePredictions } from './api/groqPredictions.js';
import { handleNews } from './api/sportsNews.js';
import { handleAdvancedPredictions, getPredictionById, getPredictionAccuracy } from './api/advancedPredictions.js';
import { corsHeaders, handleCors } from './utils/cors.js';
import { runInjuryCollection } from './scheduled/injuryCollector.js';
import { runPredictionValidation } from './scheduled/predictionValidator.js';
import { runWeightTuning } from './scheduled/weightTuner.js';
import { runNewsGeneration } from './scheduled/newsGenerator.js';
import {
  getLatestNews,
  getArticleBySlug,
  getFeaturedArticles,
  getCategories,
  getGameArticles,
  searchArticles
} from './api/news.js';

export default {
  /**
   * Handle scheduled cron triggers
   * Runs every 6 hours and decides what tasks to execute
   */
  async scheduled(event, env, ctx) {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay(); // 0 = Sunday

    console.log(`[Scheduled Worker] Triggered at hour ${hour} (UTC), day ${day}`);

    const results = {
      timestamp: now.toISOString(),
      hour: hour,
      day: day,
      tasks_run: []
    };

    try {
      // Always run prediction validator (every 6 hours)
      console.log('[Scheduled Worker] Running Prediction Validator');
      const validatorResult = await runPredictionValidation(env);
      results.tasks_run.push({
        task: 'prediction_validator',
        result: validatorResult
      });

      // Run injury tracker every 12 hours (at hours 0 and 12)
      if (hour % 12 === 0) {
        console.log('[Scheduled Worker] Running Injury Collector');
        const injuryResult = await runInjuryCollection(env);
        results.tasks_run.push({
          task: 'injury_collector',
          result: injuryResult
        });
      }

      // Run weight tuner on Sundays at midnight UTC
      if (day === 0 && hour === 0) {
        console.log('[Scheduled Worker] Running Weight Tuner');
        const tunerResult = await runWeightTuning(env);
        results.tasks_run.push({
          task: 'weight_tuner',
          result: tunerResult
        });
      }

      // Run news generation daily at 06:00 and 18:00 UTC
      if (hour === 6 || hour === 18) {
        console.log('[Scheduled Worker] Running News Generator');
        const newsResult = await runNewsGeneration(env);
        results.tasks_run.push({
          task: 'news_generator',
          result: newsResult
        });
      }

      console.log('[Scheduled Worker] All tasks completed:', JSON.stringify(results));
      return results;
    } catch (error) {
      console.error('[Scheduled Worker] Error:', error);
      results.error = error.message;
      return results;
    }
  },

  /**
   * Handle HTTP requests
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    try {
      // Route handling
      if (path === '/api/real-sports-data' || path === '/.netlify/functions/realSportsData') {
        return await handleSportsData(request, env);
      }

      if (path === '/api/predictions' || path === '/.netlify/functions/groqPredictions') {
        return await handlePredictions(request, env);
      }

      if (path === '/api/news' || path === '/.netlify/functions/sportsNews') {
        return await handleNews(request, env);
      }

      // Advanced Predictions API
      if (path === '/api/advanced-predictions' || path === '/api/v2/predictions') {
        return await handleAdvancedPredictions(request, env);
      }

      // Get prediction by ID
      if (path.startsWith('/api/predictions/')) {
        const gameId = path.split('/').pop();
        return await getPredictionById(gameId, env);
      }

      // Prediction accuracy stats
      if (path === '/api/prediction-accuracy') {
        return await getPredictionAccuracy(env);
      }

      // AI News endpoints
      if (path === '/api/ai-news' || path === '/api/ai-news/latest') {
        return await getLatestNews(request, env);
      }

      if (path.startsWith('/api/ai-news/article/')) {
        const slug = path.split('/').pop();
        return await getArticleBySlug(slug, env);
      }

      if (path === '/api/ai-news/featured') {
        return await getFeaturedArticles(env);
      }

      if (path === '/api/ai-news/categories') {
        return await getCategories(env);
      }

      if (path.startsWith('/api/ai-news/game/')) {
        const gameId = path.split('/').pop();
        return await getGameArticles(gameId, env);
      }

      if (path === '/api/ai-news/search') {
        return await searchArticles(request, env);
      }

      // Manual trigger endpoints for scheduled tasks (for testing)
      if (path === '/api/admin/run-injury-tracker') {
        const result = await runInjuryCollection(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      if (path === '/api/admin/run-prediction-validator') {
        const result = await runPredictionValidation(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      if (path === '/api/admin/run-weight-tuner') {
        const result = await runWeightTuning(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      if (path === '/api/admin/run-news-generator') {
        const result = await runNewsGeneration(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // View system logs
      if (path === '/api/admin/system-logs') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const type = url.searchParams.get('type');

        let query = 'SELECT * FROM system_logs';
        const params = [];

        if (type) {
          query += ' WHERE log_type = ?';
          params.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const result = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
          success: true,
          logs: result.results
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Health check endpoint
      if (path === '/api/health') {
        return new Response(JSON.stringify({
          status: 'OK',
          message: 'SportsPickMind API is running on Cloudflare Workers',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          platform: 'Cloudflare Workers'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Root endpoint
      if (path === '/' || path === '/api') {
        return new Response(JSON.stringify({
          message: 'Welcome to SportsPickMind API on Cloudflare Workers',
          version: '2.0.0',
          platform: 'Cloudflare Workers',
          endpoints: {
            health: '/api/health',
            sportsData: '/api/real-sports-data',
            predictions: '/api/predictions',
            advancedPredictions: '/api/advanced-predictions',
            predictionAccuracy: '/api/prediction-accuracy',
            news: '/api/news'
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // 404 handler
      return new Response(JSON.stringify({
        error: 'Route not found',
        message: `Cannot ${request.method} ${path}`,
        availableRoutes: ['/api/health', '/api/real-sports-data', '/api/predictions', '/api/news']
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
