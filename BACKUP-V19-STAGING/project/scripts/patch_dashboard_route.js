const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'server.js');
let src = fs.readFileSync(file, 'utf8');

if (src.includes("/api/public/dashboard")) {
  console.log("Rota /api/public/dashboard já existe. Nada a fazer.");
  process.exit(0);
}

const route = 
\n// === [AUTO] Dashboard público (sumário para cards) ===
app.get('/api/public/dashboard', async (req, res) => {
  try {
    const { rows: r1 } = await pool.query('select count(*)::int as c from players');
    const { rows: r2 } = await pool.query("select count(*)::int as c from matches where status = 'scheduled' and kickoff <= now() + interval '7 days'");
    const { rows: r3 } = await pool.query("select count(*)::int as c from matches where status = 'finished' and kickoff >= now() - interval '7 days'");
    const { rows: r4 } = await pool.query('select count(*)::int as c from guesses');
    const { rows: r5 } = await pool.query("select coalesce(sum(stake),0)::numeric(12,2) as v from guesses where created_at::date = current_date");

    const { rows: topPlayers } = await pool.query("select name, position, rating, country from players order by rating desc, name asc limit 5");
    const { rows: lastMatches } = await pool.query("select home_team, away_team, home_score, away_score, kickoff from matches where status = 'finished' order by kickoff desc limit 5");

    return res.json({
      totals: {
        players: r1[0]?.c ?? 0,
        upcomingWeek: r2[0]?.c ?? 0,
        finishedWeek: r3[0]?.c ?? 0,
        guesses: r4[0]?.c ?? 0,
        todayVolume: r5[0]?.v ?? 0
      },
      topPlayers,
      lastMatches
    });
  } catch (err) {
    console.error('dashboard public error:', err);
    return res.status(500).json({ error: 'dashboard_error' });
  }
});
// === [/AUTO] fim dashboard público ===
;

const i = src.lastIndexOf('app.listen(');
if (i >= 0) {
  src = src.slice(0, i) + route + src.slice(i);
} else {
  src += route;
}

fs.writeFileSync(file, src);
console.log('Rota /api/public/dashboard injetada com sucesso.');
