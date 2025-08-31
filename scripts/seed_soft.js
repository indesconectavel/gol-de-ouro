/**
 * scripts/seed_soft.js
 * - Insere alguns players/matches/guesses SE as tabelas existirem.
 * - Idempotente: ignora erros e só tenta preencher se estiver vazio.
 * - Rode com: `node scripts/seed_soft.js`
 */
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const exists = async (name) => {
    const { rows } = await pool.query("select to_regclass($1) is not null as ok", [name]);
    return !!rows?.[0]?.ok;
  };

  const count = async (sql) => {
    try {
      const { rows } = await pool.query(sql);
      return Number(rows?.[0] && Object.values(rows[0])[0]) || 0;
    } catch { return 0; }
  };

  try {
    const hasPlayers = await exists("public.players");
    const hasMatches = await exists("public.matches");
    const hasGuesses = await exists("public.guesses");

    if (hasPlayers) {
      const c = await count("select count(*) from players");
      if (c === 0) {
        await pool.query(`
          insert into players (name) values
          ('Ana Souza'),('Bruno Lima'),('Carla Nunes'),('Diego Ramos'),
          ('Eduarda Alves'),('Felipe Costa'),('Gustavo Silva'),('Helena Rocha')
        `);
        console.log("players: seeded");
      }
    }

    if (hasMatches) {
      const c = await count("select count(*) from matches");
      if (c === 0) {
        await pool.query(`
          insert into matches (home, away, kickoff, status, home_score, away_score) values
          ('Caravelas SC','Boreal FC',  now() - interval '2 days','finished',2,1),
          ('Cerrado AC','Oceano Azul',  now() - interval '1 days','finished',0,0),
          ('Raízes FC','Laguna FC',     now() + interval '1 days','scheduled',null,null),
          ('Boreal FC','Oceano Azul',   now() + interval '2 days','scheduled',null,null)
        `);
        console.log("matches: seeded");
      }
    }

    if (hasGuesses && hasPlayers && hasMatches) {
      const c = await count("select count(*) from guesses");
      if (c === 0) {
        // Pega alguns ids
        const p1 = await pool.query("select id from players order by id asc limit 1");
        const p2 = await pool.query("select id from players order by id asc offset 1 limit 1");
        const m1 = await pool.query("select id from matches order by kickoff asc limit 1");
        const m2 = await pool.query("select id from matches order by kickoff asc offset 1 limit 1");

        const player1 = p1.rows?.[0]?.id, player2 = p2.rows?.[0]?.id;
        const match1  = m1.rows?.[0]?.id, match2  = m2.rows?.[0]?.id;

        if (player1 && player2 && match1 && match2) {
          await pool.query(`
            insert into guesses (player_id, match_id, pick, stake) values
            ($1,$3,'HOME',10),
            ($2,$3,'AWAY',7),
            ($1,$4,'DRAW',5),
            ($2,$4,'HOME',3)
          `, [player1, player2, match1, match2]);
          console.log("guesses: seeded");
        }
      }
    }

    console.log("seed_soft: done");
  } catch (e) {
    console.error("seed_soft error:", e.message);
  } finally {
    try { await pool.end(); } catch {}
  }
})();
