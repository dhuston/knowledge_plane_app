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

