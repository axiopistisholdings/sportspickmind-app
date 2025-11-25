-- Enhanced SportsPickMind Database Schema
-- Professional AI Handicapper with Advanced Analytics

-- ============================================
-- CORE ENTITIES
-- ============================================

-- Enhanced Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE,
    sport_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT,
    city TEXT,
    conference TEXT,
    division TEXT,
    stadium_name TEXT,
    stadium_city TEXT,
    stadium_state TEXT,
    stadium_capacity INTEGER,
    head_coach TEXT,
    founded_year INTEGER,
    team_colors TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id)
);

-- Enhanced Players Table with Performance Metrics
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE,
    team_id INTEGER,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    jersey_number INTEGER,
    height TEXT,
    weight INTEGER,
    age INTEGER,
    birth_date DATE,
    birth_place TEXT,
    nationality TEXT,
    years_pro INTEGER,
    college TEXT,
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    salary INTEGER,
    contract_years INTEGER,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- ============================================
-- INJURY TRACKING
-- ============================================

-- Comprehensive Injury Tracking
CREATE TABLE IF NOT EXISTS injuries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    injury_type TEXT NOT NULL, -- ankle, knee, shoulder, etc.
    injury_severity TEXT NOT NULL, -- minor, moderate, severe, out
    body_part TEXT NOT NULL,
    status TEXT NOT NULL, -- questionable, doubtful, out, day-to-day, IR
    description TEXT,
    injury_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    games_missed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT, -- official, reporter, team announcement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Injury History for Pattern Analysis
CREATE TABLE IF NOT EXISTS injury_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    injury_id INTEGER NOT NULL,
    games_missed INTEGER,
    performance_impact_score REAL, -- 0-10 scale
    recovery_days INTEGER,
    reinjury_risk REAL, -- 0-1 probability
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (injury_id) REFERENCES injuries(id)
);

-- ============================================
-- TRAVEL & FATIGUE ANALYSIS
-- ============================================

-- Team Travel Schedule
CREATE TABLE IF NOT EXISTS team_travel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    departure_city TEXT NOT NULL,
    arrival_city TEXT NOT NULL,
    departure_date TIMESTAMP,
    arrival_date TIMESTAMP,
    distance_miles INTEGER,
    time_zones_crossed INTEGER,
    travel_duration_hours REAL,
    is_back_to_back BOOLEAN DEFAULT 0,
    days_rest INTEGER DEFAULT 0,
    fatigue_score REAL, -- 0-10 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Rest & Recovery Tracking
CREATE TABLE IF NOT EXISTS team_rest_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    days_since_last_game INTEGER,
    games_in_last_7_days INTEGER,
    games_in_last_14_days INTEGER,
    total_travel_miles_last_7_days INTEGER,
    home_stand_games INTEGER DEFAULT 0,
    road_trip_games INTEGER DEFAULT 0,
    is_jet_lagged BOOLEAN DEFAULT 0,
    overall_fatigue_score REAL, -- 0-10 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- ============================================
-- PERFORMANCE METRICS
-- ============================================

-- Advanced Player Performance Stats
CREATE TABLE IF NOT EXISTS player_performance_advanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    game_id INTEGER,
    season TEXT NOT NULL,

    -- Basketball Metrics
    player_efficiency_rating REAL,
    true_shooting_percentage REAL,
    usage_rate REAL,
    offensive_rating REAL,
    defensive_rating REAL,
    plus_minus REAL,

    -- Football Metrics
    qbr REAL, -- Quarterback rating
    yards_per_attempt REAL,
    completion_percentage REAL,
    passer_rating REAL,
    rush_yards_per_carry REAL,

    -- Baseball Metrics
    batting_average REAL,
    on_base_percentage REAL,
    slugging_percentage REAL,
    ops REAL,
    era REAL,
    whip REAL,

    -- Universal Metrics
    clutch_performance_rating REAL, -- Performance in close games
    home_vs_away_differential REAL,
    vs_top_teams_rating REAL,
    consistency_score REAL, -- Standard deviation of performance

    games_played INTEGER,
    minutes_played REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Streaks and Trends
CREATE TABLE IF NOT EXISTS player_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    streak_type TEXT NOT NULL, -- hot, cold, improving, declining
    metric TEXT NOT NULL, -- points, rebounds, etc.
    current_streak INTEGER,
    streak_start_date DATE,
    average_during_streak REAL,
    vs_season_average_differential REAL,
    is_active BOOLEAN DEFAULT 1,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Team Form and Momentum
CREATE TABLE IF NOT EXISTS team_form (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    season TEXT NOT NULL,
    last_5_record TEXT, -- e.g., "4-1"
    last_10_record TEXT,
    last_20_record TEXT,
    home_record TEXT,
    away_record TEXT,
    vs_conference_record TEXT,
    vs_division_record TEXT,
    vs_winning_teams_record TEXT,
    current_win_streak INTEGER DEFAULT 0,
    current_loss_streak INTEGER DEFAULT 0,
    momentum_score REAL, -- -10 to +10 scale
    power_ranking INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- ============================================
-- MATCHUP ANALYSIS
-- ============================================

-- Head-to-Head History
CREATE TABLE IF NOT EXISTS head_to_head_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_a_id INTEGER NOT NULL,
    team_b_id INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    total_games INTEGER DEFAULT 0,
    team_a_wins INTEGER DEFAULT 0,
    team_b_wins INTEGER DEFAULT 0,
    avg_point_differential REAL,
    home_advantage_impact REAL,
    last_5_meetings TEXT, -- JSON array of results
    avg_total_score REAL,
    over_under_trend TEXT,
    rivalry_factor REAL, -- 0-10 intensity
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_a_id) REFERENCES teams(id),
    FOREIGN KEY (team_b_id) REFERENCES teams(id),
    FOREIGN KEY (sport_id) REFERENCES sports(id)
);

-- Player vs Team Performance
CREATE TABLE IF NOT EXISTS player_vs_team_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    opponent_team_id INTEGER NOT NULL,
    games_played INTEGER DEFAULT 0,
    avg_points REAL,
    avg_performance_rating REAL,
    dominance_factor REAL, -- How well player performs vs this team
    last_game_performance REAL,
    trend TEXT, -- improving, declining, stable
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (opponent_team_id) REFERENCES teams(id)
);

-- ============================================
-- CONTEXTUAL FACTORS
-- ============================================

-- Weather Conditions
CREATE TABLE IF NOT EXISTS game_weather (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    temperature REAL,
    feels_like REAL,
    humidity INTEGER,
    wind_speed REAL,
    wind_direction TEXT,
    precipitation_chance INTEGER,
    precipitation_type TEXT,
    weather_condition TEXT, -- clear, cloudy, rain, snow, etc.
    is_dome BOOLEAN DEFAULT 0,
    weather_impact_score REAL, -- 0-10 how much weather affects game
    forecast_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Venue Statistics
CREATE TABLE IF NOT EXISTS venue_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    venue_name TEXT NOT NULL,
    altitude_feet INTEGER,
    is_retractable_roof BOOLEAN DEFAULT 0,
    surface_type TEXT, -- grass, turf, hardwood, etc.
    home_field_advantage_score REAL, -- Historical advantage
    crowd_noise_level TEXT, -- quiet, moderate, loud, deafening
    avg_attendance INTEGER,
    visitor_win_percentage REAL,
    avg_home_score REAL,
    avg_visitor_score REAL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Referee/Umpire Bias Analysis
CREATE TABLE IF NOT EXISTS official_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    official_name TEXT NOT NULL,
    sport_id INTEGER NOT NULL,
    games_officiated INTEGER DEFAULT 0,
    avg_fouls_per_game REAL,
    avg_penalties_per_game REAL,
    home_team_win_percentage REAL,
    over_under_tendency TEXT, -- over, under, neutral
    technical_foul_rate REAL,
    ejection_rate REAL,
    bias_score REAL, -- -5 to +5, 0 is neutral
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sport_id) REFERENCES sports(id)
);

-- Game Officials Assignment
CREATE TABLE IF NOT EXISTS game_officials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    official_id INTEGER NOT NULL,
    position TEXT, -- referee, umpire, crew chief, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (official_id) REFERENCES official_statistics(id)
);

-- ============================================
-- NEWS & SENTIMENT ANALYSIS
-- ============================================

-- Team News & Events
CREATE TABLE IF NOT EXISTS team_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    category TEXT, -- trade, injury, coaching, roster, scandal, etc.
    sentiment TEXT, -- positive, negative, neutral
    sentiment_score REAL, -- -1 to +1
    impact_level TEXT, -- low, medium, high
    source TEXT,
    source_url TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Player News & Social Media
CREATE TABLE IF NOT EXISTS player_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    category TEXT, -- performance, personal, contract, injury, social
    sentiment TEXT,
    sentiment_score REAL,
    impact_on_performance TEXT, -- likely_positive, likely_negative, neutral
    source TEXT,
    source_url TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Public Betting Trends
CREATE TABLE IF NOT EXISTS betting_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    spread REAL,
    over_under REAL,
    moneyline_home INTEGER,
    moneyline_away INTEGER,
    public_bet_percentage_home REAL, -- % of bets on home team
    public_money_percentage_home REAL, -- % of money on home team
    sharp_money_indicator TEXT, -- sharp bettors betting against public
    line_movement TEXT, -- moving_home, moving_away, stable
    reverse_line_movement BOOLEAN DEFAULT 0,
    steam_move BOOLEAN DEFAULT 0, -- sudden line movement
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- ============================================
-- AI PREDICTION ENGINE
-- ============================================

-- Enhanced Predictions with Confidence Breakdown
CREATE TABLE IF NOT EXISTS ai_predictions_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,

    -- Overall Prediction
    predicted_winner_team_id INTEGER NOT NULL,
    confidence_score REAL NOT NULL, -- 0-100
    predicted_spread REAL,
    predicted_total_score REAL,
    predicted_home_score REAL,
    predicted_away_score REAL,

    -- Confidence Breakdown by Factor
    player_stats_confidence REAL,
    injury_impact_confidence REAL,
    travel_fatigue_confidence REAL,
    form_momentum_confidence REAL,
    head_to_head_confidence REAL,
    weather_impact_confidence REAL,
    home_advantage_confidence REAL,
    rest_differential_confidence REAL,

    -- Key Factors
    top_factor_1 TEXT,
    top_factor_1_impact REAL,
    top_factor_2 TEXT,
    top_factor_2_impact REAL,
    top_factor_3 TEXT,
    top_factor_3_impact REAL,

    -- Risk Assessment
    upset_probability REAL, -- Probability of underdog winning
    variance_score REAL, -- How predictable is this game

    -- Model Info
    ai_model TEXT NOT NULL,
    model_version TEXT,
    algorithm TEXT, -- ensemble, neural_network, gradient_boosting, etc.
    training_data_size INTEGER,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (predicted_winner_team_id) REFERENCES teams(id)
);

-- Prediction Feature Weights (for ML model)
CREATE TABLE IF NOT EXISTS prediction_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,

    -- Feature Values (normalized 0-1)
    home_team_form REAL,
    away_team_form REAL,
    home_rest_advantage REAL,
    away_rest_advantage REAL,
    home_injury_impact REAL,
    away_injury_impact REAL,
    home_travel_fatigue REAL,
    away_travel_fatigue REAL,
    head_to_head_advantage REAL,
    weather_impact REAL,
    altitude_advantage REAL,
    home_crowd_advantage REAL,
    referee_bias REAL,
    public_sentiment_home REAL,
    public_sentiment_away REAL,
    betting_line_value REAL,

    -- Star Player Availability
    home_star_player_health REAL,
    away_star_player_health REAL,

    -- Streaks
    home_win_streak_value REAL,
    away_win_streak_value REAL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Model Performance Tracking
CREATE TABLE IF NOT EXISTS prediction_accuracy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    prediction_id INTEGER NOT NULL,
    actual_winner_team_id INTEGER,
    actual_home_score INTEGER,
    actual_away_score INTEGER,
    actual_spread REAL,
    predicted_spread REAL,
    prediction_correct BOOLEAN,
    margin_of_error REAL,
    confidence_level REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (prediction_id) REFERENCES ai_predictions_enhanced(id),
    FOREIGN KEY (actual_winner_team_id) REFERENCES teams(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_injuries_player ON injuries(player_id);
CREATE INDEX IF NOT EXISTS idx_injuries_active ON injuries(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_team_game ON team_travel(team_id, game_id);
CREATE INDEX IF NOT EXISTS idx_player_perf_player ON player_performance_advanced(player_id);
CREATE INDEX IF NOT EXISTS idx_team_form_team ON team_form(team_id);
CREATE INDEX IF NOT EXISTS idx_h2h_teams ON head_to_head_history(team_a_id, team_b_id);
CREATE INDEX IF NOT EXISTS idx_weather_game ON game_weather(game_id);
CREATE INDEX IF NOT EXISTS idx_news_team ON team_news(team_id, published_at);
CREATE INDEX IF NOT EXISTS idx_predictions_game ON ai_predictions_enhanced(game_id);
CREATE INDEX IF NOT EXISTS idx_betting_game ON betting_trends(game_id);
