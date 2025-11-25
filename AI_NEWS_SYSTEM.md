# 📰 AI Sports News System
## Your Complete Sports Information Platform

---

## 🎉 Overview

Your SportsPickMind platform now includes an **AI-powered sports news system** that generates engaging articles about:

- 🎯 **Game Previews** - AI analysis of upcoming matchups with predictions
- 🧠 **Prediction Insights** - Deep dives into AI accuracy and learning
- ⚕️ **Injury Reports** - Latest injury updates and team impact
- ⚔️ **Matchup Analysis** - Head-to-head breakdowns
- 📊 **Weekly Recaps** - Performance reviews and accuracy stats
- 📈 **Team Form** - Momentum and trend analysis
- ⭐ **Player Spotlights** - Key player analysis

**All content is automatically generated twice daily using AI!**

---

## 🗄️ Database Structure

### Tables Created

**ai_news_articles** - Main articles table
- headline, subheadline, content, summary
- Sport, game, team, and player associations
- SEO metadata (slug, keywords, read time)
- AI metadata (model, confidence, sources)
- Publishing status and engagement metrics

**news_categories** - 7 pre-populated categories
- Game Previews, Prediction Insights, Injury Reports
- Matchup Analysis, Weekly Recaps, Team Form, Player Spotlights

**article_categories** - Many-to-many relationship

**featured_articles** - Homepage highlights

---

## 🤖 AI News Generator

### File Location
`src/scheduled/newsGenerator.js`

### What It Does

**1. Finds Upcoming Games** (Next 3 days)
- Queries database for scheduled games
- Prioritizes top 5 matchups
- Gets predictions and team data

**2. Generates Game Previews**
For each top matchup:
- Fetches AI prediction data
- Analyzes team form (last 5 games)
- Reviews head-to-head history
- Calls Groq API with comprehensive context
- Creates 300-400 word engaging article

**3. Generates Prediction Insights**
- Reviews recent predictions (last 7 days)
- Calculates accuracy stats
- Analyzes which factors predicted best
- Explains AI learning process
- Creates 250-350 word analysis

**4. Generates Injury Reports**
- Finds new injuries (last 3 days)
- Prioritizes by severity
- Assesses team impact
- Creates 200-300 word report

### AI Article Structure

Every article includes:
```json
{
  "headline": "Catchy 8-12 word title",
  "subheadline": "One sentence summary",
  "content": "Full article with multiple paragraphs",
  "summary": "2-3 sentence overview",
  "keywords": "SEO terms",
  "read_time_minutes": 3,
  "ai_model": "groq-llama3",
  "confidence_score": 85,
  "sources_used": ["predictions", "team_form", "h2h_history"]
}
```

---

## 📡 API Endpoints

### Get Latest News

```bash
GET /api/ai-news/latest
Query Params:
  - limit (default: 10)
  - offset (default: 0)
  - sport (NFL, NBA, MLB, NHL)
  - category (game-previews, prediction-insights, etc.)
```

**Example:**
```bash
curl "https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/latest?limit=5&sport=NBA"
```

**Response:**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "headline": "Lakers vs Warriors: AI Predicts Close Matchup",
      "subheadline": "Our AI gives the Lakers a slight edge with 62% confidence",
      "content": "Full article text...",
      "summary": "Preview of tonight's Lakers-Warriors showdown...",
      "sport": "NBA",
      "slug": "lakers-vs-warriors-ai-predicts-1234567890",
      "keywords": "NBA, Lakers, Warriors, prediction",
      "read_time_minutes": 3,
      "published_at": "2025-11-25T18:00:00Z",
      "views": 156
    }
  ],
  "total": 23,
  "has_more": true
}
```

### Get Article by Slug

```bash
GET /api/ai-news/article/{slug}
```

**Example:**
```bash
curl "https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/article/lakers-vs-warriors-ai-predicts-1234567890"
```

Automatically increments view count.

### Get Featured Articles

```bash
GET /api/ai-news/featured
```

Returns top 5 featured articles for homepage.

### Get Categories

```bash
GET /api/ai-news/categories
```

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "Game Previews",
      "slug": "game-previews",
      "description": "AI analysis of upcoming matchups",
      "icon": "🎯",
      "color": "#3B82F6",
      "article_count": 12
    }
  ]
}
```

### Get Articles for Specific Game

```bash
GET /api/ai-news/game/{gameId}
```

Returns all articles related to a specific game.

### Search Articles

```bash
GET /api/ai-news/search?q={query}&limit=20
```

**Example:**
```bash
curl "https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/search?q=Lakers"
```

Searches headlines, subheadlines, content, and keywords.

---

## ⏰ Automated Schedule

### News Generation Runs

**Frequency:** Twice daily at 06:00 and 18:00 UTC

**Schedule:**
- **06:00 UTC** (Morning edition)
  - Game previews for evening games
  - Overnight injury updates
  - Prediction insights from previous day

- **18:00 UTC** (Evening edition)
  - Game previews for next day
  - Updated injury reports
  - Daily prediction analysis

**Timeline Example:**
```
Sunday 00:00  → Validator + Injury Tracker + Weight Tuner
Sunday 06:00  → Validator + News Generation (Morning)
Sunday 12:00  → Validator + Injury Tracker
Sunday 18:00  → Validator + News Generation (Evening)
Monday 00:00  → Validator + Injury Tracker
Monday 06:00  → Validator + News Generation (Morning)
...
```

---

## 🚀 Setup Requirements

### 1. Set Groq API Key (Required)

The news generator uses Groq's Llama 3.3 70B model for article generation.

**Get API Key:**
1. Visit https://console.groq.com
2. Create account/sign in
3. Generate API key

**Set as Cloudflare Secret:**
```bash
export CLOUDFLARE_API_TOKEN="hx_sQDQlwR5QAY_VcG8iac1eMCKa1E3tr44ZHzRg"
wrangler secret put GROQ_API_KEY
# Paste your Groq API key when prompted
```

**Verify:**
```bash
wrangler secret list
```

### 2. Manual Test

Once API key is set:

```bash
curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/run-news-generator
```

This will generate 5-7 articles based on upcoming games and recent data.

### 3. Check Results

```bash
curl "https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/latest?limit=5"
```

---

## 📝 Article Types & Examples

### 1. Game Preview

**Trigger:** Upcoming game in next 3 days

**Content Includes:**
- Engaging hook about the matchup
- Each team's current form and momentum
- Key matchup factors (injuries, fatigue, H2H)
- AI prediction with confidence explanation
- Head-to-head historical context
- What to watch for

**Example Headline:**
"Lakers Seek Revenge in Bay Area Showdown: AI Gives Edge to Warriors"

### 2. Prediction Insights

**Trigger:** 3+ validated predictions in last 7 days

**Content Includes:**
- Week's accuracy rate
- Top performing prediction factors
- Analysis of upsets or misses
- What the AI learned
- Improvements for next week

**Example Headline:**
"AI Accuracy Hits 72% This Week: Injury Factor Proves Most Reliable"

### 3. Injury Report

**Trigger:** New injuries in last 3 days

**Content Includes:**
- Most significant injury first
- Impact on affected teams
- Other notable injuries by sport
- Expected return timelines
- Betting/fantasy implications

**Example Headline:**
"Breaking: Star QB Ruled Out, Line Shifts 6 Points"

---

## 🎨 Frontend Integration

### Display Latest News on Homepage

```javascript
async function loadNews() {
  const response = await fetch(
    'https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/latest?limit=6'
  );
  const data = await response.json();

  data.articles.forEach(article => {
    displayArticleCard({
      headline: article.headline,
      summary: article.summary,
      readTime: article.read_time_minutes,
      sport: article.sport,
      slug: article.slug
    });
  });
}
```

### Article Card Component

```jsx
function ArticleCard({ article }) {
  return (
    <div className="article-card">
      <span className="sport-badge">{article.sport}</span>
      <h3>{article.headline}</h3>
      <p>{article.summary}</p>
      <div className="meta">
        <span>{article.read_time_minutes} min read</span>
        <span>{article.views} views</span>
      </div>
      <a href={`/news/${article.slug}`}>Read More →</a>
    </div>
  );
}
```

### Category Filter

```javascript
async function loadCategories() {
  const response = await fetch(
    'https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/categories'
  );
  const data = await response.json();

  data.categories.forEach(category => {
    displayCategoryChip({
      name: category.name,
      icon: category.icon,
      color: category.color,
      slug: category.slug,
      count: category.article_count
    });
  });
}
```

### Search Implementation

```javascript
async function searchNews(query) {
  const response = await fetch(
    `https://sportspickmind.flemmingjt3.workers.dev/api/ai-news/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();

  displaySearchResults(data.articles, data.query);
}
```

---

## 📊 Analytics & Engagement

### Track Article Performance

```sql
-- Most viewed articles
SELECT headline, views, sport, published_at
FROM ai_news_articles
WHERE status = 'published'
ORDER BY views DESC
LIMIT 10;

-- Articles by sport
SELECT sport, COUNT(*) as article_count, AVG(views) as avg_views
FROM ai_news_articles
WHERE status = 'published'
GROUP BY sport;

-- Recent high-engagement articles
SELECT headline, views, likes, shares
FROM ai_news_articles
WHERE published_at >= datetime('now', '-7 days')
ORDER BY (views + likes*10 + shares*20) DESC
LIMIT 5;
```

### Content Performance by Category

```sql
SELECT
  nc.name as category,
  COUNT(DISTINCT a.id) as article_count,
  AVG(a.views) as avg_views,
  AVG(a.read_time_minutes) as avg_read_time
FROM news_categories nc
JOIN article_categories ac ON nc.id = ac.category_id
JOIN ai_news_articles a ON ac.article_id = a.id
WHERE a.status = 'published'
GROUP BY nc.name
ORDER BY avg_views DESC;
```

---

## 🔧 Manual Control

### Generate News On-Demand

```bash
curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/run-news-generator
```

**Response:**
```json
{
  "success": true,
  "duration_ms": 8456,
  "generated": 6,
  "errors": 0,
  "articles": [
    "Lakers vs Warriors: AI Predicts Close Showdown",
    "AI Accuracy Hits 71% This Week: What We Learned",
    "Breaking Injury Report: 5 Key Players Out Tonight",
    "Celtics Momentum Analysis: 8-2 in Last 10",
    "49ers vs Cowboys: Revenge Game Preview",
    "NBA Scoring Leaders: Where Predictions Excel"
  ]
}
```

### View Generation Logs

```bash
curl 'https://sportspickmind.flemmingjt3.workers.dev/api/admin/system-logs?type=news_generation&limit=5'
```

---

## 💡 Content Strategy

### Morning Edition (06:00 UTC / 1am EST)

**Focus:**
- Previews for evening games (NBA/NHL)
- Overnight injury updates
- Analysis of previous day's predictions

**Typical Articles:**
- 3-4 game previews (evening matchups)
- 1 prediction insights article
- 1 injury report (if new injuries)

### Evening Edition (18:00 UTC / 1pm EST)

**Focus:**
- Previews for next day's games
- Updated injury reports for tomorrow
- Weekly recaps (if Sunday)

**Typical Articles:**
- 3-4 game previews (next day matchups)
- 1 injury report update
- 1 team form analysis or player spotlight

### Weekly Special (Sundays)

**Additional Content:**
- Week in review article
- AI accuracy report
- Top predictions breakdown
- Upcoming week preview

---

## 🎯 Best Practices

### 1. Keep Content Fresh

- Articles auto-expire when games start
- Generate twice daily for relevance
- Feature latest articles on homepage

### 2. Promote Engagement

- Display view counts to show popularity
- Add social sharing buttons
- Enable comments/discussions
- Show related articles

### 3. SEO Optimization

- Articles include SEO-friendly slugs
- Keywords automatically generated
- Meta descriptions (summary field)
- Structured data for rich snippets

### 4. Mobile Optimization

- Short summaries for card views
- Read time estimates
- Easy navigation between articles
- Fast loading (Edge delivery)

### 5. Content Mix

Aim for balanced distribution:
- 50% Game Previews (timely, relevant)
- 20% Prediction Insights (unique value)
- 15% Injury Reports (breaking news)
- 15% Analysis/Spotlights (evergreen)

---

## 📈 Expected Impact

### Week 1
- 12-14 articles generated
- Basic content mix
- ~500-1000 views

### Month 1
- 80-100 articles published
- Refined content quality
- ~5,000-10,000 views
- SEO indexing begins

### Month 3+
- 250+ articles in catalog
- High-quality AI content
- ~20,000-50,000 views
- Strong SEO presence
- User engagement growing

---

## 🚀 Complete Platform Now

### What Users Get

1. **AI Predictions** - Professional-grade game predictions
2. **Prediction Tracking** - Automatic accuracy validation
3. **Self-Learning System** - Continuous improvement
4. **AI-Generated News** - Fresh content twice daily
5. **Multiple Categories** - Previews, insights, injuries, analysis
6. **Search & Discovery** - Find relevant articles easily
7. **Mobile-Optimized** - Fast, responsive experience

### Your Competitive Advantage

**Most sports platforms:**
- Manual content creation
- Outdated articles
- No AI predictions
- Limited analysis

**Your platform:**
- ✅ Automated AI content
- ✅ Always fresh (twice daily)
- ✅ Advanced predictions
- ✅ Comprehensive analysis
- ✅ Self-improving system

---

## 📞 Quick Reference

### API Endpoints

```
GET  /api/ai-news/latest          → Latest articles
GET  /api/ai-news/article/{slug}  → Specific article
GET  /api/ai-news/featured        → Featured articles
GET  /api/ai-news/categories      → All categories
GET  /api/ai-news/game/{gameId}   → Game-specific articles
GET  /api/ai-news/search?q=       → Search articles
POST /api/admin/run-news-generator → Manual generation
```

### Schedule

- **06:00 UTC**: Morning news + Validation
- **12:00 UTC**: Injury tracker + Validation
- **18:00 UTC**: Evening news + Validation
- **00:00 UTC**: Injury tracker + Validation (+ Sunday: Weight tuner)

### Setup Checklist

- [x] Database tables created
- [x] News generator built
- [x] API endpoints deployed
- [x] Automated schedule configured
- [ ] **Set GROQ_API_KEY secret** ← DO THIS!
- [ ] Test manual generation
- [ ] Integrate into frontend
- [ ] Monitor engagement metrics

---

## 🎉 Summary

### What You Built

A complete AI-powered sports news platform that:
- Generates 6-10 articles daily automatically
- Covers 7 different content categories
- Uses advanced AI (Llama 3.3 70B)
- Integrates with your prediction system
- Provides multiple API endpoints
- Tracks engagement metrics
- Runs on Cloudflare Edge (fast, global)

### Next Steps

1. **Set Groq API Key:**
   ```bash
   wrangler secret put GROQ_API_KEY
   ```

2. **Test Generation:**
   ```bash
   curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/run-news-generator
   ```

3. **Integrate Frontend:**
   - Add news section to homepage
   - Create article detail pages
   - Add category filters
   - Implement search

4. **Monitor & Improve:**
   - Track article views
   - Analyze popular categories
   - Refine AI prompts
   - Add more article types

---

**🎯 You now have a complete sports information platform with AI predictions AND AI-generated news!**

*Automated news generation powered by Groq Llama 3.3 70B*
*Running on Cloudflare Workers Edge Network*
*Generated: 2025-11-25*
