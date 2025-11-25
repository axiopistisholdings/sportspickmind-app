# 🚀 SportsPickMind Quick Reference

## 🎯 Main API Endpoints

### Predictions
```bash
# Advanced AI prediction
curl -X POST https://sportspickmind.flemmingjt3.workers.dev/api/advanced-predictions \
  -H "Content-Type: application/json" \
  -d '{"games":[{"homeTeam":"Lakers","awayTeam":"Warriors","sport":"NBA"}]}'

# Check prediction accuracy
curl https://sportspickmind.flemmingjt3.workers.dev/api/prediction-accuracy
```

### Admin (Manual Triggers)
```bash
# Run injury tracker now
curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/run-injury-tracker

# Validate predictions now
curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/run-prediction-validator

# Optimize weights now
curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/run-weight-tuner

# View system logs
curl https://sportspickmind.flemmingjt3.workers.dev/api/admin/system-logs?limit=10
```

## ⏰ Automated Schedule

| Task | Frequency | UTC Times |
|------|-----------|-----------|
| Prediction Validator | Every 6 hours | 00:00, 06:00, 12:00, 18:00 |
| Injury Tracker | Every 12 hours | 00:00, 12:00 |
| Weight Tuner | Weekly | Sunday 00:00 |

## 📊 Key Database Tables

- **ai_predictions_enhanced** - All predictions with validation
- **prediction_accuracy** - Accuracy metrics
- **system_logs** - Automation logs
- **injuries** - Current player injuries
- **games** - Game schedule and results
- **teams** - 188 teams across 4 sports
- **players** - 4,241 players with stats

## 🔍 Useful Queries

```sql
-- Recent prediction accuracy
SELECT COUNT(*) as total,
       SUM(was_correct) as correct,
       ROUND(AVG(was_correct) * 100, 2) as accuracy_pct
FROM ai_predictions_enhanced
WHERE validated_at >= datetime('now', '-7 days');

-- System activity logs
SELECT * FROM system_logs
ORDER BY created_at DESC
LIMIT 10;

-- Current injuries
SELECT COUNT(*) as injured_players,
       team_id,
       severity
FROM injuries
WHERE status != 'healthy'
GROUP BY team_id, severity;
```

## 📈 Expected Performance

| Timeframe | Accuracy | Predictions Validated |
|-----------|----------|----------------------|
| Week 1 | 60-65% | 10-50 |
| Month 1 | 65-68% | 50-150 |
| Month 2-3 | 68-72% | 150-500 |
| Month 4+ | 72-75%+ | 500+ |

## 🎓 Learning Cycle

1. **Predictions Made** → Stored in database
2. **Games Complete** → Validator checks results every 6 hours
3. **Accuracy Tracked** → Performance metrics calculated
4. **Patterns Identified** → Weight tuner analyzes weekly
5. **Weights Optimized** → System improves automatically

## 📚 Documentation Files

- `AUTOMATED_LEARNING_SYSTEM.md` - Complete automation guide
- `DATABASE_INTEGRATION_STRATEGY.md` - Data integration details
- `INTEGRATION_COMPLETE.md` - Real data summary
- `PROFESSIONAL_HANDICAPPER_SUMMARY.md` - System overview
- `ADVANCED_PREDICTION_SYSTEM.md` - Technical specifications

## 🔧 Troubleshooting

**No predictions validated?**
```sql
-- Check for completed games
SELECT COUNT(*) FROM games WHERE status IN ('final', 'completed');
```

**Injury tracker not collecting?**
```bash
# Check last run
curl 'https://sportspickmind.flemmingjt3.workers.dev/api/admin/system-logs?type=injury_collection&limit=1'
```

**Weight tuner says insufficient data?**
```sql
-- Need 20+ validated predictions
SELECT COUNT(*) FROM ai_predictions_enhanced WHERE validated_at IS NOT NULL;
```

## 🌐 Live URLs

- **API**: https://sportspickmind.flemmingjt3.workers.dev
- **Frontend**: https://spm-b91.pages.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com/92e19266d2ef7c694805a55fd32b68c9

---

**🏆 Your self-learning AI handicapper is live and improving automatically!**
