-- Estrutura do banco desta aplicação (somente tabelas/índices; SEM dados).
-- O Postgres aplica este arquivo automaticamente na 1ª subida.

--
-- PostgreSQL database dump
--

\restrict 2JGDZxfXNZrv10Edj6o5oNZgG0D4EKLeLENCXcwbwZxkMQdoOkIUrqd5zzAuhC0

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

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
-- Name: app_recife_por_elas; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_recife_por_elas;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acessos; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.acessos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    caminho text NOT NULL,
    referrer text,
    user_agent text,
    ip text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: candidatura; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.candidatura (
    id integer NOT NULL,
    usuario_id uuid NOT NULL,
    oportunidade_id integer NOT NULL,
    data_candidatura timestamp with time zone DEFAULT now() NOT NULL,
    mensagem text DEFAULT ''::text,
    status text DEFAULT 'Enviada'::text NOT NULL,
    CONSTRAINT candidatura_status_check CHECK ((status = ANY (ARRAY['Enviada'::text, 'Em análise'::text, 'Aprovada'::text, 'Não selecionada'::text])))
);


--
-- Name: candidatura_id_seq; Type: SEQUENCE; Schema: app_recife_por_elas; Owner: -
--

CREATE SEQUENCE app_recife_por_elas.candidatura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: candidatura_id_seq; Type: SEQUENCE OWNED BY; Schema: app_recife_por_elas; Owner: -
--

ALTER SEQUENCE app_recife_por_elas.candidatura_id_seq OWNED BY app_recife_por_elas.candidatura.id;


--
-- Name: logs; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    acao text NOT NULL,
    entidade text,
    metodo text,
    caminho text,
    status integer,
    detalhe jsonb,
    ip text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mensagem_mural; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.mensagem_mural (
    id integer NOT NULL,
    bairro text NOT NULL,
    autor_nome text NOT NULL,
    texto text NOT NULL,
    data_publicacao timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mensagem_mural_id_seq; Type: SEQUENCE; Schema: app_recife_por_elas; Owner: -
--

CREATE SEQUENCE app_recife_por_elas.mensagem_mural_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mensagem_mural_id_seq; Type: SEQUENCE OWNED BY; Schema: app_recife_por_elas; Owner: -
--

ALTER SEQUENCE app_recife_por_elas.mensagem_mural_id_seq OWNED BY app_recife_por_elas.mensagem_mural.id;


--
-- Name: oportunidade; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.oportunidade (
    id integer NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    tipo text NOT NULL,
    fonte text NOT NULL,
    link_inscricao text DEFAULT ''::text,
    bairro text DEFAULT ''::text,
    endereco text DEFAULT ''::text,
    latitude double precision,
    longitude double precision,
    horario text DEFAULT ''::text,
    data_inicio_inscricao date,
    data_fim_inscricao date,
    CONSTRAINT oportunidade_tipo_check CHECK ((tipo = ANY (ARRAY['Emprego'::text, 'Curso'::text, 'Benefício social'::text, 'Microcrédito'::text])))
);


--
-- Name: oportunidade_id_seq; Type: SEQUENCE; Schema: app_recife_por_elas; Owner: -
--

CREATE SEQUENCE app_recife_por_elas.oportunidade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oportunidade_id_seq; Type: SEQUENCE OWNED BY; Schema: app_recife_por_elas; Owner: -
--

ALTER SEQUENCE app_recife_por_elas.oportunidade_id_seq OWNED BY app_recife_por_elas.oportunidade.id;


--
-- Name: perfil; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.perfil (
    usuario_id uuid NOT NULL,
    telefone text DEFAULT ''::text,
    cpf text DEFAULT ''::text,
    data_nascimento text DEFAULT ''::text,
    bairro text DEFAULT ''::text,
    filhos integer DEFAULT 0,
    idades_filhos text DEFAULT ''::text,
    turno_disponivel text DEFAULT ''::text,
    interesses text DEFAULT ''::text
);


--
-- Name: reset_senha; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.reset_senha (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    token_hash text NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    usado boolean DEFAULT false NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email_cifrado bytea NOT NULL,
    email_indice text NOT NULL,
    senha_hash text NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: equipamentos_publicos; Type: TABLE; Schema: app_recife_por_elas; Owner: -
--

CREATE TABLE app_recife_por_elas.equipamentos_locais (
    id character varying NOT NULL,
    nome character varying,
    categoria character varying,
    endereco text,
    bairro text,
    telefone text,
    horario_funcionamento text,
    latitude numeric,
    longitude numeric,
    fonte_dados character varying DEFAULT 'desconhecida',
    verificado_manualmente boolean DEFAULT false,
    ativo boolean DEFAULT true,
    atualizado_em timestamp with time zone DEFAULT now(),
    criado_em timestamp with time zone DEFAULT now()
);



--
-- Name: candidatura id; Type: DEFAULT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.candidatura ALTER COLUMN id SET DEFAULT nextval('app_recife_por_elas.candidatura_id_seq'::regclass);


--
-- Name: mensagem_mural id; Type: DEFAULT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.mensagem_mural ALTER COLUMN id SET DEFAULT nextval('app_recife_por_elas.mensagem_mural_id_seq'::regclass);


--
-- Name: oportunidade id; Type: DEFAULT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.oportunidade ALTER COLUMN id SET DEFAULT nextval('app_recife_por_elas.oportunidade_id_seq'::regclass);


--
-- Name: acessos acessos_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.acessos
    ADD CONSTRAINT acessos_pkey PRIMARY KEY (id);


--
-- Name: equipamentos_locais equipamentos_locais_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.equipamentos_locais
    ADD CONSTRAINT equipamentos_locais_pkey PRIMARY KEY (id);



--
-- Name: candidatura candidatura_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.candidatura
    ADD CONSTRAINT candidatura_pkey PRIMARY KEY (id);


--
-- Name: candidatura candidatura_usuario_id_oportunidade_id_key; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.candidatura
    ADD CONSTRAINT candidatura_usuario_id_oportunidade_id_key UNIQUE (usuario_id, oportunidade_id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: mensagem_mural mensagem_mural_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.mensagem_mural
    ADD CONSTRAINT mensagem_mural_pkey PRIMARY KEY (id);


--
-- Name: oportunidade oportunidade_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.oportunidade
    ADD CONSTRAINT oportunidade_pkey PRIMARY KEY (id);


--
-- Name: perfil perfil_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.perfil
    ADD CONSTRAINT perfil_pkey PRIMARY KEY (usuario_id);


--
-- Name: reset_senha reset_senha_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.reset_senha
    ADD CONSTRAINT reset_senha_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_indice_key; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.usuarios
    ADD CONSTRAINT usuarios_email_indice_key UNIQUE (email_indice);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_acessos_criado; Type: INDEX; Schema: app_recife_por_elas; Owner: -
--

CREATE INDEX idx_acessos_criado ON app_recife_por_elas.acessos USING btree (criado_em DESC);


--
-- Name: idx_logs_criado; Type: INDEX; Schema: app_recife_por_elas; Owner: -
--

CREATE INDEX idx_logs_criado ON app_recife_por_elas.logs USING btree (criado_em DESC);


--
-- Name: candidatura candidatura_oportunidade_id_fkey; Type: FK CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.candidatura
    ADD CONSTRAINT candidatura_oportunidade_id_fkey FOREIGN KEY (oportunidade_id) REFERENCES app_recife_por_elas.oportunidade(id) ON DELETE CASCADE;


--
-- Name: candidatura candidatura_usuario_id_fkey; Type: FK CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.candidatura
    ADD CONSTRAINT candidatura_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES app_recife_por_elas.usuarios(id) ON DELETE CASCADE;


--
-- Name: perfil perfil_usuario_id_fkey; Type: FK CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.perfil
    ADD CONSTRAINT perfil_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES app_recife_por_elas.usuarios(id) ON DELETE CASCADE;


--
-- Name: reset_senha reset_senha_usuario_id_fkey; Type: FK CONSTRAINT; Schema: app_recife_por_elas; Owner: -
--

ALTER TABLE ONLY app_recife_por_elas.reset_senha
    ADD CONSTRAINT reset_senha_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES app_recife_por_elas.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 2JGDZxfXNZrv10Edj6o5oNZgG0D4EKLeLENCXcwbwZxkMQdoOkIUrqd5zzAuhC0

