-- Add missing columns to ai_predictions_enhanced for validation

ALTER TABLE ai_predictions_enhanced ADD COLUMN sport TEXT;
ALTER TABLE ai_predictions_enhanced ADD COLUMN home_team_id TEXT;
ALTER TABLE ai_predictions_enhanced ADD COLUMN away_team_id TEXT;
ALTER TABLE ai_predictions_enhanced ADD COLUMN predicted_winner_name TEXT;
ALTER TABLE ai_predictions_enhanced ADD COLUMN features_used INTEGER;
ALTER TABLE ai_predictions_enhanced ADD COLUMN features TEXT; -- JSON
ALTER TABLE ai_predictions_enhanced ADD COLUMN actual_outcome TEXT;
ALTER TABLE ai_predictions_enhanced ADD COLUMN was_correct INTEGER;
ALTER TABLE ai_predictions_enhanced ADD COLUMN margin_of_error REAL;
ALTER TABLE ai_predictions_enhanced ADD COLUMN validated_at TEXT;
