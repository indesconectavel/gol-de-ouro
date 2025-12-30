-- scripts/seed_players.sql
-- Tabela players (ajusta o nome do schema/tabela se já existir diferente)
create extension if not exists pgcrypto;

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

-- Evita repetição do seed
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
