import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Target, Clock, AlertCircle } from 'lucide-react';
import AINewsSection from './AINewsSection';

const RealDataHomePage = () => {
  const [realGames, setRealGames] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ONLY real data - NO FAKE DATA
  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real games scheduled for today
      const gamesResponse = await fetch('/api/live-data.json');
      const gamesData = await gamesResponse.json();

      if (gamesData.success) {
        setRealGames(gamesData.games || []);

        if (gamesData.games && gamesData.games.length > 0) {
          // Use predictions from the same data source
          setPredictions(gamesData.predictions || []);
        } else {
          setPredictions([]);
        }
      } else {
        setRealGames([]);
        setPredictions([]);
      }
    } catch (err) {
      console.error('Error fetching real data:', err);
      setError('Failed to load real sports data');
      setRealGames([]);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatGameTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Loading real sports data...</p>
          <p className="text-sm text-gray-400 mt-2">Fetching today's scheduled games</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Hero Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="/spm-hero-image.jpg"
            alt="Sports"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-transparent to-purple-900/30"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-2xl"
            >
              AI-Powered Sports
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                Predictions
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl text-gray-200 mb-12 max-w-4xl mx-auto drop-shadow-lg font-medium"
            >
              Enterprise-grade AI analysis with real-time predictions and self-learning algorithms
            </motion.p>

            {/* Sport Badges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 mb-12"
            >
              <motion.img
                whileHover={{ scale: 1.1, y: -5 }}
                src="/spm-pro-football-badge.jpg"
                alt="Pro Football"
                className="h-24 w-auto rounded-lg shadow-2xl shadow-orange-500/50 cursor-pointer"
              />
              <motion.img
                whileHover={{ scale: 1.1, y: -5 }}
                src="/spm-pro-basketball-badge.jpg"
                alt="Pro Basketball"
                className="h-24 w-auto rounded-lg shadow-2xl shadow-green-500/50 cursor-pointer"
              />
              <motion.img
                whileHover={{ scale: 1.1, y: -5 }}
                src="/spm-pro-baseball-badge.jpg"
                alt="Pro Baseball"
                className="h-24 w-auto rounded-lg shadow-2xl shadow-red-500/50 cursor-pointer"
              />
              <motion.img
                whileHover={{ scale: 1.1, y: -5 }}
                src="/spm-pro-hockey-badge.jpg"
                alt="Pro Hockey"
                className="h-24 w-auto rounded-lg shadow-2xl shadow-blue-500/50 cursor-pointer"
              />
            </motion.div>
            
            {/* Adsterra Ad Placement */}
            <div className="mb-8">
              <iframe 
                src="https://www.revenuecpmgate.com/q5tbhj3t0s?key=3c7faabea665a7a1ecf70834d02347c9&size=728x90&format=banner"
                width="728"
                height="90"
                frameBorder="0"
                scrolling="no"
                style={{ border: 'none', display: 'block', margin: '0 auto' }}
              ></iframe>
              <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Games Section */}
      <section className="py-16 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Today's <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Live Predictions</span>
            </h2>
            <p className="text-lg text-gray-400">
              {realGames.length > 0 
                ? `${realGames.length} games scheduled for ${new Date().toLocaleDateString()}`
                : 'No games scheduled for today'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {realGames.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Games Today
              </h3>
              <p className="text-gray-400">
                Check back tomorrow for new games and predictions.
              </p>
            </div>
          )}

          {realGames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {realGames.map((game, index) => {
                const prediction = predictions.find(p => 
                  p.homeTeam === game.homeTeam && p.awayTeam === game.awayTeam
                );

                return (
                  <div
                    key={game.id || index}
                    className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-blue-500/50 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30 uppercase">
                        {game.sport} • {game.status}
                      </span>
                      {prediction && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-300">
                            {prediction.confidence}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-center mb-4">
                      <div className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {game.homeTeam} vs {game.awayTeam}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatGameTime(game.date)}
                      </div>
                      {game.venue && (
                        <div className="text-xs text-gray-500 mt-1">
                          {game.venue}
                        </div>
                      )}
                    </div>

                    {prediction ? (
                      <div className="text-center">
                        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-1">
                          {prediction.prediction}
                        </div>
                        {prediction.predictedScore && (
                          <div className="text-sm text-gray-400">
                            {prediction.predictedScore.home}-{prediction.predictedScore.away}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          🤖 {prediction.aiModel}
                        </div>
                        {prediction.reasoning && (
                          <div className="text-xs text-gray-400 mt-2 line-clamp-2">
                            {prediction.reasoning}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <div className="text-sm">Generating AI prediction...</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Adsterra Rectangle Ad */}
      <div className="py-8 text-center">
        <iframe 
          src="https://www.revenuecpmgate.com/q5tbhj3t0s?key=3c7faabea665a7a1ecf70834d02347c9&size=300x250&format=rectangle"
          width="300"
          height="250"
          frameBorder="0"
          scrolling="no"
          style={{ border: 'none', display: 'block', margin: '0 auto' }}
        ></iframe>
        <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
      </div>

      {/* AI News Section */}
      <AINewsSection />

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-black via-gray-900 to-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Enterprise-Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Intelligence</span>
            </h2>
            <p className="text-lg text-gray-400">
              Self-learning AI that improves with every prediction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-shadow">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Self-Learning AI
              </h3>
              <p className="text-gray-400">
                Advanced algorithms validate predictions against real results and optimize weights weekly for continuous improvement.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-shadow">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-Time Data
              </h3>
              <p className="text-gray-400">
                Live game data from ESPN, automated injury tracking, and 10-factor prediction analysis updated every 6 hours.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50 group-hover:shadow-cyan-500/70 transition-shadow">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI-Generated News
              </h3>
              <p className="text-gray-400">
                Fresh sports insights and analysis generated twice daily by Groq Llama 3.3 70B AI model.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Refresh Button */}
      <section className="py-12 text-center bg-black border-t border-gray-800">
        <button
          onClick={fetchRealData}
          disabled={loading}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 disabled:opacity-50 transition-all transform hover:scale-105 disabled:hover:scale-100"
        >
          <span className="relative z-10">{loading ? 'Loading...' : 'Refresh Live Data'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </section>
    </div>
  );
};

export default RealDataHomePage;
