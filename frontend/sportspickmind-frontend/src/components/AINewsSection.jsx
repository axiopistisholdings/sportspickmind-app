import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AINewsSection = () => {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'https://sportspickmind.flemmingjt3.workers.dev';

  useEffect(() => {
    fetchCategories();
    fetchNews();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-news/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all'
        ? `${API_URL}/api/ai-news/latest?limit=6`
        : `${API_URL}/api/ai-news/latest?category=${selectedCategory}&limit=6`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setNews(data.articles);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load news articles');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (slug) => {
    const icons = {
      'game-previews': '🎯',
      'prediction-insights': '🧠',
      'injury-reports': '⚕️',
      'matchup-analysis': '⚔️',
      'weekly-recaps': '📊',
      'team-form': '📈',
      'player-spotlights': '⭐'
    };
    return icons[slug] || '📰';
  };

  return (
    <section className="py-16 bg-black border-t border-gray-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI-Generated <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Sports Insights</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Fresh analysis powered by advanced AI, updated twice daily
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-700'
            }`}
          >
            All News
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category.slug
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              <span>{getCategoryIcon(category.slug)}</span>
              {category.name}
            </motion.button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-red-400 text-lg">{error}</p>
          </motion.div>
        )}

        {/* News Grid */}
        {!loading && !error && news.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📰</div>
            <p className="text-gray-400 text-lg">
              No articles available yet. AI is generating fresh content!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Articles generate automatically at 6am and 6pm UTC
            </p>
          </motion.div>
        )}

        {!loading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer"
              >
                {/* Sport Badge */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                      {article.sport}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {article.read_time_minutes} min read
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.headline}
                  </h3>

                  {/* Subheadline */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {article.subheadline}
                  </p>

                  {/* Summary */}
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                    {article.summary}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        👁️ {article.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        🤖 AI {article.confidence_score}%
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                    >
                      Read More →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && news.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-shadow"
            >
              View All Articles
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AINewsSection;
