const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    await client.query(create extension if not exists pgcrypto;);

    await client.query(
      create table if not exists public.players (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        position text not null,
        rating int not null check (rating between 40 and 99),
        team text,
        country text,
        market_value numeric(12,2),
        created_at timestamptz default now()
      );
    );

    await client.query(
      do Out-Null
      begin
        if not exists (select 1 from public.players) then
          insert into public.players (name, position, rating, team, country, market_value) values
          ('João Silva','ATA',82,'Leões FC','Brasil',15200000),
          ('Carlos Mendes','MEI',79,'Aldeia SC','Portugal',9600000),
          ('Miguel Costa','ZAG',81,'Andes United','Chile',8700000),
          ('Pedro Rocha','VOL',77,'Riviera FC','Brasil',5400000),
          ('Lucas Pereira','ATA',84,'Pampas AC','Argentina',18900000),
          ('Rafael Lima','LD',76,'Atlântico FC','Brasil',4100000),
          ('Tiago Souza','LE',78,'Sertão Esporte','Brasil',4300000),
          ('Bruno Alves','GOL',80,'Cordilheira FC','Peru',6200000),
          ('André Santos','MEI',83,'Planalto FC','Brasil',13100000),
          ('Diego Nunes','ZAG',79,'Pacífico United','Uruguai',7200000),
          ('Matheus Teixeira','PD',81,'Caravelas SC','Portugal',9900000),
          ('Felipe Araújo','PE',80,'Boreal FC','Paraguai',8800000),
          ('Gustavo Ribeiro','ATA',75,'Cerrado AC','Brasil',3500000),
          ('Eduardo Barros','MEI',74,'Oceano Azul','Brasil',2900000),
          ('Henrique Prado','VOL',77,'Raízes FC','Brasil',4100000),
          ('Ricardo Monteiro','ZAG',82,'Laguna FC','Brasil',10500000);
        end if;
      endOut-Null;
    );

    await client.query(
      create table if not exists public.matches (
        id uuid primary key default gen_random_uuid(),
        home_team text not null,
        away_team text not null,
        kickoff timestamptz not null,
        status text not null default 'scheduled', -- scheduled|live|finished
        home_score int default 0,
        away_score int default 0,
        created_at timestamptz default now()
      );
    );

    await client.query(
      create table if not exists public.guesses (
        id uuid primary key default gen_random_uuid(),
        match_id uuid not null references public.matches(id) on delete cascade,
        pick text not null,   -- 'HOME'|'DRAW'|'AWAY'
        stake numeric(12,2) not null default 5,
        created_at timestamptz default now()
      );
    );

    await client.query(
      do Out-Null
      begin
        if not exists (select 1 from public.matches) then
          insert into public.matches (home_team, away_team, kickoff, status, home_score, away_score) values
          ('Leões FC','Aldeia SC', now() + interval '6 hours','scheduled',0,0),
          ('Andes United','Riviera FC', now() + interval '1 day','scheduled',0,0),
          ('Pampas AC','Atlântico FC', now() + interval '2 days','scheduled',0,0),
          ('Sertão Esporte','Cordilheira FC', now() + interval '3 days','scheduled',0,0),
          ('Planalto FC','Pacífico United', now() + interval '4 days','scheduled',0,0),
          ('Caravelas SC','Boreal FC', now() - interval '1 day','finished',2,1),
          ('Cerrado AC','Oceano Azul', now() - interval '2 days','finished',0,0),
          ('Raízes FC','Laguna FC', now() - interval '3 days','finished',1,3);
        end if;
      endOut-Null;
    );

    await client.query(
      do Out-Null
      declare m1 uuid; m2 uuid; m3 uuid; m4 uuid;
      begin
        select id into m1 from public.matches order by kickoff limit 1;
        select id into m2 from public.matches order by kickoff offset 1 limit 1;
        select id into m3 from public.matches order by kickoff offset 2 limit 1;
        select id into m4 from public.matches order by kickoff offset 3 limit 1;

        if not exists (select 1 from public.guesses) then
          insert into public.guesses (match_id, pick, stake) values
          (m1,'HOME',10),(m1,'DRAW',5),(m1,'AWAY',7),
          (m2,'HOME',12),(m2,'HOME',8),(m2,'AWAY',9),
          (m3,'DRAW',6),(m3,'AWAY',11),(m3,'HOME',4),
          (m4,'AWAY',15),(m4,'AWAY',10),(m4,'HOME',3);
        end if;
      endOut-Null;
    );

    await client.query('COMMIT');
    console.log('Seed concluído com sucesso.');
  } catch (e) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Seed falhou:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
