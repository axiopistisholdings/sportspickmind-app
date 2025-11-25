/**
 * AI News API
 * Endpoints for retrieving AI-generated sports news
 */

import { corsHeaders } from '../utils/cors.js';

/**
 * Get latest news articles
 */
export async function getLatestNews(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const sport = url.searchParams.get('sport');
  const category = url.searchParams.get('category');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    let query = `
      SELECT a.*
      FROM ai_news_articles a
      WHERE a.status = 'published'
        AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
    `;
    const params = [];

    if (sport) {
      query += ' AND a.sport = ?';
      params.push(sport);
    }

    if (category) {
      query += ` AND a.id IN (
        SELECT article_id FROM article_categories ac
        JOIN news_categories nc ON ac.category_id = nc.id
        WHERE nc.slug = ?
      )`;
      params.push(category);
    }

    query += ' ORDER BY a.published_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM ai_news_articles WHERE status = \'published\'';
    const countParams = [];

    if (sport) {
      countQuery += ' AND sport = ?';
      countParams.push(sport);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return new Response(JSON.stringify({
      success: true,
      articles: result.results,
      total: countResult.total,
      limit: limit,
      offset: offset,
      has_more: (offset + limit) < countResult.total
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[News API] Error fetching articles:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch news articles'
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
 * Get article by slug
 */
export async function getArticleBySlug(slug, env) {
  try {
    const article = await env.DB.prepare(`
      SELECT * FROM ai_news_articles
      WHERE slug = ? AND status = 'published'
      LIMIT 1
    `).bind(slug).first();

    if (!article) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Article not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Increment view count
    await env.DB.prepare(`
      UPDATE ai_news_articles
      SET views = views + 1
      WHERE id = ?
    `).bind(article.id).run();

    return new Response(JSON.stringify({
      success: true,
      article: article
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[News API] Error fetching article:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch article'
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
 * Get featured articles
 */
export async function getFeaturedArticles(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT a.*
      FROM ai_news_articles a
      JOIN featured_articles f ON a.id = f.article_id
      WHERE a.status = 'published'
        AND (f.featured_until IS NULL OR f.featured_until > datetime('now'))
      ORDER BY f.position ASC, a.published_at DESC
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({
      success: true,
      articles: result.results
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[News API] Error fetching featured:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch featured articles'
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
 * Get news categories
 */
export async function getCategories(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT c.*,
             COUNT(ac.article_id) as article_count
      FROM news_categories c
      LEFT JOIN article_categories ac ON c.id = ac.category_id
      LEFT JOIN ai_news_articles a ON ac.article_id = a.id AND a.status = 'published'
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      categories: result.results
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[News API] Error fetching categories:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch categories'
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
 * Get articles related to a specific game
 */
export async function getGameArticles(gameId, env) {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM ai_news_articles
      WHERE game_id = ? AND status = 'published'
      ORDER BY published_at DESC
    `).bind(gameId).all();

    return new Response(JSON.stringify({
      success: true,
      articles: result.results
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[News API] Error fetching game articles:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch game articles'
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
 * Search articles
 */
export async function searchArticles(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  if (!query || query.length < 3) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Search query must be at least 3 characters'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const searchTerm = `%${query}%`;
    const result = await env.DB.prepare(`
      SELECT * FROM ai_news_articles
      WHERE status = 'published'
        AND (
          headline LIKE ? OR
          subheadline LIKE ? OR
          content LIKE ? OR
          keywords LIKE ?
        )
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(searchTerm, searchTerm, searchTerm, searchTerm, limit).all();

    return new Response(JSON.stringify({
      success: true,
      query: query,
      articles: result.results,
      count: result.results.length
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[News API] Error searching articles:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Search failed'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

export default {
  getLatestNews,
  getArticleBySlug,
  getFeaturedArticles,
  getCategories,
  getGameArticles,
  searchArticles
};
