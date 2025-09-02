--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-27 23:54:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16394)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4996 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 245 (class 1259 OID 16614)
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_logs (
    id integer NOT NULL,
    descricao text NOT NULL,
    data timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_logs OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16613)
-- Name: admin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_logs_id_seq OWNER TO postgres;

--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 244
-- Name: admin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_logs_id_seq OWNED BY public.admin_logs.id;


--
-- TOC entry 221 (class 1259 OID 16459)
-- Name: fila_tabuleiro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fila_tabuleiro (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    posicao integer NOT NULL,
    status character varying(20) DEFAULT 'ativo'::character varying NOT NULL,
    data_entrada timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_premiacao timestamp without time zone
);


ALTER TABLE public.fila_tabuleiro OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16458)
-- Name: fila_tabuleiro_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fila_tabuleiro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fila_tabuleiro_id_seq OWNER TO postgres;

--
-- TOC entry 4998 (class 0 OID 0)
-- Dependencies: 220
-- Name: fila_tabuleiro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fila_tabuleiro_id_seq OWNED BY public.fila_tabuleiro.id;


--
-- TOC entry 243 (class 1259 OID 16603)
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id integer NOT NULL,
    status character varying(50),
    start_time timestamp without time zone,
    end_time timestamp without time zone
);


ALTER TABLE public.games OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16602)
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.games_id_seq OWNER TO postgres;

--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 242
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- TOC entry 231 (class 1259 OID 16530)
-- Name: jogadores_partida; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jogadores_partida (
    id integer NOT NULL,
    id_partida integer NOT NULL,
    id_usuario integer NOT NULL,
    ordem integer NOT NULL,
    chute_efetuado boolean DEFAULT false,
    marcou_gol boolean DEFAULT false
);


ALTER TABLE public.jogadores_partida OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16529)
-- Name: jogadores_partida_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jogadores_partida_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jogadores_partida_id_seq OWNER TO postgres;

--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 230
-- Name: jogadores_partida_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jogadores_partida_id_seq OWNED BY public.jogadores_partida.id;


--
-- TOC entry 229 (class 1259 OID 16521)
-- Name: partidas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partidas (
    id integer NOT NULL,
    status character varying(20) DEFAULT 'em_andamento'::character varying NOT NULL,
    data_inicio timestamp without time zone DEFAULT now(),
    data_fim timestamp without time zone
);


ALTER TABLE public.partidas OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16520)
-- Name: partidas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.partidas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partidas_id_seq OWNER TO postgres;

--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 228
-- Name: partidas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.partidas_id_seq OWNED BY public.partidas.id;


--
-- TOC entry 233 (class 1259 OID 16555)
-- Name: queue_board; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_board (
    id integer NOT NULL,
    user_id integer NOT NULL,
    "position" integer NOT NULL,
    status character varying(20) DEFAULT 'waiting'::character varying NOT NULL,
    is_winner boolean DEFAULT false,
    entry_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.queue_board OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16554)
-- Name: queue_board_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queue_board_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queue_board_id_seq OWNER TO postgres;

--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 232
-- Name: queue_board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queue_board_id_seq OWNED BY public.queue_board.id;


--
-- TOC entry 227 (class 1259 OID 16501)
-- Name: saques; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saques (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    valor numeric(10,2) NOT NULL,
    chave_pix character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying,
    data_solicitacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_processamento timestamp without time zone
);


ALTER TABLE public.saques OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16500)
-- Name: saques_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saques_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saques_id_seq OWNER TO postgres;

--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 226
-- Name: saques_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saques_id_seq OWNED BY public.saques.id;


--
-- TOC entry 237 (class 1259 OID 16574)
-- Name: shot_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shot_attempts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    shot_choice character varying(50) NOT NULL,
    was_goal boolean NOT NULL,
    shot_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shot_attempts OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16573)
-- Name: shot_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shot_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shot_attempts_id_seq OWNER TO postgres;

--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 236
-- Name: shot_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shot_attempts_id_seq OWNED BY public.shot_attempts.id;


--
-- TOC entry 223 (class 1259 OID 16473)
-- Name: tentativas_chute; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tentativas_chute (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    tentativa_numero integer NOT NULL,
    escolha character varying(50) NOT NULL,
    resultado text NOT NULL,
    data_tentativa timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    direcao character varying(50),
    data timestamp without time zone DEFAULT now(),
    acertou boolean DEFAULT false,
    game_id integer,
    id_partida integer,
    data_chute timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tentativas_chute OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16472)
-- Name: tentativas_chute_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tentativas_chute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tentativas_chute_id_seq OWNER TO postgres;

--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 222
-- Name: tentativas_chute_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tentativas_chute_id_seq OWNED BY public.tentativas_chute.id;


--
-- TOC entry 225 (class 1259 OID 16486)
-- Name: transacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transacoes (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    tipo character varying(20) NOT NULL,
    valor numeric(10,2) NOT NULL,
    descricao text,
    data_transacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transacoes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16485)
-- Name: transacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transacoes_id_seq OWNER TO postgres;

--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 224
-- Name: transacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transacoes_id_seq OWNED BY public.transacoes.id;


--
-- TOC entry 235 (class 1259 OID 16566)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    type character varying(20) NOT NULL,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description character varying(255)
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16565)
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 234
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- TOC entry 241 (class 1259 OID 16592)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    bloqueado boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16591)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 219 (class 1259 OID 16388)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100),
    email character varying(150),
    senha character varying(200),
    saldo numeric DEFAULT 0.0,
    data_criacao timestamp without time zone DEFAULT now()
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16387)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 218
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 239 (class 1259 OID 16582)
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    request_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16581)
-- Name: withdrawals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.withdrawals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.withdrawals_id_seq OWNER TO postgres;

--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 238
-- Name: withdrawals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.withdrawals_id_seq OWNED BY public.withdrawals.id;


--
-- TOC entry 4781 (class 2604 OID 16617)
-- Name: admin_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_logs_id_seq'::regclass);


--
-- TOC entry 4746 (class 2604 OID 16462)
-- Name: fila_tabuleiro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_tabuleiro ALTER COLUMN id SET DEFAULT nextval('public.fila_tabuleiro_id_seq'::regclass);


--
-- TOC entry 4780 (class 2604 OID 16606)
-- Name: games id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- TOC entry 4763 (class 2604 OID 16533)
-- Name: jogadores_partida id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jogadores_partida ALTER COLUMN id SET DEFAULT nextval('public.jogadores_partida_id_seq'::regclass);


--
-- TOC entry 4760 (class 2604 OID 16524)
-- Name: partidas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidas ALTER COLUMN id SET DEFAULT nextval('public.partidas_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 16558)
-- Name: queue_board id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_board ALTER COLUMN id SET DEFAULT nextval('public.queue_board_id_seq'::regclass);


--
-- TOC entry 4757 (class 2604 OID 16504)
-- Name: saques id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saques ALTER COLUMN id SET DEFAULT nextval('public.saques_id_seq'::regclass);


--
-- TOC entry 4772 (class 2604 OID 16577)
-- Name: shot_attempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shot_attempts ALTER COLUMN id SET DEFAULT nextval('public.shot_attempts_id_seq'::regclass);


--
-- TOC entry 4749 (class 2604 OID 16476)
-- Name: tentativas_chute id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tentativas_chute ALTER COLUMN id SET DEFAULT nextval('public.tentativas_chute_id_seq'::regclass);


--
-- TOC entry 4754 (class 2604 OID 16489)
-- Name: transacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transacoes ALTER COLUMN id SET DEFAULT nextval('public.transacoes_id_seq'::regclass);


--
-- TOC entry 4770 (class 2604 OID 16569)
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 16595)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4743 (class 2604 OID 16391)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4774 (class 2604 OID 16585)
-- Name: withdrawals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals ALTER COLUMN id SET DEFAULT nextval('public.withdrawals_id_seq'::regclass);


--
-- TOC entry 4990 (class 0 OID 16614)
-- Dependencies: 245
-- Data for Name: admin_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_logs (id, descricao, data) FROM stdin;
1	Usuário 1 suspenso manualmente	2025-07-25 14:47:37.457525
2	Usuário 1 suspenso manualmente	2025-07-25 14:50:53.436954
\.


--
-- TOC entry 4966 (class 0 OID 16459)
-- Dependencies: 221
-- Data for Name: fila_tabuleiro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fila_tabuleiro (id, id_usuario, posicao, status, data_entrada, data_premiacao) FROM stdin;
3	1	1	aguardando	2025-07-23 23:10:29.914648	\N
4	1	2	aguardando	2025-07-23 23:12:07.670473	\N
11	13	4	aguardando	2025-07-24 17:22:10.708639	\N
12	14	5	aguardando	2025-07-24 17:22:16.310239	\N
13	15	6	aguardando	2025-07-24 17:22:20.497683	\N
14	16	7	aguardando	2025-07-24 17:22:24.486948	\N
15	17	8	aguardando	2025-07-24 17:22:28.492279	\N
16	18	9	aguardando	2025-07-24 17:22:32.567612	\N
17	19	10	aguardando	2025-07-24 17:22:35.867334	\N
18	20	11	aguardando	2025-07-24 17:22:54.26223	\N
10	12	3	premiado	2025-07-24 17:21:51.383327	2025-07-24 17:27:00.425814
\.


--
-- TOC entry 4988 (class 0 OID 16603)
-- Dependencies: 243
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.games (id, status, start_time, end_time) FROM stdin;
\.


--
-- TOC entry 4976 (class 0 OID 16530)
-- Dependencies: 231
-- Data for Name: jogadores_partida; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jogadores_partida (id, id_partida, id_usuario, ordem, chute_efetuado, marcou_gol) FROM stdin;
1	1	1	1	f	f
2	1	2	2	f	f
3	1	3	3	f	f
4	1	4	4	f	f
5	1	5	5	f	f
6	1	6	6	f	f
7	1	7	7	f	f
8	1	8	8	f	f
9	1	9	9	f	f
10	1	10	10	f	f
11	2	11	1	f	f
\.


--
-- TOC entry 4974 (class 0 OID 16521)
-- Dependencies: 229
-- Data for Name: partidas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partidas (id, status, data_inicio, data_fim) FROM stdin;
1	em_andamento	2025-07-24 14:59:41.018793	\N
2	em_andamento	2025-07-24 15:01:30.17125	\N
\.


--
-- TOC entry 4978 (class 0 OID 16555)
-- Dependencies: 233
-- Data for Name: queue_board; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_board (id, user_id, "position", status, is_winner, entry_date) FROM stdin;
2	2	1	finished	f	2025-07-24 19:54:29.65213
3	3	2	finished	f	2025-07-24 19:54:45.533488
4	4	3	finished	f	2025-07-24 19:54:50.335918
5	5	4	finished	f	2025-07-24 19:54:54.503473
6	6	5	finished	t	2025-07-24 19:54:57.176496
7	7	6	finished	f	2025-07-24 19:55:00.485767
8	8	7	finished	t	2025-07-24 19:55:04.203155
9	9	8	finished	f	2025-07-24 19:55:07.416849
10	10	9	finished	t	2025-07-24 19:55:12.477713
12	21	1	finished	f	2025-07-24 20:18:15.593094
13	22	2	finished	f	2025-07-24 20:18:24.756659
14	23	3	finished	f	2025-07-24 20:18:34.34453
15	24	4	finished	f	2025-07-24 20:18:38.610033
16	25	5	finished	f	2025-07-24 20:18:42.447012
17	26	6	finished	f	2025-07-24 20:18:46.940735
18	27	7	finished	f	2025-07-24 20:18:52.980997
19	28	8	finished	t	2025-07-24 20:18:57.472367
20	29	9	finished	f	2025-07-24 20:19:02.380031
21	30	10	finished	t	2025-07-24 20:19:07.946318
24	32	3	waiting	f	2025-07-25 22:19:32.490598
25	33	4	waiting	f	2025-07-25 22:19:38.465161
26	34	5	waiting	f	2025-07-25 22:19:42.745026
27	35	6	waiting	f	2025-07-25 22:19:47.277461
28	36	7	waiting	f	2025-07-25 22:19:50.781108
29	37	8	waiting	f	2025-07-25 22:19:54.780776
31	39	10	waiting	f	2025-07-25 22:20:01.449281
32	40	11	waiting	f	2025-07-25 22:20:15.807345
30	38	9	waiting	t	2025-07-25 22:19:57.944549
22	31	1	finished	f	2025-07-25 22:13:01.392987
23	31	2	finished	f	2025-07-25 22:14:07.198804
1	1	1	finished	t	2025-07-24 19:48:53.290262
11	1	10	finished	f	2025-07-24 19:55:56.084568
33	1	10	finished	f	2025-07-25 23:27:02.463721
34	1	10	waiting	f	2025-07-27 18:06:16.144896
\.


--
-- TOC entry 4972 (class 0 OID 16501)
-- Dependencies: 227
-- Data for Name: saques; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saques (id, id_usuario, valor, chave_pix, status, data_solicitacao, data_processamento) FROM stdin;
\.


--
-- TOC entry 4982 (class 0 OID 16574)
-- Dependencies: 237
-- Data for Name: shot_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shot_attempts (id, user_id, shot_choice, was_goal, shot_date) FROM stdin;
1	1	meio	t	2025-07-24 19:52:37.72525
2	1	meio	f	2025-07-24 19:57:22.261565
3	2	meio	f	2025-07-24 19:57:40.561848
4	3	meio	f	2025-07-24 19:57:52.043578
5	4	meio	f	2025-07-24 19:58:03.978549
6	5	meio	f	2025-07-24 19:58:16.815183
7	6	meio	t	2025-07-24 19:58:28.532375
8	7	meio	f	2025-07-24 19:58:40.986518
9	8	meio	t	2025-07-24 19:58:51.323364
10	9	meio	f	2025-07-24 19:59:05.455146
11	10	meio	t	2025-07-24 19:59:39.724235
12	21	meio	f	2025-07-24 20:20:39.180527
13	22	meio	f	2025-07-24 20:20:45.121619
14	23	meio	f	2025-07-24 20:20:49.268138
15	24	meio	f	2025-07-24 20:20:53.616357
16	25	meio	f	2025-07-24 20:20:57.747649
17	26	meio	f	2025-07-24 20:21:01.579508
18	27	meio	f	2025-07-24 20:21:05.968194
19	28	meio	t	2025-07-24 20:21:09.68499
20	29	meio	f	2025-07-24 20:21:14.615738
21	30	meio	t	2025-07-24 20:21:20.101999
22	31	meio	f	2025-07-25 22:22:21.136814
23	1	meio	f	2025-07-25 23:27:29.120003
\.


--
-- TOC entry 4968 (class 0 OID 16473)
-- Dependencies: 223
-- Data for Name: tentativas_chute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tentativas_chute (id, id_usuario, tentativa_numero, escolha, resultado, data_tentativa, direcao, data, acertou, game_id, id_partida, data_chute) FROM stdin;
\.


--
-- TOC entry 4970 (class 0 OID 16486)
-- Dependencies: 225
-- Data for Name: transacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transacoes (id, id_usuario, tipo, valor, descricao, data_transacao, data) FROM stdin;
\.


--
-- TOC entry 4980 (class 0 OID 16566)
-- Dependencies: 235
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, amount, type, transaction_date, description) FROM stdin;
1	1	5.00	reward	2025-07-24 19:52:37.752372	\N
2	6	5.00	reward	2025-07-24 19:58:28.535456	\N
3	8	5.00	reward	2025-07-24 19:58:51.350007	\N
4	10	5.00	reward	2025-07-24 19:59:39.727642	\N
5	28	5.00	reward	2025-07-24 20:21:09.686257	\N
6	30	5.00	reward	2025-07-24 20:21:20.10319	\N
\.


--
-- TOC entry 4986 (class 0 OID 16592)
-- Dependencies: 241
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, created_at, bloqueado) FROM stdin;
\.


--
-- TOC entry 4964 (class 0 OID 16388)
-- Dependencies: 219
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nome, email, senha, saldo, data_criacao) FROM stdin;
1	João da Silva	joao@email.com	senha123	50.00	2025-07-25 21:05:23.467502
2	Teste	teste@email.com	senha123	0.0	2025-07-25 21:05:23.467502
12	Jogador 12	\N	\N	0.0	2025-07-25 21:05:23.467502
13	Jogador 13	\N	\N	0.0	2025-07-25 21:05:23.467502
14	Jogador 14	\N	\N	0.0	2025-07-25 21:05:23.467502
15	Jogador 15	\N	\N	0.0	2025-07-25 21:05:23.467502
16	Jogador 16	\N	\N	0.0	2025-07-25 21:05:23.467502
17	Jogador 17	\N	\N	0.0	2025-07-25 21:05:23.467502
18	Jogador 18	\N	\N	0.0	2025-07-25 21:05:23.467502
19	Jogador 19	\N	\N	0.0	2025-07-25 21:05:23.467502
20	Jogador 20	\N	\N	0.0	2025-07-25 21:05:23.467502
\.


--
-- TOC entry 4984 (class 0 OID 16582)
-- Dependencies: 239
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.withdrawals (id, user_id, amount, status, request_date) FROM stdin;
\.


--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 244
-- Name: admin_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_logs_id_seq', 2, true);


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 220
-- Name: fila_tabuleiro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fila_tabuleiro_id_seq', 18, true);


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 242
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.games_id_seq', 1, false);


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 230
-- Name: jogadores_partida_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jogadores_partida_id_seq', 11, true);


--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 228
-- Name: partidas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partidas_id_seq', 2, true);


--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 232
-- Name: queue_board_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queue_board_id_seq', 34, true);


--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 226
-- Name: saques_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saques_id_seq', 1, false);


--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 236
-- Name: shot_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shot_attempts_id_seq', 23, true);


--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 222
-- Name: tentativas_chute_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tentativas_chute_id_seq', 6, true);


--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 224
-- Name: transacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transacoes_id_seq', 1, false);


--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 234
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 6, true);


--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 218
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 2, true);


--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 238
-- Name: withdrawals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.withdrawals_id_seq', 1, false);


--
-- TOC entry 4812 (class 2606 OID 16622)
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 16466)
-- Name: fila_tabuleiro fila_tabuleiro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_tabuleiro
    ADD CONSTRAINT fila_tabuleiro_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 16608)
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- TOC entry 4798 (class 2606 OID 16537)
-- Name: jogadores_partida jogadores_partida_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jogadores_partida
    ADD CONSTRAINT jogadores_partida_pkey PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 16528)
-- Name: partidas partidas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidas
    ADD CONSTRAINT partidas_pkey PRIMARY KEY (id);


--
-- TOC entry 4800 (class 2606 OID 16563)
-- Name: queue_board queue_board_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_board
    ADD CONSTRAINT queue_board_pkey PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 16508)
-- Name: saques saques_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saques
    ADD CONSTRAINT saques_pkey PRIMARY KEY (id);


--
-- TOC entry 4804 (class 2606 OID 16580)
-- Name: shot_attempts shot_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shot_attempts
    ADD CONSTRAINT shot_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 16479)
-- Name: tentativas_chute tentativas_chute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tentativas_chute
    ADD CONSTRAINT tentativas_chute_pkey PRIMARY KEY (id);


--
-- TOC entry 4792 (class 2606 OID 16494)
-- Name: transacoes transacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transacoes
    ADD CONSTRAINT transacoes_pkey PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 16572)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4808 (class 2606 OID 16600)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 16515)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4786 (class 2606 OID 16393)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 16589)
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- TOC entry 4813 (class 2606 OID 16467)
-- Name: fila_tabuleiro fila_tabuleiro_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_tabuleiro
    ADD CONSTRAINT fila_tabuleiro_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


--
-- TOC entry 4817 (class 2606 OID 16538)
-- Name: jogadores_partida jogadores_partida_id_partida_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jogadores_partida
    ADD CONSTRAINT jogadores_partida_id_partida_fkey FOREIGN KEY (id_partida) REFERENCES public.partidas(id) ON DELETE CASCADE;


--
-- TOC entry 4816 (class 2606 OID 16509)
-- Name: saques saques_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saques
    ADD CONSTRAINT saques_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


--
-- TOC entry 4814 (class 2606 OID 16480)
-- Name: tentativas_chute tentativas_chute_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tentativas_chute
    ADD CONSTRAINT tentativas_chute_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


--
-- TOC entry 4815 (class 2606 OID 16495)
-- Name: transacoes transacoes_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transacoes
    ADD CONSTRAINT transacoes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


-- Completed on 2025-07-27 23:54:31

--
-- PostgreSQL database dump complete
--

