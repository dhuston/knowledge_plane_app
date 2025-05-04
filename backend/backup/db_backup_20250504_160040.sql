--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: goaltypeenum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.goaltypeenum AS ENUM (
    'ENTERPRISE',
    'DEPARTMENT',
    'TEAM',
    'INDIVIDUAL'
);


ALTER TYPE public.goaltypeenum OWNER TO postgres;

--
-- Name: knowledgeassettypeenum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.knowledgeassettypeenum AS ENUM (
    'NOTE',
    'DOCUMENT',
    'MESSAGE',
    'MEETING'
);


ALTER TYPE public.knowledgeassettypeenum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: edges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.edges (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    src uuid NOT NULL,
    dst uuid NOT NULL,
    label character varying NOT NULL,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.edges OWNER TO postgres;

--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type public.goaltypeenum NOT NULL,
    parent_id uuid,
    status character varying(50),
    progress integer,
    due_date date,
    properties json,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: knowledge_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_assets (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(255),
    type public.knowledgeassettypeenum NOT NULL,
    source character varying(100),
    link text,
    content text,
    project_id uuid,
    created_by_user_id uuid,
    properties json,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.knowledge_assets OWNER TO postgres;

--
-- Name: nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nodes (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    type character varying NOT NULL,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    x double precision,
    y double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nodes OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(50),
    owning_team_id uuid,
    goal_id uuid,
    properties json,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid NOT NULL,
    name character varying NOT NULL,
    description text,
    tenant_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    lead_id uuid
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name character varying NOT NULL,
    domain character varying,
    sso_config json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    settings jsonb
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    title character varying,
    avatar_url character varying,
    online_status boolean,
    auth_provider character varying,
    auth_provider_id character varying,
    manager_id uuid,
    team_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    last_login_at timestamp with time zone,
    google_access_token text,
    google_refresh_token text,
    google_token_expiry timestamp with time zone,
    hashed_password text,
    password_reset_token character varying,
    password_reset_expires timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
fix_password_auth
\.


--
-- Data for Name: edges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.edges (id, tenant_id, src, dst, label, props, created_at, updated_at) FROM stdin;
4b0020ee-7f44-4170-93d5-e2e4c4ad7dab	242f2060-a185-4982-95b5-43e3b208702f	3ec7b0b9-394d-488a-b5f4-69147315f55d	0a0e526b-87cf-4bae-9ce5-7f09bfe7c585	OWNS	{}	2025-05-04 19:53:32.597934+00	2025-05-04 19:53:32.597934+00
584ecca3-2634-4cf7-81bf-13d9e394cdbf	242f2060-a185-4982-95b5-43e3b208702f	ab645e4f-8713-4782-b5a8-127b86849d1d	4bb9e787-2901-4080-8e37-6610508d448e	OWNS	{}	2025-05-04 19:53:32.60156+00	2025-05-04 19:53:32.60156+00
8e1739d2-25c9-47ae-b69c-41ebe85dde01	242f2060-a185-4982-95b5-43e3b208702f	e913a24b-1c0c-49cb-8c9e-55d78d2e7900	af932516-9b0f-4dc6-8198-c99a684824bf	OWNS	{}	2025-05-04 19:53:32.60335+00	2025-05-04 19:53:32.60335+00
39546dbf-8404-4125-88e9-448fac614b14	242f2060-a185-4982-95b5-43e3b208702f	5cb3f199-08ac-43f5-8b8a-5833fe347af3	b97fe37e-74e5-4215-a8fa-e971d790e2f4	OWNS	{}	2025-05-04 19:53:32.604861+00	2025-05-04 19:53:32.604861+00
96c12f96-780c-4cc8-8520-c5acb39c74cc	242f2060-a185-4982-95b5-43e3b208702f	5cb3f199-08ac-43f5-8b8a-5833fe347af3	1f2d750d-753b-47bc-95a3-3366d1042fdb	OWNS	{}	2025-05-04 19:53:32.606483+00	2025-05-04 19:53:32.606483+00
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goals (id, tenant_id, title, description, type, parent_id, status, progress, due_date, properties, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: knowledge_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_assets (id, tenant_id, title, type, source, link, content, project_id, created_by_user_id, properties, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nodes (id, tenant_id, type, props, x, y, created_at, updated_at) FROM stdin;
de9a1b61-501c-4e48-9a6b-5ec6105cb54f	3fa85f64-5717-4562-b3fc-2c963f66afa6	user	{"name": "Demo User", "entity_id": "5fa85f64-5717-4562-b3fc-2c963f66afa6"}	-11.478044261812869	76.56072770236486	2025-05-04 15:50:18.04263+00	2025-05-04 15:50:18.04263+00
3796ca21-8577-4619-b3e1-8fe41a672019	242f2060-a185-4982-95b5-43e3b208702f	user	{"name": "Tech Innovations Inc. Demo User", "entity_id": "dd02b542-bba6-4c74-bc7f-22b6b0b2a355"}	-95.4030918769367	-88.09953828333295	2025-05-04 15:50:18.096051+00	2025-05-04 15:50:18.096051+00
7ffa3496-1878-45b4-8c7e-e02c42ec6802	e40a2e09-4af1-436b-b4bb-4826c866b199	user	{"name": "Metropolitan Health System Demo User", "entity_id": "7c1f0d64-020c-4003-9bb5-6da91525e994"}	-46.97545205230569	-58.9840348638984	2025-05-04 15:50:18.14455+00	2025-05-04 15:50:18.14455+00
b6854c0b-a120-4c77-951b-b176997aa9bb	c089973e-d3b4-43d8-9642-4bfa5a12b348	user	{"name": "University Research Alliance Demo User", "entity_id": "7153ed5f-a156-4139-b471-9ef2b1102364"}	-40.182453122008525	37.939928561056064	2025-05-04 15:50:18.189505+00	2025-05-04 15:50:18.189505+00
0a0e526b-87cf-4bae-9ce5-7f09bfe7c585	242f2060-a185-4982-95b5-43e3b208702f	project	{"name": "NextGen Cloud Platform", "label": "NextGen Cloud Platform", "status": "in_progress", "entity_id": "e4fd50d8-d425-4060-abbe-dd26dda1ef83"}	\N	\N	2025-05-04 19:19:57.330573+00	2025-05-04 19:19:57.330573+00
4bb9e787-2901-4080-8e37-6610508d448e	242f2060-a185-4982-95b5-43e3b208702f	project	{"name": "Mobile App v3.0", "label": "Mobile App v3.0", "status": "active", "entity_id": "520faa7b-95aa-4af8-908a-5a43c23e62f2"}	\N	\N	2025-05-04 19:19:57.330573+00	2025-05-04 19:19:57.330573+00
af932516-9b0f-4dc6-8198-c99a684824bf	242f2060-a185-4982-95b5-43e3b208702f	project	{"name": "Developer Productivity Toolkit", "label": "Developer Productivity Toolkit", "status": "planning", "entity_id": "01e6bf51-b99c-4728-a2b6-f30d6322c4e6"}	\N	\N	2025-05-04 19:19:57.330573+00	2025-05-04 19:19:57.330573+00
b97fe37e-74e5-4215-a8fa-e971d790e2f4	242f2060-a185-4982-95b5-43e3b208702f	project	{"name": "Customer Data Platform Integration", "label": "Customer Data Platform Integration", "status": "active", "entity_id": "61da7459-4697-4b51-bdae-58fd0e4e5340"}	\N	\N	2025-05-04 19:19:57.330573+00	2025-05-04 19:19:57.330573+00
1f2d750d-753b-47bc-95a3-3366d1042fdb	242f2060-a185-4982-95b5-43e3b208702f	project	{"name": "AI Assistant Product Feature", "label": "AI Assistant Product Feature", "status": "in_progress", "entity_id": "b1e02c40-2207-41c7-80b8-14804f38bb70"}	\N	\N	2025-05-04 19:19:57.330573+00	2025-05-04 19:19:57.330573+00
ec2e21fd-38e4-4223-8adf-b6c7b167d948	242f2060-a185-4982-95b5-43e3b208702f	team	{"name": "Frontend", "entity_id": "d162000f-de2d-4c0f-bd2f-c252e4b1cbfe", "description": "Frontend development", "entity_type": "team"}	-37.17609792733705	-79.01902273748789	2025-05-04 19:52:43.697894+00	2025-05-04 19:52:43.697894+00
3ec7b0b9-394d-488a-b5f4-69147315f55d	242f2060-a185-4982-95b5-43e3b208702f	team	{"name": "Backend", "entity_id": "c76b536f-f0e6-4d08-a852-a128cbe34a86", "description": "Backend services and APIs", "entity_type": "team"}	98.68983646549296	-70.77531789093456	2025-05-04 19:52:43.702396+00	2025-05-04 19:52:43.702396+00
e913a24b-1c0c-49cb-8c9e-55d78d2e7900	242f2060-a185-4982-95b5-43e3b208702f	team	{"name": "DevOps", "entity_id": "b3940c76-b8c4-4634-832a-118882b9be17", "description": "Infrastructure and deployment", "entity_type": "team"}	95.72884136171993	-44.47174528527358	2025-05-04 19:52:43.70629+00	2025-05-04 19:52:43.70629+00
ab645e4f-8713-4782-b5a8-127b86849d1d	242f2060-a185-4982-95b5-43e3b208702f	team	{"name": "Mobile", "entity_id": "01fee885-ab47-44cf-8225-a1e28fc9b51a", "description": "Mobile app development", "entity_type": "team"}	35.64769646373017	94.9916041303619	2025-05-04 19:52:43.707+00	2025-05-04 19:52:43.707+00
5cb3f199-08ac-43f5-8b8a-5833fe347af3	242f2060-a185-4982-95b5-43e3b208702f	team	{"name": "Data Science", "entity_id": "a0b66cfc-6626-4fa9-b7ce-ff5e86ffc481", "description": "ML and data analytics", "entity_type": "team"}	-51.88362248015541	-70.01141812342773	2025-05-04 19:52:43.70778+00	2025-05-04 19:52:43.70778+00
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, tenant_id, name, description, status, owning_team_id, goal_id, properties, created_at, updated_at) FROM stdin;
e4fd50d8-d425-4060-abbe-dd26dda1ef83	242f2060-a185-4982-95b5-43e3b208702f	NextGen Cloud Platform	Complete redesign of our cloud computing platform with containerization, microservices, and serverless capabilities	in_progress	\N	\N	{"start_date": "2025-05-01T19:19:57.292180", "target_date": "2025-05-28T19:19:57.292180", "priority": "HIGH", "owner_id": "dd02b542-bba6-4c74-bc7f-22b6b0b2a355"}	2025-05-04 19:19:57.29218	2025-05-04 19:19:57.29218
520faa7b-95aa-4af8-908a-5a43c23e62f2	242f2060-a185-4982-95b5-43e3b208702f	Mobile App v3.0	Major update to our mobile application with AI-powered features, improved UI, and faster performance	active	\N	\N	{"start_date": "2025-05-01T19:19:57.292180", "target_date": "2025-05-28T19:19:57.292180", "priority": "HIGH", "owner_id": "dd02b542-bba6-4c74-bc7f-22b6b0b2a355"}	2025-05-04 19:19:57.29218	2025-05-04 19:19:57.29218
01e6bf51-b99c-4728-a2b6-f30d6322c4e6	242f2060-a185-4982-95b5-43e3b208702f	Developer Productivity Toolkit	Internal tooling improvements for developer workflows including automated testing, CI/CD enhancements, and code quality checks	planning	\N	\N	{"start_date": "2025-05-01T19:19:57.292180", "target_date": "2025-05-28T19:19:57.292180", "priority": "HIGH", "owner_id": "dd02b542-bba6-4c74-bc7f-22b6b0b2a355"}	2025-05-04 19:19:57.29218	2025-05-04 19:19:57.29218
61da7459-4697-4b51-bdae-58fd0e4e5340	242f2060-a185-4982-95b5-43e3b208702f	Customer Data Platform Integration	Integration of marketing, sales and product data to create a unified customer data platform	active	\N	\N	{"start_date": "2025-05-01T19:19:57.292180", "target_date": "2025-05-28T19:19:57.292180", "priority": "HIGH", "owner_id": "dd02b542-bba6-4c74-bc7f-22b6b0b2a355"}	2025-05-04 19:19:57.29218	2025-05-04 19:19:57.29218
b1e02c40-2207-41c7-80b8-14804f38bb70	242f2060-a185-4982-95b5-43e3b208702f	AI Assistant Product Feature	Development of an AI assistant feature for our core product to provide contextual help and automate routine tasks	in_progress	\N	\N	{"start_date": "2025-05-01T19:19:57.292180", "target_date": "2025-05-28T19:19:57.292180", "priority": "HIGH", "owner_id": "dd02b542-bba6-4c74-bc7f-22b6b0b2a355"}	2025-05-04 19:19:57.29218	2025-05-04 19:19:57.29218
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, description, tenant_id, created_at, updated_at, lead_id) FROM stdin;
d162000f-de2d-4c0f-bd2f-c252e4b1cbfe	Frontend	Frontend development	242f2060-a185-4982-95b5-43e3b208702f	2025-05-04 19:13:28.909561	2025-05-04 19:13:28.909561	\N
c76b536f-f0e6-4d08-a852-a128cbe34a86	Backend	Backend services and APIs	242f2060-a185-4982-95b5-43e3b208702f	2025-05-04 19:13:28.909561	2025-05-04 19:13:28.909561	\N
b3940c76-b8c4-4634-832a-118882b9be17	DevOps	Infrastructure and deployment	242f2060-a185-4982-95b5-43e3b208702f	2025-05-04 19:13:28.909561	2025-05-04 19:13:28.909561	\N
01fee885-ab47-44cf-8225-a1e28fc9b51a	Mobile	Mobile app development	242f2060-a185-4982-95b5-43e3b208702f	2025-05-04 19:13:28.909561	2025-05-04 19:13:28.909561	\N
a0b66cfc-6626-4fa9-b7ce-ff5e86ffc481	Data Science	ML and data analytics	242f2060-a185-4982-95b5-43e3b208702f	2025-05-04 19:13:28.909561	2025-05-04 19:13:28.909561	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, domain, sso_config, created_at, updated_at, is_active, settings) FROM stdin;
3fa85f64-5717-4562-b3fc-2c963f66afa6	Pharma AI Demo	pharmademo.biosphere.ai	\N	2025-05-04 01:17:35.319429+00	\N	t	\N
242f2060-a185-4982-95b5-43e3b208702f	Tech Innovations Inc.	techinnovations.com	\N	2025-05-04 02:24:59.300128+00	2025-05-04 02:24:59.300128+00	t	\N
e40a2e09-4af1-436b-b4bb-4826c866b199	Metropolitan Health System	metrohealth.org	\N	2025-05-04 02:34:08.625868+00	2025-05-04 02:34:08.625868+00	t	\N
1cb10e3e-8996-4b96-a31b-cc1ee62a5574	Global Financial Group	globalfingroup.com	\N	2025-05-04 02:34:08.625868+00	2025-05-04 02:34:08.625868+00	t	\N
6a3a3662-52e9-4dd4-972c-9f87e7c9940f	Advanced Manufacturing Corp	advancedmfg.com	\N	2025-05-04 02:34:08.625868+00	2025-05-04 02:34:08.625868+00	t	\N
c089973e-d3b4-43d8-9642-4bfa5a12b348	University Research Alliance	uniresearch.edu	\N	2025-05-04 02:34:08.625868+00	2025-05-04 02:34:08.625868+00	t	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, tenant_id, name, email, title, avatar_url, online_status, auth_provider, auth_provider_id, manager_id, team_id, created_at, updated_at, last_login_at, google_access_token, google_refresh_token, google_token_expiry, hashed_password, password_reset_token, password_reset_expires) FROM stdin;
5fa85f64-5717-4562-b3fc-2c963f66afa6	3fa85f64-5717-4562-b3fc-2c963f66afa6	Dan Huston	pharmademo@example.com	Lead	\N	\N	password	\N	\N	\N	2025-05-04 01:17:35.518117+00	2025-05-04 16:08:04.672737+00	2025-05-04 16:08:04.685321+00	\N	\N	\N	b	\N	\N
dd02b542-bba6-4c74-bc7f-22b6b0b2a355	242f2060-a185-4982-95b5-43e3b208702f	Tech Innovations Inc. Demo User	techinnovations@example.com	Product Manager	https://i.pravatar.cc/150?u=techinnovations@example.com	f	password	\N	\N	\N	2025-05-04 04:08:25.537903+00	2025-05-04 05:52:44.299898+00	2025-05-04 05:52:44.306985+00	\N	\N	\N	\N	\N	\N
7c1f0d64-020c-4003-9bb5-6da91525e994	e40a2e09-4af1-436b-b4bb-4826c866b199	Metropolitan Health System Demo User	metrohealth@example.com	Product Manager	https://i.pravatar.cc/150?u=metrohealth@example.com	f	password	\N	\N	\N	2025-05-04 05:42:27.531896+00	2025-05-04 05:53:25.395346+00	2025-05-04 05:53:25.402792+00	\N	\N	\N	\N	\N	\N
7153ed5f-a156-4139-b471-9ef2b1102364	c089973e-d3b4-43d8-9642-4bfa5a12b348	University Research Alliance Demo User	uniresearch@example.com	Product Manager	https://i.pravatar.cc/150?u=uniresearch@example.com	f	password	\N	\N	\N	2025-05-04 04:08:34.822611+00	2025-05-04 05:54:17.871007+00	2025-05-04 05:54:17.874172+00	\N	\N	\N	\N	\N	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: edges edges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.edges
    ADD CONSTRAINT edges_pkey PRIMARY KEY (id);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: goals pk_goals; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT pk_goals PRIMARY KEY (id);


--
-- Name: knowledge_assets pk_knowledge_assets; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_assets
    ADD CONSTRAINT pk_knowledge_assets PRIMARY KEY (id);


--
-- Name: projects pk_projects; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT pk_projects PRIMARY KEY (id);


--
-- Name: teams pk_teams; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT pk_teams PRIMARY KEY (id);


--
-- Name: tenants pk_tenants; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT pk_tenants PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: idx_edges_dst; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_edges_dst ON public.edges USING btree (dst);


--
-- Name: idx_edges_label; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_edges_label ON public.edges USING btree (label);


--
-- Name: idx_edges_src; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_edges_src ON public.edges USING btree (src);


--
-- Name: idx_edges_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_edges_tenant_id ON public.edges USING btree (tenant_id);


--
-- Name: idx_nodes_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodes_tenant_id ON public.nodes USING btree (tenant_id);


--
-- Name: idx_nodes_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodes_type ON public.nodes USING btree (type);


--
-- Name: idx_nodes_xy; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodes_xy ON public.nodes USING btree (x, y);


--
-- Name: ix_goals_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_goals_parent_id ON public.goals USING btree (parent_id);


--
-- Name: ix_goals_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_goals_tenant_id ON public.goals USING btree (tenant_id);


--
-- Name: ix_goals_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_goals_title ON public.goals USING btree (title);


--
-- Name: ix_goals_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_goals_type ON public.goals USING btree (type);


--
-- Name: ix_knowledge_assets_created_by_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_knowledge_assets_created_by_user_id ON public.knowledge_assets USING btree (created_by_user_id);


--
-- Name: ix_knowledge_assets_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_knowledge_assets_project_id ON public.knowledge_assets USING btree (project_id);


--
-- Name: ix_knowledge_assets_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_knowledge_assets_tenant_id ON public.knowledge_assets USING btree (tenant_id);


--
-- Name: ix_knowledge_assets_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_knowledge_assets_title ON public.knowledge_assets USING btree (title);


--
-- Name: ix_knowledge_assets_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_knowledge_assets_type ON public.knowledge_assets USING btree (type);


--
-- Name: ix_projects_goal_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_projects_goal_id ON public.projects USING btree (goal_id);


--
-- Name: ix_projects_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_projects_name ON public.projects USING btree (name);


--
-- Name: ix_projects_owning_team_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_projects_owning_team_id ON public.projects USING btree (owning_team_id);


--
-- Name: ix_projects_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_projects_tenant_id ON public.projects USING btree (tenant_id);


--
-- Name: ix_teams_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_teams_name ON public.teams USING btree (name);


--
-- Name: ix_tenants_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_tenants_domain ON public.tenants USING btree (domain);


--
-- Name: ix_tenants_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tenants_is_active ON public.tenants USING btree (is_active);


--
-- Name: ix_tenants_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tenants_name ON public.tenants USING btree (name);


--
-- Name: ix_users_auth_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_auth_provider_id ON public.users USING btree (auth_provider_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: edges edges_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.edges
    ADD CONSTRAINT edges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: goals fk_goals_parent_id_goals; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT fk_goals_parent_id_goals FOREIGN KEY (parent_id) REFERENCES public.goals(id);


--
-- Name: goals fk_goals_tenant_id_tenants; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT fk_goals_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: knowledge_assets fk_knowledge_assets_created_by_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_assets
    ADD CONSTRAINT fk_knowledge_assets_created_by_user_id_users FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: knowledge_assets fk_knowledge_assets_project_id_projects; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_assets
    ADD CONSTRAINT fk_knowledge_assets_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: knowledge_assets fk_knowledge_assets_tenant_id_tenants; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_assets
    ADD CONSTRAINT fk_knowledge_assets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: projects fk_projects_goal_id_goals; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fk_projects_goal_id_goals FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: projects fk_projects_owning_team_id_teams; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fk_projects_owning_team_id_teams FOREIGN KEY (owning_team_id) REFERENCES public.teams(id);


--
-- Name: projects fk_projects_tenant_id_tenants; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fk_projects_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: teams fk_teams_tenant_id_tenants; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT fk_teams_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: users fk_users_manager_id_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_manager_id_users FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: users fk_users_team_id_teams; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_team_id_teams FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: users fk_users_tenant_id_tenants; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: nodes nodes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

