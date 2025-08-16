--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: enum_messages_message_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_messages_message_type AS ENUM (
    'text',
    'file',
    'system'
);


ALTER TYPE public.enum_messages_message_type OWNER TO neondb_owner;

--
-- Name: enum_messages_sender_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_messages_sender_role AS ENUM (
    'customer',
    'shop_owner',
    'admin'
);


ALTER TYPE public.enum_messages_sender_role OWNER TO neondb_owner;

--
-- Name: enum_shop_applications_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_shop_applications_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_shop_applications_status OWNER TO neondb_owner;

--
-- Name: enum_shop_unlocks_unlock_method; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_shop_unlocks_unlock_method AS ENUM (
    'qr_scan',
    'search',
    'direct_link'
);


ALTER TYPE public.enum_shop_unlocks_unlock_method OWNER TO neondb_owner;

--
-- Name: enum_shops_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_shops_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'deactivated',
    'banned'
);


ALTER TYPE public.enum_shops_status OWNER TO neondb_owner;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_users_role AS ENUM (
    'customer',
    'shop_owner',
    'admin'
);


ALTER TYPE public.enum_users_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: customer_shop_unlocks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_shop_unlocks (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    shop_id integer NOT NULL,
    unlocked_at timestamp with time zone NOT NULL,
    qr_scan_location character varying(255)
);


ALTER TABLE public.customer_shop_unlocks OWNER TO neondb_owner;

--
-- Name: customer_shop_unlocks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customer_shop_unlocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_shop_unlocks_id_seq OWNER TO neondb_owner;

--
-- Name: customer_shop_unlocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customer_shop_unlocks_id_seq OWNED BY public.customer_shop_unlocks.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    order_id integer NOT NULL,
    sender_id integer NOT NULL,
    sender_name character varying(255) NOT NULL,
    sender_role public.enum_messages_sender_role NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    files text,
    message_type public.enum_messages_message_type DEFAULT 'text'::public.enum_messages_message_type NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(255) NOT NULL,
    related_id integer,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    shop_id integer NOT NULL,
    order_number integer DEFAULT 0 NOT NULL,
    type character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    specifications jsonb,
    files jsonb,
    walkin_time timestamp with time zone,
    status character varying(255) DEFAULT 'new'::character varying NOT NULL,
    is_urgent boolean DEFAULT false NOT NULL,
    estimated_pages integer,
    estimated_budget numeric(10,2),
    final_amount numeric(10,2),
    notes text,
    deleted_by integer,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: qr_scans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.qr_scans (
    id integer NOT NULL,
    customer_id integer,
    shop_id integer NOT NULL,
    resulted_in_unlock boolean DEFAULT false NOT NULL,
    scan_location character varying(255),
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.qr_scans OWNER TO neondb_owner;

--
-- Name: qr_scans_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.qr_scans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qr_scans_id_seq OWNER TO neondb_owner;

--
-- Name: qr_scans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.qr_scans_id_seq OWNED BY public.qr_scans.id;


--
-- Name: shop_applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shop_applications (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    public_shop_name character varying(255) NOT NULL,
    public_owner_name character varying(255),
    public_address character varying(255) NOT NULL,
    public_contact_number character varying(255) NOT NULL,
    internal_shop_name character varying(255) NOT NULL,
    owner_full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    complete_address text,
    city character varying(255),
    state character varying(255),
    pin_code character varying(255) NOT NULL,
    services jsonb NOT NULL,
    custom_services jsonb DEFAULT '[]'::jsonb,
    equipment jsonb DEFAULT '[]'::jsonb,
    custom_equipment jsonb DEFAULT '[]'::jsonb,
    formation_year integer NOT NULL,
    working_hours jsonb NOT NULL,
    accepts_walkin_orders boolean DEFAULT true NOT NULL,
    shop_slug character varying(255) NOT NULL,
    status public.enum_shop_applications_status DEFAULT 'pending'::public.enum_shop_applications_status NOT NULL,
    admin_notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.shop_applications OWNER TO neondb_owner;

--
-- Name: shop_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shop_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_applications_id_seq OWNER TO neondb_owner;

--
-- Name: shop_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shop_applications_id_seq OWNED BY public.shop_applications.id;


--
-- Name: shop_unlocks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shop_unlocks (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    shop_id integer NOT NULL,
    unlock_method public.enum_shop_unlocks_unlock_method DEFAULT 'qr_scan'::public.enum_shop_unlocks_unlock_method NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.shop_unlocks OWNER TO neondb_owner;

--
-- Name: shop_unlocks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shop_unlocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_unlocks_id_seq OWNER TO neondb_owner;

--
-- Name: shop_unlocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shop_unlocks_id_seq OWNED BY public.shop_unlocks.id;


--
-- Name: shops; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shops (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    address text,
    city character varying(255),
    state character varying(255),
    pin_code character varying(255),
    phone character varying(255),
    public_owner_name character varying(255),
    internal_name character varying(255),
    owner_full_name character varying(255),
    email character varying(255),
    owner_phone character varying(255),
    complete_address text,
    services jsonb DEFAULT '[]'::jsonb,
    equipment jsonb DEFAULT '[]'::jsonb,
    custom_services text,
    custom_equipment text,
    years_of_experience integer,
    formation_year integer,
    working_hours jsonb DEFAULT '{}'::jsonb,
    accepts_walkin_orders boolean DEFAULT false,
    is_online boolean DEFAULT true,
    auto_availability boolean DEFAULT true,
    is_approved boolean DEFAULT true,
    is_public boolean DEFAULT true,
    status public.enum_shops_status DEFAULT 'active'::public.enum_shops_status,
    qr_code text,
    total_orders integer DEFAULT 0,
    exterior_image text,
    google_maps_link text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.shops OWNER TO neondb_owner;

--
-- Name: shops_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shops_id_seq OWNER TO neondb_owner;

--
-- Name: shops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shops_id_seq OWNED BY public.shops.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    phone character varying(255) NOT NULL,
    name character varying(255),
    email character varying(255),
    password_hash character varying(255),
    role public.enum_users_role DEFAULT 'customer'::public.enum_users_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: customer_shop_unlocks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_shop_unlocks ALTER COLUMN id SET DEFAULT nextval('public.customer_shop_unlocks_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: qr_scans id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_scans ALTER COLUMN id SET DEFAULT nextval('public.qr_scans_id_seq'::regclass);


--
-- Name: shop_applications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_applications ALTER COLUMN id SET DEFAULT nextval('public.shop_applications_id_seq'::regclass);


--
-- Name: shop_unlocks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_unlocks ALTER COLUMN id SET DEFAULT nextval('public.shop_unlocks_id_seq'::regclass);


--
-- Name: shops id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shops ALTER COLUMN id SET DEFAULT nextval('public.shops_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	02715f6b-4187-43bf-8bb7-c68c13b0b045	68ed6a6a-bb74-4058-91f0-e6265a941e27	35	2025-08-15 16:46:25.251312+00
\.


--
-- Data for Name: customer_shop_unlocks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_shop_unlocks (id, customer_id, shop_id, unlocked_at, qr_scan_location) FROM stdin;
1	85	21	2025-08-15 16:51:53.918+00	auto_unlock_previous_order
2	85	2	2025-08-15 18:37:16.974+00	auto_unlock_previous_order
3	85	19	2025-08-15 19:44:05.104+00	auto_unlock_previous_order
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, order_id, sender_id, sender_name, sender_role, content, files, message_type, is_read, created_at) FROM stdin;
1	6	2	Sonal Owner	shop_owner	hi	\N	text	t	2025-08-16 11:57:30.123+00
3	6	2	Sonal Owner	shop_owner	hi	\N	text	t	2025-08-16 11:59:10.204+00
2	6	85	Harsh Thakar	customer	Hi	\N	text	t	2025-08-16 11:58:53.367+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, title, message, type, related_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, customer_id, shop_id, order_number, type, title, description, specifications, files, walkin_time, status, is_urgent, estimated_pages, estimated_budget, final_amount, notes, deleted_by, deleted_at, created_at, updated_at) FROM stdin;
6	85	2	1	file_upload	Order #1		"URGENT ORDER"	[{"path": "orders/2025/08/order-temp-1755345340400/1755345340400-IMG_4585.jpeg", "size": 3438469, "r2Key": "orders/2025/08/order-temp-1755345340400/1755345340400-IMG_4585.jpeg", "bucket": "printeasy-qr", "filename": "1755345340400-IMG_4585.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4585.jpeg"}, {"path": "orders/2025/08/order-temp-1755345340400/1755345340404-3b43d4a7-32d2-4460-a6a7-39da4277cd6a.jpeg", "size": 74605, "r2Key": "orders/2025/08/order-temp-1755345340400/1755345340404-3b43d4a7-32d2-4460-a6a7-39da4277cd6a.jpeg", "bucket": "printeasy-qr", "filename": "1755345340404-3b43d4a7-32d2-4460-a6a7-39da4277cd6a.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "3b43d4a7-32d2-4460-a6a7-39da4277cd6a.jpeg"}, {"path": "orders/2025/08/order-temp-1755345340400/1755345340404-OfferLetter_08-06-2025.pdf__1_.pdf", "size": 459351, "r2Key": "orders/2025/08/order-temp-1755345340400/1755345340404-OfferLetter_08-06-2025.pdf__1_.pdf", "bucket": "printeasy-qr", "filename": "1755345340404-OfferLetter_08-06-2025.pdf__1_.pdf", "mimetype": "application/pdf", "storageType": "r2", "originalName": "OfferLetter 08-06-2025.pdf (1).pdf"}]	\N	completed	t	\N	\N	\N	\N	\N	\N	2025-08-16 11:55:44.158+00	2025-08-16 12:00:42.385+00
1	85	21	1	upload	Order from Harsh		"URGENT ORDER"	[{"path": "orders/2025/08/order-anon-1755276695235/1755276695236-IMG_4578.jpeg", "size": 3142426, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695236-IMG_4578.jpeg", "bucket": "printeasy-qr", "filename": "1755276695236-IMG_4578.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4578.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695242-IMG_4577.jpeg", "size": 3191267, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695242-IMG_4577.jpeg", "bucket": "printeasy-qr", "filename": "1755276695242-IMG_4577.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4577.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695243-IMG_4576.jpeg", "size": 3847355, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695243-IMG_4576.jpeg", "bucket": "printeasy-qr", "filename": "1755276695243-IMG_4576.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4576.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695244-IMG_4575.jpeg", "size": 3979025, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695244-IMG_4575.jpeg", "bucket": "printeasy-qr", "filename": "1755276695244-IMG_4575.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4575.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695244-IMG_4574.jpeg", "size": 3140024, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695244-IMG_4574.jpeg", "bucket": "printeasy-qr", "filename": "1755276695244-IMG_4574.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4574.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695245-IMG_4573.jpeg", "size": 3017718, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695245-IMG_4573.jpeg", "bucket": "printeasy-qr", "filename": "1755276695245-IMG_4573.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4573.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695245-IMG_4572.jpeg", "size": 4010417, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695245-IMG_4572.jpeg", "bucket": "printeasy-qr", "filename": "1755276695245-IMG_4572.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4572.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695245-IMG_4571.jpeg", "size": 3010000, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695245-IMG_4571.jpeg", "bucket": "printeasy-qr", "filename": "1755276695245-IMG_4571.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4571.jpeg"}, {"path": "orders/2025/08/order-anon-1755276695235/1755276695246-IMG_4570.jpeg", "size": 2897438, "r2Key": "orders/2025/08/order-anon-1755276695235/1755276695246-IMG_4570.jpeg", "bucket": "printeasy-qr", "filename": "1755276695246-IMG_4570.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4570.jpeg"}]	\N	completed	f	\N	\N	\N	\N	\N	\N	2025-08-15 16:51:41.163+00	2025-08-15 17:14:56.497+00
2	85	2	1	upload	Order from Harsh		"URGENT ORDER"	[{"path": "orders/2025/08/order-anon-1755283004919/1755283004920-IMG_4578.jpeg", "size": 3142426, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004920-IMG_4578.jpeg", "bucket": "printeasy-qr", "filename": "1755283004920-IMG_4578.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4578.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004926-IMG_4577.jpeg", "size": 3191267, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004926-IMG_4577.jpeg", "bucket": "printeasy-qr", "filename": "1755283004926-IMG_4577.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4577.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004927-IMG_4574.jpeg", "size": 3140024, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004927-IMG_4574.jpeg", "bucket": "printeasy-qr", "filename": "1755283004927-IMG_4574.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4574.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004927-IMG_4576.jpeg", "size": 3847355, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004927-IMG_4576.jpeg", "bucket": "printeasy-qr", "filename": "1755283004927-IMG_4576.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4576.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004928-IMG_4575.jpeg", "size": 3979025, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004928-IMG_4575.jpeg", "bucket": "printeasy-qr", "filename": "1755283004928-IMG_4575.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4575.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004928-IMG_4573.jpeg", "size": 3017718, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004928-IMG_4573.jpeg", "bucket": "printeasy-qr", "filename": "1755283004928-IMG_4573.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4573.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004928-IMG_4572.jpeg", "size": 4010417, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004928-IMG_4572.jpeg", "bucket": "printeasy-qr", "filename": "1755283004928-IMG_4572.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4572.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004929-IMG_4571.jpeg", "size": 3010000, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004929-IMG_4571.jpeg", "bucket": "printeasy-qr", "filename": "1755283004929-IMG_4571.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4571.jpeg"}, {"path": "orders/2025/08/order-anon-1755283004919/1755283004929-IMG_4570.jpeg", "size": 2897438, "r2Key": "orders/2025/08/order-anon-1755283004919/1755283004929-IMG_4570.jpeg", "bucket": "printeasy-qr", "filename": "1755283004929-IMG_4570.jpeg", "mimetype": "image/jpeg", "storageType": "r2", "originalName": "IMG_4570.jpeg"}]	\N	new	f	\N	\N	\N	\N	85	2025-08-15 19:44:07.755+00	2025-08-15 18:36:54.482+00	2025-08-15 19:44:07.755+00
3	85	19	1	upload	Order from Harsh		\N	[]	\N	new	f	\N	\N	\N	\N	85	2025-08-15 19:44:08.879+00	2025-08-15 19:21:52.979+00	2025-08-15 19:44:08.879+00
4	85	19	2	upload	Order from Harsh		\N	[]	\N	new	f	\N	\N	\N	\N	85	2025-08-15 19:44:09.753+00	2025-08-15 19:24:20.94+00	2025-08-15 19:44:09.753+00
5	85	19	3	upload	Order from HARSH		"URGENT ORDER"	[]	\N	new	f	\N	\N	\N	\N	85	2025-08-15 19:46:59.059+00	2025-08-15 19:43:48.118+00	2025-08-15 19:46:59.059+00
9	85	2	1	file_upload	Order #1		"URGENT ORDER"	[]	\N	processing	t	\N	\N	\N	\N	\N	\N	2025-08-16 13:37:55.341+00	2025-08-16 13:40:00.964+00
7	85	2	1	file_upload	Order #1		"URGENT ORDER"	[]	\N	pending	t	\N	\N	\N	\N	2	2025-08-16 12:45:11.819+00	2025-08-16 12:25:42.301+00	2025-08-16 12:45:11.82+00
8	85	2	1	file_upload	Order #1		"URGENT ORDER"	[{"id": "8-0-1755349984409", "path": "orders/2025/08/order-8/1755349971332-IMG_4585.jpeg", "size": 3438469, "r2Key": "orders/2025/08/order-8/1755349971332-IMG_4585.jpeg", "bucket": "printeasy-qr", "status": "completed", "filename": "1755349971332-IMG_4585.jpeg", "mimetype": "image/jpeg", "uploadedAt": "2025-08-16T13:13:04.409Z", "storageType": "r2", "originalName": "IMG_4585.jpeg"}, {"id": "8-1-1755349984409", "path": "orders/2025/08/order-8/1755349971333-OfferLetter_08-06-2025.pdf__1_.pdf", "size": 459351, "r2Key": "orders/2025/08/order-8/1755349971333-OfferLetter_08-06-2025.pdf__1_.pdf", "bucket": "printeasy-qr", "status": "completed", "filename": "1755349971333-OfferLetter_08-06-2025.pdf__1_.pdf", "mimetype": "application/pdf", "uploadedAt": "2025-08-16T13:13:04.409Z", "storageType": "r2", "originalName": "OfferLetter 08-06-2025.pdf (1).pdf"}]	\N	pending	t	\N	\N	\N	\N	2	2025-08-16 13:28:07.026+00	2025-08-16 13:12:50.846+00	2025-08-16 13:28:07.028+00
\.


--
-- Data for Name: qr_scans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.qr_scans (id, customer_id, shop_id, resulted_in_unlock, scan_location, created_at) FROM stdin;
\.


--
-- Data for Name: shop_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shop_applications (id, applicant_id, public_shop_name, public_owner_name, public_address, public_contact_number, internal_shop_name, owner_full_name, email, phone_number, password, complete_address, city, state, pin_code, services, custom_services, equipment, custom_equipment, formation_year, working_hours, accepts_walkin_orders, shop_slug, status, admin_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shop_unlocks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shop_unlocks (id, customer_id, shop_id, unlock_method, created_at) FROM stdin;
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shops (id, owner_id, name, slug, address, city, state, pin_code, phone, public_owner_name, internal_name, owner_full_name, email, owner_phone, complete_address, services, equipment, custom_services, custom_equipment, years_of_experience, formation_year, working_hours, accepts_walkin_orders, is_online, auto_availability, is_approved, is_public, status, qr_code, total_orders, exterior_image, google_maps_link, created_at, updated_at) FROM stdin;
1	1	gujarat xerox	gujarat-xerox	ગુજરાત ઝેરોક્સ	Ahmedabad	Gujarat	380013	9375825148	gujarat Owner	gujarat xerox	gujarat Owner	gujarat@printeasyqr.com	9375825148	dhanlaxmi avenue, Nirant Cross Rd, near jawahar chowk, Rambagh, Maninagar, Ahmedabad, Gujarat 380013, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=A1IwW6uUPioSFVOXLXPcfw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=33.17099&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=gujarat%20xerox&query_place_id=ChIJ1yPB-OmFXjkR6F_aSjyZFLQ	2025-08-15 14:13:06.256+00	2025-08-15 14:13:06.256+00
2	2	Sonal Xerox	sonal-xerox	સોનલ ઝેરોક્સ	Ahmedabad	Gujarat	380008	8905602840	Sonal Owner	Sonal Xerox	Sonal Owner	sonal@printeasyqr.com	8905602840	Mandir Complex, Gf2, Bhairavnath Rd, Opposite Jai Hind School, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMOEgOWrFEIiq5A-og7PE34fbSdoWyrqB88ujHH=w408-h272-k-no	https://www.google.com/maps/search/?api=1&query=Sonal%20Xerox&query_place_id=ChIJP792K-eFXjkRW3AXG9zy_XY	2025-08-15 14:13:07.562+00	2025-08-15 14:13:07.562+00
3	3	Hello Xerox	hello-xerox	હેલો ઝેરોક્ષ	Ahmedabad	Gujarat	380008	9427960337	Hello Owner	Hello Xerox	Hello Owner	hello@printeasyqr.com	9427960337	2J22+52H, Rambaug Kankariya Rd, Prankunj Society, Krishnakunj Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "09:30", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=ZJkkG0Dar194eB6XrP0agQ&cb_client=search.gws-prod.gps&w=408&h=240&yaw=239.67068&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Hello%20Xerox&query_place_id=ChIJAQAQp8OFXjkRfSWiF_JRl_U	2025-08-15 14:13:08.863+00	2025-08-15 14:13:08.863+00
4	4	Shree Saikrupa Xerox Copy Center	shree-saikrupa-xerox-copy-center	શ્રી સાઇકૃપા ઝેરોક્સ કોપી સેન્ટર	Ahmedabad	Gujarat	380008	9374061034	Shree Saikrupa Owner	Shree Saikrupa Xerox Copy Center	Shree Saikrupa Owner	shreesaikrupa@printeasyqr.com	9374061034	Shop No. 4, Krishnanand Complex, Near Prince Pavbhaji, Jawahar Chowk Char Rastha, Bhairavnath Rd, opposite Soham Plaza, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=aksH15aYAJLBiKSGezfyEQ&cb_client=search.gws-prod.gps&w=408&h=240&yaw=338.1387&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Shree%20Saikrupa%20Xerox%20Copy%20Center&query_place_id=ChIJn12tuOeFXjkRe2lhRY7sziA	2025-08-15 14:13:10.179+00	2025-08-15 14:13:10.179+00
5	5	Janta Xerox - Digital Printing	janta-xerox-digital-printing	જનતા ઝેરોક્ષ	Ahmedabad	Gujarat	380028	9898397056	Janta  -  Printing Owner	Janta Xerox - Digital Printing	Janta  -  Printing Owner	jantaing@printeasyqr.com	9898397056	2, Anand Shopping Center, BRTS, Bhairavnath Rd, opp. Bhairavnath, Rambagh, Maninagar, Ahmedabad, Gujarat 380028, India	["Digital printing service", "Bookbinder", "Graphic designer", "Invitation printing service", "Lamination service", "Screen printing shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "15:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=t-03ttNoCFkZ847JPFnSbw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=11.762504&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Janta%20Xerox%20-%20Digital%20Printing&query_place_id=ChIJ8_qnyIqEXjkR8Xtmhlvw4wA	2025-08-15 14:13:11.487+00	2025-08-15 14:13:11.487+00
11	11	Dhwani Zerox Centre	dhwani-zerox-centre	ધ્વનિ ઝેરોક્સ સેન્ટર	Ahmedabad	Gujarat	380008	7925463587	Dhwani Zerox Owner	Dhwani Zerox Centre	Dhwani Zerox Owner	dhwanizerox@printeasyqr.com	7925463587	2, Kashiwala Complex, Opposite Syndicate Bank, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "14:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=lGmvb9EgH8Si6R_ZMc6r5g&cb_client=search.gws-prod.gps&w=408&h=240&yaw=353.53445&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Dhwani%20Zerox%20Centre&query_place_id=ChIJ_____8KFXjkR55zs0MQCwAY	2025-08-15 14:13:19.726+00	2025-08-15 14:13:19.726+00
6	6	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar	radhey-xerox-and-stationary-best-digital-printing-	No. 1, Mahalaxmi Market, 18, Maninagar Cross Rd, opp. Gandhi Complex, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9824000974	Radhey  and Stationary - Best  Printing  in Maninagar | Lamination Remove & Hard Binding  in Maninagar Owner	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar	Radhey  and Stationary - Best  Printing  in Maninagar | Lamination Remove & Hard Binding  in Maninagar Owner	radheyandstationaryb@printeasyqr.com	9824000974	No. 1, Mahalaxmi Market, 18, Maninagar Cross Rd, opp. Gandhi Complex, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqfhXEXjTOZ3er50e9UxHuGY49tDC9wthhCKDcu6Mtp_8QqhWzCJpSENvCyPoNDkAlc4yTpeCsbZN3OdtPZGuU1lq9pJqzSDs9rXthpyGxI3jEvQSAyU0qDDBoxz2rGOCLmH4RSoQ=w408-h408-k-no	https://www.google.com/maps/search/?api=1&query=Radhey%20Xerox%20and%20Stationary%20-%20Best%20Digital%20Printing%20Shop%20in%20Maninagar%20%7C%20Lamination%20Remove%20%26%20Hard%20Binding%20Shop%20in%20Maninagar&query_place_id=ChIJ_____8KFXjkRr9YZkNloji4	2025-08-15 14:13:12.785+00	2025-08-15 14:13:12.785+00
7	7	Shivam Xerox Copy Centre	shivam-xerox-copy-centre	શિવમ ઝેરોક્સ કોપી સેન્ટર	Ahmedabad	Gujarat	380008	9879815783	Shivam Owner	Shivam Xerox Copy Centre	Shivam Owner	shivam@printeasyqr.com	9879815783	3, Krishnanand Complex, Near Prince Bhaji Pav, Opp.Soham Plaza, Jawhar Chowk Cross Road, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "16:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4noWf5y1zZUrJF9aU6BVpQDLZp_4xtGeXsdMPo8MOgM2pa7yXWZGO3ZvkLfd6aAvqFpD0gaG1bxRwUXzz1g5UPmDZxSUvZrWEjydb4lCP0iHCPCYrr2i97uWgE1dpZm-l9CQdtqj=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Shivam%20Xerox%20Copy%20Centre&query_place_id=ChIJEQlNx-eFXjkRlvDMuuqbI48	2025-08-15 14:13:14.093+00	2025-08-15 14:13:14.093+00
8	8	Saniya Colour Xerox	saniya-colour-xerox	સણીયા કલર ઝેરોક્સ	Ahmedabad	Gujarat	380028	9898298166	Saniya Colour Owner	Saniya Colour Xerox	Saniya Colour Owner	saniyacolour@printeasyqr.com	9898298166	Shop No:#29, Alishan Complex, Lalbhai Kundiwala Marg, Danilimda, Ahmedabad, Gujarat 380028, India	["Print shop", "Fax service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=B_oH6LR9I6WGdH-u9QZ6Bw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=317.09552&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Saniya%20Colour%20Xerox&query_place_id=ChIJg3VlNL2FXjkRNodNkCCcqnI	2025-08-15 14:13:15.397+00	2025-08-15 14:13:15.397+00
9	9	Gujarat Xerox	gujarat-xerox-1	ગુજરાત ઝેરોક્સ	Ahmedabad	Gujarat	380007	9879799981	Gujarat Owner	Gujarat Xerox	Gujarat Owner	gujarat@printeasyqr.com	9879799981	Purshottam Mavlankar Marg, Ellisbridge, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipN-y85W1LymcBVRL9dNnjpuF7Z6k6xsYXsC8PgU=w408-h625-k-no	https://www.google.com/maps/search/?api=1&query=Gujarat%20Xerox&query_place_id=ChIJxaGal_iEXjkRz8JIwhJDPhk	2025-08-15 14:13:17.132+00	2025-08-15 14:13:17.132+00
10	10	Krishna Xerox and Thesis Binding	krishna-xerox-and-thesis-binding	થેસીસ બાઇન્ડીંગ	Ahmedabad	Gujarat	380008	7778844446	Krishna  and Thesis Binding Owner	Krishna Xerox and Thesis Binding	Krishna  and Thesis Binding Owner	krishnaandthesisbind@printeasyqr.com	7778844446	SHOP NO,4, JL Complex, JAWAHAR CHOWK CHAR RASTA, Bhairavnath Rd, near ILAJ MEDICAL, Balvatika, Maninagar East, Maninagar, Ahmedabad, Gujarat 380008, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4noXvSyj6kx1HP4lTgcLA6Dch5Q29S24E38sQdtQO8tnzi-AulEuMogfke0FUmabHsuixaxZ05k_aQBR61KBy50yxYPpZ0NDhrTo1YrjS_XBInleARAjui9x5rVO31LV85P2QxEe=w408-h541-k-no	https://www.google.com/maps/search/?api=1&query=Krishna%20Xerox%20and%20Thesis%20Binding&query_place_id=ChIJwRD-w-eFXjkR2y6ogobDIP4	2025-08-15 14:13:18.429+00	2025-08-15 14:13:18.429+00
12	12	Shraddha Xerox	shraddha-xerox	96, Maneklal Kesavlal Chawal Opposite Parixitlalnagar, Lal Bahadur Shastri Nagar, Behrampura, Ahmedabad, Gujarat 380022, India	Ahmedabad	Gujarat	380022	9376517963	Shraddha Owner	Shraddha Xerox	Shraddha Owner	shraddha@printeasyqr.com	9376517963	96, Maneklal Kesavlal Chawal Opposite Parixitlalnagar, Lal Bahadur Shastri Nagar, Behrampura, Ahmedabad, Gujarat 380022, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipO6NLHziaB5PNCrq4a9zaJtiU51kFonhhTLfy2a=w426-h240-k-no	https://www.google.com/maps/search/?api=1&query=Shraddha%20Xerox&query_place_id=ChIJl28Q8rmFXjkRBJBRqPAIm9s	2025-08-15 14:13:21.029+00	2025-08-15 14:13:21.029+00
13	13	Shree Umiya Xerox	shree-umiya-xerox	શ્રી ઉમિયા ઝેરોક્સ	Ahmedabad	0	380008	9898581713	Shree Umiya Owner	Shree Umiya Xerox	Shree Umiya Owner	shreeumiya@printeasyqr.com	9898581713	4, Gopal Complex, Krishna Bagh Cross Road, Maninagar, Mani Nagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqzHs1ZoN2LgqaGnzNobENtv7kNwyDIXSVKrr4PE_aP2gbE4HRynz-WLoXF5HNdfrbixsk3qeGD21fdKlOVgw09RoDGd6qbQPitTU8M-soLcbyT64yTZ-Pjak5Ivs9qj4_5V7X0=w408-h906-k-no	https://www.google.com/maps/search/?api=1&query=Shree%20Umiya%20Xerox&query_place_id=ChIJ_____8KFXjkRJ7f2HdaAxIo	2025-08-15 14:13:22.332+00	2025-08-15 14:13:22.332+00
14	14	Mahakali Xerox	mahakali-xerox	2HR8+4RM, Mahakali Xerox Sundhiya, Gam, Vadnagar, Gujarat 384355, India	Vadnagar, Ahmedabad	Gujarat	384355	7359105661	Mahakali Owner	Mahakali Xerox	Mahakali Owner	mahakali@printeasyqr.com	7359105661	2HR8+4RM, Mahakali Xerox Sundhiya, Gam, Vadnagar, Gujarat 384355, India	["Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4npL8E6Cgd0JH8iua4BjLfeS1vQxWzAOutyY3cPJyuUKRNIITyMOlZo95i3LomZDQvYaEkAHhfCMy_Z_S2WLJfQHHg7dgeF5vWLbCFqu85vlQKmIpH2jdeqscFTMz-fO8KzB5tXGVQ=w408-h725-k-no	https://www.google.com/maps/search/?api=1&query=Mahakali%20Xerox&query_place_id=ChIJu78SbQeFXjkRbwFwUSXI4xI	2025-08-15 14:13:23.639+00	2025-08-15 14:13:23.639+00
15	15	Radhe xerox	radhe-xerox	રાધે ઝેરોક્સ	Ahmedabad	Gujarat	380014	9328888112	Radhe Owner	Radhe xerox	Radhe Owner	radhe@printeasyqr.com	9328888112	2HR9+P3C, Ghanshyam Avenue, opp. C U Shah college, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrB8EOonDewJbw7FNaNlY-e_H76LIVKkBnA2hVS80YxQCH5MslmTV7nz4UfYNyQaw-qn_hW7d1B5qaahbZi24KQL_ViJMkSLkqJLphAyBaqlYhTNwHWGpPJBSBQ_X6fgM4Kn10S=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Radhe%20xerox&query_place_id=ChIJGTeMErKFXjkRK4-lml7ajqA	2025-08-15 14:13:24.941+00	2025-08-15 14:13:24.941+00
16	16	Meet Xerox	meet-xerox	મિત ઝેરોક્સ	Ahmedabad	Gujarat	380014	9979038192	Meet Owner	Meet Xerox	Meet Owner	meet@printeasyqr.com	9979038192	Auda Complex, Municipal Market, 39, Ashram Rd, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop", "Typing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOBTNHx95Soj-YUQhHph5Z5btXg3CnwxzDQUSGz=w408-h543-k-no	https://www.google.com/maps/search/?api=1&query=Meet%20Xerox&query_place_id=ChIJS_bP1WOEXjkRcoEbRFuZtUY	2025-08-15 14:13:26.239+00	2025-08-15 14:13:26.239+00
17	17	Swastik Xerox	swastik-xerox	Anupam Complex, Swastik Cross Road, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9375946635	Swastik Owner	Swastik Xerox	Swastik Owner	swastik@printeasyqr.com	9375946635	Anupam Complex, Swastik Cross Road, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipPYunnKMLTgMsDDKckTSff9CawvSoh5X0_naea0=w427-h240-k-no	https://www.google.com/maps/search/?api=1&query=Swastik%20Xerox&query_place_id=ChIJc_wpOfOEXjkRAyrdBm1_RJU	2025-08-15 14:13:27.542+00	2025-08-15 14:13:27.542+00
18	18	NAVRANG XEROX	navrang-xerox	112, Samapann Complex, opposite Havmor Restaurant, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879152329	NAVRANG Owner	NAVRANG XEROX	NAVRANG Owner	navrang@printeasyqr.com	9879152329	112, Samapann Complex, opposite Havmor Restaurant, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMJbATlp0wLrrzHV6xA-txrUCs6vxqcdHOuXTFx=w408-h533-k-no	https://www.google.com/maps/search/?api=1&query=NAVRANG%20XEROX&query_place_id=ChIJ4VEYXQeFXjkR_NMOAdUQxJo	2025-08-15 14:13:28.84+00	2025-08-15 14:13:28.84+00
20	20	Urgent Thesis { Shree Krishna xerox }	urgent-thesis-shree-krishna-xerox-	Oxford Avenue, A-22, Ashram Rd, opp. Cu Shah Commerce College, Chaitanya Nagar, Navrangpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9924032032	Urgent Thesis { Shree Krishna  } Owner	Urgent Thesis { Shree Krishna xerox }	Urgent Thesis { Shree Krishna  } Owner	urgentthesisshreekri@printeasyqr.com	9924032032	Oxford Avenue, A-22, Ashram Rd, opp. Cu Shah Commerce College, Chaitanya Nagar, Navrangpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "20:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nplD0mHdyFhGQPzQ40xMdUbpy_KQlklbknV41NXfYzHZW49NcumnHI74Ac5llhR0W70DuhQbEEuZUDtZWXgJeaQlWy3NVdzPIzMMXp8gBC9n7EKXZz60-Mcmp0a0aPHjgn0HU4j=w408-h723-k-no	https://www.google.com/maps/search/?api=1&query=Urgent%20Thesis%20%7B%20Shree%20Krishna%20xerox%20%7D&query_place_id=ChIJ0xurko6EXjkReTvk-o4lnMU	2025-08-15 14:13:31.433+00	2025-08-15 14:13:31.433+00
21	21	Patel Stationers & Xerox	patel-stationers-xerox	પટેલ સ્ટેશનર્સ & ઝેરોક્સ	Ahmedabad	Gujarat	380009	9426286695	Patel Stationers & Owner	Patel Stationers & Xerox	Patel Stationers & Owner	patelstationers@printeasyqr.com	9426286695	G F 1, Piyuraj Complex, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Computer store", "Stationery store", "Office supply store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqhWJy5HBm-REJUbJWexdOyUJqj0j4VTzNnF242DZLfMDKkIqGzE9EWUflWs_huJRbkVbXbWA0zOYDO6qj1WEqm86GRYquAr-GM9q5Jxbj6HovTjRCJRknCiHhx2Kp3BB2EjsuL=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Patel%20Stationers%20%26%20Xerox&query_place_id=ChIJmaIna_OEXjkRkd5dnfgb5r0	2025-08-15 14:13:32.73+00	2025-08-15 14:13:32.73+00
22	22	SONAL XEROX	sonal-xerox-1	સોનલ ઝેરોક્સ	Ahmedabad	Gujarat	380009	9016738268	SONAL Owner	SONAL XEROX	SONAL Owner	sonal@printeasyqr.com	9016738268	Anupam-2 Swastik Char Rasta, B-2, Commerce College Rd, below Jain Dairy, opp. Fairdeal house, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Banner store", "Commercial printer", "Copy shop", "Custom label printer", "Lamination service", "Map store", "Offset printing service", "Digital printing service", "Vinyl sign shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqNr2ayXfmZv6bzhM3I40GJar6VgcCqLYd6kzviMVZ-mRVtCTd6twDLiCTj9QGFbcJV3wzoE_d6B97coPgPQNXOhKzauYV7WsWuOu34nhOt6ojMS2FATwVMrNIJcJhSUEwFMNs=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=SONAL%20XEROX&query_place_id=ChIJ6TxhOfOEXjkRgqHBlgSSQmk	2025-08-15 14:13:34.465+00	2025-08-15 14:13:34.465+00
34	34	Dev Copy	dev-copy	દેવ કૉપિ	Ahmedabad	0	380013	9924349653	Dev Owner	Dev Copy	Dev Owner	dev@printeasyqr.com	9924349653	19-20, Vishwa Kosh Marg, Shanti Nagar, Usmanpura, Ahmedabad, Gujarat 380013, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "17:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4npgFfxrCrta2Xxq2VCkA4p7omXPdNi9p_abuD4RGpsXv6pV1528ysuFSixQuft_57YklPWXc0-d4CTRHxGBGnB4Y8hzoOhE_wrR0raEQolOJ33Kdq6UmqglgUjJCF01YY4vlms3=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Dev%20Copy&query_place_id=ChIJF-bYLoiEXjkRhmMBh_GgXHs	2025-08-15 14:13:51.141+00	2025-08-15 14:13:51.141+00
23	23	SONAL XEROX - Shreyas Colony, Navrangpura	sonal-xerox-2	સોનલ ઝેરોક્ષ	Ahmedabad	Gujarat	380008	9879425285	SONAL Owner	SONAL XEROX	SONAL Owner	sonal@printeasyqr.com	9879425285	14/15, Swastik Super Market, Sales India Lane, 14/15, Ashram Rd, Navrangpura, Ahmedabad, Gujarat 380008, India	["Copy shop", "Commercial printer", "Digital printer", "Digital printing service", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrlrx-D8acmkyeo9x49RJoCvn2RHk5V2-TLRE1K6rQN_Jt4dgjB9L0gjTnr0QrWj532yAXTWTal61wDOYeJB7RnPd2OBp0k4IQqbwfJI0fOqgK6jXqC1UtooLHjSh1QEK5fbUEy=w408-h272-k-no	https://www.google.com/maps/search/?api=1&query=SONAL%20XEROX&query_place_id=ChIJewBWjfaEXjkRtoEmPi6b3-4	2025-08-15 14:13:36.841+00	2025-08-15 14:13:36.841+00
24	24	Krishna xerox	krishna-xerox	Ajanta chamber, Income tax circle, opposite GUJARAT VIDYAPITH, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9624442094	Krishna Owner	Krishna xerox	Krishna Owner	krishna@printeasyqr.com	9624442094	Ajanta chamber, Income tax circle, opposite GUJARAT VIDYAPITH, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNkVk8_utBxSpgH4CmFqEX9TL64ESgp87H-_K0O=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Krishna%20xerox&query_place_id=ChIJS97VmKCFXjkRgwGHmD22DXE	2025-08-15 14:13:38.146+00	2025-08-15 14:13:38.146+00
25	25	Khushboo Xerox	khushboo-xerox	ખુશ્બૂ ઝેરોક્સ	Ahmedabad	Gujarat	380009	7600503830	Khushboo Owner	Khushboo Xerox	Khushboo Owner	khushboo@printeasyqr.com	7600503830	G7,G7/A,C9, Liberty Complex, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOYLl1CrnYvZvWkt3vpU31McMKwDv0pVRZbPg2R=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Khushboo%20Xerox&query_place_id=ChIJX9otKnWFXjkR-IykARrm3Ig	2025-08-15 14:13:39.444+00	2025-08-15 14:13:39.444+00
26	26	VEERTI XEROX AND STATIONERY	veerti-xerox-and-stationery	3,G/F, Narnarayan Complex, Navrangpura Rd, near Swastik Char Rasta, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9825053503	VEERTI  AND STATIONERY Owner	VEERTI XEROX AND STATIONERY	VEERTI  AND STATIONERY Owner	veertiandstationery@printeasyqr.com	9825053503	3,G/F, Narnarayan Complex, Navrangpura Rd, near Swastik Char Rasta, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "16:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOqjIf8ipV3-Kk4SZ882QCwbMjyRoq3jy3pvZqV=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=VEERTI%20XEROX%20AND%20STATIONERY&query_place_id=ChIJR4ozm_SEXjkRBlRlE86YbaI	2025-08-15 14:13:40.741+00	2025-08-15 14:13:40.741+00
27	27	Star Xerox	star-xerox	22, AUDA Office, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9898253080	Star Owner	Star Xerox	Star Owner	star@printeasyqr.com	9898253080	22, AUDA Office, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop", "Store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=QkiJyWcE1IJKpfexbIB9xA&cb_client=search.gws-prod.gps&w=408&h=240&yaw=88.910736&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Star%20Xerox&query_place_id=ChIJ70Mkpe2FXjkRGpuZKi9tDYU	2025-08-15 14:13:42.042+00	2025-08-15 14:13:42.042+00
28	28	Vijay Xerox	vijay-xerox	વિજય ઝેરોક્સ	Ahmedabad	Gujarat	380007	7926574506	Vijay Owner	Vijay Xerox	Vijay Owner	vijay@printeasyqr.com	7926574506	National Chamber, Ashram Rd, near City Gold Cinema, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=jAYIcrMI_6GkAxR01SM1rQ&cb_client=search.gws-prod.gps&w=408&h=240&yaw=264.7921&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Vijay%20Xerox&query_place_id=ChIJ_9cleXeEXjkRMbXix_6fQzQ	2025-08-15 14:13:43.354+00	2025-08-15 14:13:43.354+00
29	29	Harish Duplicators (Rubber Stamp & Xerox Store)	harish-duplicators-rubber-stamp-xerox-store	Siddharth Complex, 2-3/A, Ashram Rd, near Dinesh Hall, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9913370932	Harish Duplicators (Rubber Stamp &  ) Owner	Harish Duplicators (Rubber Stamp & Xerox Store)	Harish Duplicators (Rubber Stamp &  ) Owner	harishduplicatorsrub@printeasyqr.com	9913370932	Siddharth Complex, 2-3/A, Ashram Rd, near Dinesh Hall, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Lamination service", "Rubber stamp store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipM7GFhbYfv_wttsYv19dMJnSwhTz2Q33vyIX3Gq=w420-h240-k-no	https://www.google.com/maps/search/?api=1&query=Harish%20Duplicators%20(Rubber%20Stamp%20%26%20Xerox%20Store)&query_place_id=ChIJef_Z51-EXjkR6p9tOXXaJg8	2025-08-15 14:13:44.654+00	2025-08-15 14:13:44.654+00
30	30	Radhe Graphics and Printing, Naranpura, Ahmedabad I Xerox, Offset printer, Visiting Card, Brochure, envelope, flyer printing	radhe-graphics-and-printing-naranpura-ahmedabad-i-	રાધે ગ્રાફિક્સ અને પ્રિન્ટિંગ	Ahmedabad	Gujarat	380013	9825744288	Radhe Graphics and Printing, Naranpura, Ahmedabad I , Offset printer, Visiting Card, Brochure, envelope, flyer printing Owner	Radhe Graphics and Printing, Naranpura, Ahmedabad I Xerox, Offset printer, Visiting Card, Brochure, envelope, flyer printing	Radhe Graphics and Printing, Naranpura, Ahmedabad I , Offset printer, Visiting Card, Brochure, envelope, flyer printing Owner	radhegraphicsandingn@printeasyqr.com	9825744288	FF-5, Char Rasta, Shopping Villa, nr. Super Bazar, Sundar Nagar, Naranpura, Ahmedabad, Gujarat 380013, India	["Print shop", "Digital printer", "Graphic designer", "Offset printing service", "Screen printer", "Sticker manufacturer"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipM1VViaaoPyjqRNnQx2Z6f2t0BzHIOULJSsJiJD=w426-h240-k-no	https://www.google.com/maps/search/?api=1&query=Radhe%20Graphics%20and%20Printing%2C%20Naranpura%2C%20Ahmedabad%20I%20Xerox%2C%20Offset%20printer%2C%20Visiting%20Card%2C%20Brochure%2C%20envelope%2C%20flyer%20printing&query_place_id=ChIJq6qqqp2EXjkRHQIrP7lYPUo	2025-08-15 14:13:45.95+00	2025-08-15 14:13:45.95+00
31	31	Dheeraa Prints - Xerox	dheeraa-prints-xerox	Shop No. 5, Kamdhenu Complex, Commerce Six Rd, opp. Samved Hospital, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	0	380009	8128494821	Dheeraa  - Owner	Dheeraa Prints - Xerox	Dheeraa  - Owner	dheeraa@printeasyqr.com	8128494821	Shop No. 5, Kamdhenu Complex, Commerce Six Rd, opp. Samved Hospital, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:30"}, "monday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:30"}, "saturday": {"isOpen": false}, "thursday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:30"}, "wednesday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNisXQZtZO5v5i5x9SeXfYJzXYXvQVrnSOeTGCb=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Dheeraa%20Prints%20-%20Xerox&query_place_id=ChIJ6-DAEQmFXjkRIXJ72b9677g	2025-08-15 14:13:47.246+00	2025-08-15 14:13:47.246+00
32	32	Girish Xerox And Stationery	girish-xerox-and-stationery	ગિરીશ ઝેરોક્ષ અને સ્ટેશનરી	Ahmedabad	0	380014	9725881188	Girish  And Stationery Owner	Girish Xerox And Stationery	Girish  And Stationery Owner	girishandstationery@printeasyqr.com	9725881188	7, nr. Swastik School, opp. Maharshi Complex, Bharat Colony, Sardar Patel Colony, Navjivan, Ahmedabad, Gujarat 380014, India	["Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMzEsjLwnsH3WXR6dUR_Z2UCwLslCouWuTB2xsI=w408-h680-k-no	https://www.google.com/maps/search/?api=1&query=Girish%20Xerox%20And%20Stationery&query_place_id=ChIJ24-32IiEXjkREtWUNBY2SYM	2025-08-15 14:13:48.544+00	2025-08-15 14:13:48.544+00
33	33	H.P. Xerox	hp-xerox	હ.પ. ઝેરોક્સ	Ahmedabad	0	380014	9998761976	H.P. Owner	H.P. Xerox	H.P. Owner	hp@printeasyqr.com	9998761976	Vidya Vihar Colony Rd, near Hotel Fortune Landmark, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4npGRIZ9os7Tp2HaKtsCULvzU-oIdP8SX46DEbAV2tP8captgMhzi9tBUEfL1XatGgrG-tJcq2iPKOvd_BbLKp25lQqDXRnpjPFB6DQdKJhsH4uZbmFmhFPqyLVOMuiRHS6hWwzC=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=H.P.%20Xerox&query_place_id=ChIJW_ZhuGOEXjkRz6oAlRUUNyc	2025-08-15 14:13:49.846+00	2025-08-15 14:13:49.846+00
35	35	shivanya digital	shivanya-digital	Shop No, 4, Center, Deepawali Complex, Opp, Old High Ct Rd, nr. Income Tex, Ashram Road, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	0	380014	9601656698	shivanya Owner	shivanya digital	shivanya Owner	shivanya@printeasyqr.com	9601656698	Shop No, 4, Center, Deepawali Complex, Opp, Old High Ct Rd, nr. Income Tex, Ashram Road, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNTMf3TuYmq2ufXUODlYjpEyhV-9iWtDOvDJS6_=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=shivanya%20digital&query_place_id=ChIJby0gB1WFXjkRkPISewKZtSo	2025-08-15 14:13:52.438+00	2025-08-15 14:13:52.438+00
36	36	Shardul Printing Press	shardul-printing-press	શાર્દુલ છાપખાનું	Ahmedabad	0	380014	7935662235	Shardul Printing Press Owner	Shardul Printing Press	Shardul Printing Press Owner	shardulingpress@printeasyqr.com	7935662235	Basement, Rambha Complex, Income Tax Circle, Ashram Rd, opposite Gujarat Vidyapith Road, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "19:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNJU7LD2JglwtWRiB-0-zn4G8zQn2IyHA6jbT6E=w408-h656-k-no	https://www.google.com/maps/search/?api=1&query=Shardul%20Printing%20Press&query_place_id=ChIJef_Z51-EXjkRDxNCqapXDVA	2025-08-15 14:13:53.736+00	2025-08-15 14:13:53.736+00
37	37	Precious Business Systems	precious-business-systems	પ્રિસિયસ બિઝનેસ સિસ્ટમ્સ	Ahmedabad	0	380009	8511121069	Precious Business Owner	Precious Business Systems	Precious Business Owner	preciousbusiness@printeasyqr.com	8511121069	201, Sunrise Avenue Opp Kailash Tower Nr jain Temple Stadium Circle, To, Commerce College Rd, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Copier repair service", "Printing equipment supplier", "Office equipment supplier"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNWDbxD1lQ8zo4DjJV-gOA4j5sz4mrCS7HkB6jL=w408-h725-k-no	https://www.google.com/maps/search/?api=1&query=Precious%20Business%20Systems&query_place_id=ChIJ____P_WEXjkRzAknCl44jPc	2025-08-15 14:13:55.032+00	2025-08-15 14:13:55.032+00
38	38	my print solutions	my-print-solutions	C27 gr, floor, SUMEL BUSINESS PARK-6, Dudheshwar Rd, Dudheshwar, Ahmedabad, Gujarat 380004, India	Ahmedabad	0	380004	9824410066	my Owner	my print solutions	my Owner	myolutions@printeasyqr.com	9824410066	C27 gr, floor, SUMEL BUSINESS PARK-6, Dudheshwar Rd, Dudheshwar, Ahmedabad, Gujarat 380004, India	["Print shop", "Lamination service", "Printing equipment supplier", "Printer repair service", "Toner cartridge supplier"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNFU809OAZ76Cz4m0CDabteBeF3BHZtzpsvURr9=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=my%20print%20solutions&query_place_id=ChIJNz22fJaFXjkRV2UMnnEYo1k	2025-08-15 14:13:56.33+00	2025-08-15 14:13:56.33+00
39	39	Shreeji Copiers & Stationers	shreeji-copiers-stationers	શ્રીજી કોપિયર્સ & સ્ટેશનર્સ	Ahmedabad	0	380009	9824032153	Shreeji Copiers & Stationers Owner	Shreeji Copiers & Stationers	Shreeji Copiers & Stationers Owner	shreejicopiersstatio@printeasyqr.com	9824032153	Ground Floor - 1, Omkar House, Behind Femina Town, Near Swastik Char Rasta, Chimanlal Girdharlal Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4noKMdiGV2dW0l-KSVyXFWWpF0tizMX7aCjUP8qy6HoeL0PpR3OZloNSdEuMcvZkVhfFM07AzRhewj4awjE4FibTrqqJwE5g16kfUuXlAlXPnIGquxGAq8Nyq0SZpEJXdUeU-hA=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Shreeji%20Copiers%20%26%20Stationers&query_place_id=ChIJMecFsvSEXjkRkzQsYVaA6F8	2025-08-15 14:13:57.636+00	2025-08-15 14:13:57.636+00
40	40	Ambika Xerox	ambika-xerox	અંબિકા ઝેરોક્સ	Ahmedabad	Gujarat	380008	9998880683	Ambika Owner	Ambika Xerox	Ambika Owner	ambika@printeasyqr.com	9998880683	XJR7+9G9, Near Daxini Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "monday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "sunday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "saturday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "thursday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}, "wednesday": {"isOpen": true, "openTime": "08:30", "closeTime": "14:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=jLcAa9KwANnQy84olRxnMw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=46.257473&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Ambika%20Xerox&query_place_id=ChIJWUgUa-KFXjkRugEcXtz6RyA	2025-08-15 14:13:58.933+00	2025-08-15 14:13:58.933+00
41	41	Umiya Xerox And Stationeries	umiya-xerox-and-stationeries	ઉમિયા ઝેરોક્સ એન્ડ સ્ટેશનરીઝ	Ahmedabad	Gujarat	380008	9898766956	Umiya  And Stationeries Owner	Umiya Xerox And Stationeries	Umiya  And Stationeries Owner	umiyaandstationeries@printeasyqr.com	9898766956	B-36,Radhe Shopping, Khokhra Cir, G I D C Industrial Area, Ahmedabad, Gujarat 380008, India	["Copy shop", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "08:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-proxy/ALd4DhEgfnuu3sES2GlJJIpMNuYM2fgcGp-kg2pUXeEkTmWDdG_JV1W-dFdGYdQ2WTYsJj91rHLgTmoRFC0tyKGvTwT0rKlkvlFRqfd_FVCGTDtEsnYHCYXZfJCamLKpoHeClNJvJSsNq6Mx6mrjhotrg3MFqzkPhqFHWO85dn2oGxBWCikjRjY5eSJGfEo_dF8f9K5T4dE=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Umiya%20Xerox%20And%20Stationeries&query_place_id=ChIJnTdSRnSGXjkRHeCX8YyQj38	2025-08-15 14:14:00.236+00	2025-08-15 14:14:00.236+00
42	42	New Maheshwari Copiers	new-maheshwari-copiers	ન્યુ મહેશ્વરી કોપિયર્સ	Ahmedabad	Gujarat	380008	9510686265	New Maheshwari Copiers Owner	New Maheshwari Copiers	New Maheshwari Copiers Owner	newmaheshwaricopiers@printeasyqr.com	9510686265	5, Muktajiwan Estate, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipPdbkjICLG4HUHRljosH9o3MdyYRFzWJcoEomjk=w426-h240-k-no	https://www.google.com/maps/search/?api=1&query=New%20Maheshwari%20Copiers&query_place_id=ChIJIXv1_eCFXjkRmM-lGT8mauw	2025-08-15 14:14:01.535+00	2025-08-15 14:14:01.535+00
43	43	Swastik Xerox - Dharnidhar Society, Lavanya Society, Vasna	swastik-xerox-1	Shop No -1upper, Leval Tempal, Dharnidhar Derasar, Dharnidhar Cross Rd, Dharnidhar Society, Lavanya Society, Vasna, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9426189957	Swastik Owner	Swastik Xerox	Swastik Owner	swastik@printeasyqr.com	9426189957	Shop No -1upper, Leval Tempal, Dharnidhar Derasar, Dharnidhar Cross Rd, Dharnidhar Society, Lavanya Society, Vasna, Ahmedabad, Gujarat 380007, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipPzWZtNal0bdCazvXlkN5aOx_KJzkGyE_F9vvP5=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Swastik%20Xerox&query_place_id=ChIJO21ooQuFXjkRT9MlLq1l-n4	2025-08-15 14:14:03.497+00	2025-08-15 14:14:03.497+00
44	44	Sanjay Telecom Xerox	sanjay-telecom-xerox	સંજય ટેલિકોમ ઝેરોક્સ	Ahmedabad	Gujarat	380007	9428601475	Sanjay Telecom Owner	Sanjay Telecom Xerox	Sanjay Telecom Owner	sanjaytelecom@printeasyqr.com	9428601475	51, Pankaj Society, Bhatta, Paldi, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "18:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqawkLSajkOx1izbm_m3y1f_uEwlbwsGQ6jpq9ir4-r4ToG9Dyy3BgfIJ0e8FGoE1DucEedVVmVm1BygjTU279KCwlhYVSEzMfoEwSzGnaM9x7JYwczpJ_VTaSUFEEYVYINzGx6jA=w425-h240-k-no	https://www.google.com/maps/search/?api=1&query=Sanjay%20Telecom%20Xerox&query_place_id=ChIJie7ttRqFXjkRVN2eI1O4oXM	2025-08-15 14:14:04.791+00	2025-08-15 14:14:04.791+00
45	45	Pooja Xerox	pooja-xerox	પૂજા ઝેરોક્ષ	Ahmedabad	0	380007	9662366071	Pooja Owner	Pooja Xerox	Pooja Owner	pooja@printeasyqr.com	9662366071	G.F.- 2, Vijay Complex, Near Vasna Bus Stand, Vasna Rd, Pravinnagar, Vasna, Ahmedabad, Gujarat 380007, India	["Copy shop", "Lamination service", "Payphone"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=OKHzjxZ_L73X8Sva5jb8cw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=0.95794755&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Pooja%20Xerox&query_place_id=ChIJSRuNWBeFXjkRHdY-4aahsYM	2025-08-15 14:14:06.089+00	2025-08-15 14:14:06.089+00
51	51	Kunal Xerox	kunal-xerox	કુણાલ ઝેરોક્ષ	Ahmedabad	Gujarat	380009	7926462020	Kunal Owner	Kunal Xerox	Kunal Owner	kunal@printeasyqr.com	7926462020	Near Standard Chartered Bank, Navrangpura, Mithakhali Six Rd, Mithakhali, Ellisbridge, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "18:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrvZA-HnTlLNYlhK9wrGfJcVWg20RFmAtkU_rH8xvHYmmeZSNpXzofX2SZb5C49iMfZp-3MFHWeY1tasH1EgZG7V4Pxqcn6B7V7pd-c6-XuaBdw8-LviCHlWhdStW_gI8S3zrFD=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Kunal%20Xerox&query_place_id=ChIJe52MuvaEXjkRzUN_VBYl5Do	2025-08-15 14:14:13.865+00	2025-08-15 14:14:13.865+00
46	46	Saloni Enterprise Stationary and Xerox Ro plant Sales & service	saloni-enterprise-stationary-and-xerox-ro-plant-sa	સલોની એન્ટરપ્રાઈઝ સ્ટેશનરી એન્ડ ઝેરોક્સ રો પ્લાન્ટ સેલ્સ & સર્વિસ	Ahmedabad	0	380007	9909890907	Saloni  Stationary and  Ro plant Sales & Owner	Saloni Enterprise Stationary and Xerox Ro plant Sales & service	Saloni  Stationary and  Ro plant Sales & Owner	salonistationaryandr@printeasyqr.com	9909890907	Shop No - 16,G/F Swaminarayan Park 2, NR. Popular Wheelar Service B/H. G.B, shah College, Vasna, Ahmedabad, Gujarat 380007, India	["Print shop", "Pen store", "Water purification company", "Water treatment supplier"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqLaNiMSe566nYDPv26lL_VyADAgkSe25RIDMBmnBE94KO54JdiGCu_ijN4r6-JRXDaNm0QrbP93ZwPlZ8So2YFIOl9BS0n4qBiyx4J3ah8MZsUgpasm7FcvcR8i5_KNzqhULS27w=w408-h886-k-no	https://www.google.com/maps/search/?api=1&query=Saloni%20Enterprise%20Stationary%20and%20Xerox%20Ro%20plant%20Sales%20%26%20service&query_place_id=ChIJs-0URBiFXjkRgPgOPXZC16I	2025-08-15 14:14:07.384+00	2025-08-15 14:14:07.384+00
54	54	Shree Hari Xerox	shree-hari-xerox	શ્રી હારી ઝેરોક્સ	Ahmedabad	Gujarat	380001	6353674054	Shree Hari Owner	Shree Hari Xerox	Shree Hari Owner	shreehari@printeasyqr.com	6353674054	Dhanlaxmi Market,, Relief Rd, Revdi Bazar, Kalupur, Ahmedabad, Gujarat 380001, India	["Copy shop", "Copying supply store", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "11:00", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=9o2IqgyNK2fNPeAw0n31bw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=196.40822&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Shree%20Hari%20Xerox&query_place_id=ChIJbSPzITGEXjkRbesm6GsPlXE	2025-08-15 14:14:17.774+00	2025-08-15 14:14:17.774+00
47	47	Giriraj Copier	giriraj-copier	ગિરિરાજ કોપિયર	Ahmedabad	0	380007	8866662269	Giriraj Copier Owner	Giriraj Copier	Giriraj Copier Owner	girirajcopier@printeasyqr.com	8866662269	Shop No 8, Sambhavtirth Shopping Centre, Vasna, Ahmedabad, Gujarat 380007, India	["Copy shop", "Banner store", "Income tax help association", "Lamination service", "Notary public", "Passport agent", "Passport photo processor", "Rubber stamp store", "Vinyl sign shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMzeP2ajK2dH4HWmQi449hjoCorZEKKW5imF00O=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Giriraj%20Copier&query_place_id=ChIJ7XX8qReFXjkR6S9AXunz1SE	2025-08-15 14:14:08.679+00	2025-08-15 14:14:08.679+00
48	48	Chaitanya Xerox	chaitanya-xerox	ચૈતન્ય ઝેરોક્સ	Ahmedabad	Gujarat	380007	9687507001	Chaitanya Owner	Chaitanya Xerox	Chaitanya Owner	chaitanya@printeasyqr.com	9687507001	2, Hitek Centre, opposite Sanskar Kendra, Paldi, Paldi, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=j4NruUT0MQZoOuVgBiR52Q&cb_client=search.gws-prod.gps&w=408&h=240&yaw=192.62479&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Chaitanya%20Xerox&query_place_id=ChIJ_____wKFXjkRPLyC3_FDYTc	2025-08-15 14:14:09.976+00	2025-08-15 14:14:09.976+00
49	49	Mahavir Xerox and Stationery	mahavir-xerox-and-stationery	LL-2, Murlidhar Complex, Surendra Mangaldas Rd, beside Sunphoto, Patel Colony, Ambawadi, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9033222386	Mahavir  and Stationery Owner	Mahavir Xerox and Stationery	Mahavir  and Stationery Owner	mahavirandstationery@printeasyqr.com	9033222386	LL-2, Murlidhar Complex, Surendra Mangaldas Rd, beside Sunphoto, Patel Colony, Ambawadi, Ahmedabad, Gujarat 380015, India	["Copy shop", "Christmas store", "Dairy store", "Passport photo processor", "Photo lab", "Photography service", "Photography studio", "Print shop", "Stationery store", "Stationery wholesaler"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "00:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNub2NvjuNMy32VpzZ_tvos2YeHlbRClvCla7w0=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Mahavir%20Xerox%20and%20Stationery&query_place_id=ChIJ9W8tMRqFXjkRwuX0TX4B9WE	2025-08-15 14:14:11.276+00	2025-08-15 14:14:11.276+00
50	50	Gandhi Xerox	gandhi-xerox	ગાંધી ઝેરોક્ષ	Ahmedabad	Gujarat	380006	7228818844	Gandhi Owner	Gandhi Xerox	Gandhi Owner	gandhi@printeasyqr.com	7228818844	F-5,Sundar Gopal Complex,Ambawadi Circle,Ambawadi, Panchavati Rd, opposite centro mall, Panchavati Society, Gulbai Tekra, Ahmedabad, Gujarat 380006, India	["Digital printing service", "Bookbinder", "Digital printer", "Lamination service", "Offset printing service", "Print shop", "Screen printing shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipM8TCiLxsJqJdfJwOEiSApoHxgVb5Mc3Z4jxe7E=w408-h272-k-no	https://www.google.com/maps/search/?api=1&query=Gandhi%20Xerox&query_place_id=ChIJ____P_iEXjkRU9MlIW8vc9Y	2025-08-15 14:14:12.571+00	2025-08-15 14:14:12.571+00
52	52	Sony Xerox Center	sony-xerox-center	સોની ઝેરોક્ષ સેન્ટર	Ahmedabad	Gujarat	380001	9825801898	Sony Owner	Sony Xerox Center	Sony Owner	sony@printeasyqr.com	9825801898	Old City, Sarangpur, Sherkotda, Ahmedabad, Gujarat 380001, India	["Print shop", "Bookbinder", "Commercial printer", "Digital printer", "Drafting service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:30"}, "monday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:30"}, "sunday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:30"}, "saturday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:30"}, "thursday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:30"}, "wednesday": {"isOpen": true, "openTime": "08:30", "closeTime": "13:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOwVG5dIaFR8v17Fgl3skgnMium8KRaqRBNNJgH=w408-h500-k-no	https://www.google.com/maps/search/?api=1&query=Sony%20Xerox%20Center&query_place_id=ChIJxSGK9TSEXjkRwy0SUFPw39c	2025-08-15 14:14:15.17+00	2025-08-15 14:14:15.17+00
53	53	Classic Xerox & Online Multilink Services	classic-xerox-online-multilink-services	Shop no 8, Hathi Khai Rd, opp. Sheetal Cinema, Gomtipur Police Lines, Gomtipur, Ahmedabad, Gujarat 380021, India	Ahmedabad	Gujarat	380021	9638774406	Classic  & Online Multilink Owner	Classic Xerox & Online Multilink Services	Classic  & Online Multilink Owner	classiconlinemultili@printeasyqr.com	9638774406	Shop no 8, Hathi Khai Rd, opp. Sheetal Cinema, Gomtipur Police Lines, Gomtipur, Ahmedabad, Gujarat 380021, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOv_t0H-17jE9NcB9czSgFiBPbdojy5WEpho_wV=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Classic%20Xerox%20%26%20Online%20Multilink%20Services&query_place_id=ChIJPbMhzEKFXjkRw8Vu98l26Zs	2025-08-15 14:14:16.474+00	2025-08-15 14:14:16.474+00
55	55	Dharmendra Xerox	dharmendra-xerox	ધર્મેન્દ્ર ઝેરોક્સ	Ahmedabad	Gujarat	380018	7922921476	Dharmendra Owner	Dharmendra Xerox	Dharmendra Owner	dharmendra@printeasyqr.com	7922921476	2JJ4+2WG, Saraspur Rd, Opp. Ambedkar Hall, Saraspur, Ahmedabad, Gujarat 380018, India	["Copy shop", "Cosmetics store", "Payphone"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrlixZ7Am9fRPTSDCtTqYnh3c8hknTkbnvLV8bnkqOfUngD2lQlaKF72daBV_hGNxPQRldE5ANWAjwIYrY-aqbjTfv8A8j4V_5Fsl50Mwiy3hxTDgA_j2msOrqaAsNZ8tMCuLZd=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Dharmendra%20Xerox&query_place_id=ChIJmSAoES-EXjkR8mqwir7MJpU	2025-08-15 14:14:19.073+00	2025-08-15 14:14:19.073+00
56	56	New Mahakali Xerox- ₹1 per Page(Both Sides)	new-mahakali-xerox-1-per-pageboth-sides	Shop No 3, Basement, Jawahar Chowk, Jalaram Plaza, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9979504180	New Mahakali - ₹1 per Page(Both Sides) Owner	New Mahakali Xerox- ₹1 per Page(Both Sides)	New Mahakali - ₹1 per Page(Both Sides) Owner	newmahakali1perpageb@printeasyqr.com	9979504180	Shop No 3, Basement, Jawahar Chowk, Jalaram Plaza, Maninagar, Ahmedabad, Gujarat 380008, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipPtQRnbrtRkO_GoyO58wAYauYnbyBgjF5nFFE0e=w498-h240-k-no	https://www.google.com/maps/search/?api=1&query=New%20Mahakali%20Xerox-%20%E2%82%B91%20per%20Page(Both%20Sides)&query_place_id=ChIJVRtIE_eFXjkRnjGQI8-mrM0	2025-08-15 14:14:20.376+00	2025-08-15 14:14:20.376+00
57	57	VINAYAK PRINTS	vinayak-prints	વિનાયક પ્રિન્ટસ	Ahmedabad	3	380008	6353757677	VINAYAK Owner	VINAYAK PRINTS	VINAYAK Owner	vinayak@printeasyqr.com	6353757677	Natvar Flat, A-6, opp. Yamunaji Haveli, Bhaduat Nagar, Janpath Society, Bhadwatnagar, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printer", "Digital printing service", "Invitation printing service", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "13:30"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqKPudS6y85iog-JNmNPIlDdpAWm3coo4D8cc9yFjqm7QipfXDoiR7oA_83Y9cQO47_BCozBxlHavLkwiq8IshzJTS5znBQCexdwG9mCg926ZpBTH6ctI53Z8eEzpC6lAep7w0lvg=w408-h356-k-no	https://www.google.com/maps/search/?api=1&query=VINAYAK%20PRINTS&query_place_id=ChIJD7ObL-aFXjkR7gq4esuSD8k	2025-08-15 14:14:21.675+00	2025-08-15 14:14:21.675+00
58	58	KIRTI XEROX AND STATIONERY	kirti-xerox-and-stationery	G/3, Ravi Raj Avenue, nr. Parth Tower, Bhimjipura, Nava Vadaj, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9714113789	KIRTI  AND STATIONERY Owner	KIRTI XEROX AND STATIONERY	KIRTI  AND STATIONERY Owner	kirtiandstationery@printeasyqr.com	9714113789	G/3, Ravi Raj Avenue, nr. Parth Tower, Bhimjipura, Nava Vadaj, Ahmedabad, Gujarat 380013, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipN0YRUCnihk9KEJjs5qE1Zwv2VMW8EkxDXTVVQ-=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=KIRTI%20XEROX%20AND%20STATIONERY&query_place_id=ChIJK6ZpjpuDXjkRH_Dye7YAJl4	2025-08-15 14:14:22.978+00	2025-08-15 14:14:22.978+00
59	59	Jay Ambe Xerox	jay-ambe-xerox	જય અંબે ઝેરોક્સ	Ahmedabad	Gujarat	380013	9898089019	Jay Ambe Owner	Jay Ambe Xerox	Jay Ambe Owner	jayambe@printeasyqr.com	9898089019	17,G.F,Avani complex,Naranpura, Ahmedabad, Gujarat 380013, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "12:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=0hO0wpD-BevCDiXqGwY0RQ&cb_client=search.gws-prod.gps&w=408&h=240&yaw=262.09814&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Jay%20Ambe%20Xerox&query_place_id=ChIJM7Z5uJuEXjkR-dke6Hm4GUA	2025-08-15 14:14:24.273+00	2025-08-15 14:14:24.273+00
60	60	Jay Ambe Xerox and Stationary	jay-ambe-xerox-and-stationary	G-43 Shubh Complex Nr Rajasthan Hospital, Shahibag, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9898645689	Jay Ambe  and Stationary Owner	Jay Ambe Xerox and Stationary	Jay Ambe  and Stationary Owner	jayambeandstationary@printeasyqr.com	9898645689	G-43 Shubh Complex Nr Rajasthan Hospital, Shahibag, Ahmedabad, Gujarat 380004, India	["Copy shop", "Print shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMH_NUyS4UNxNZ2740kpKG-XBIkoaHIjPd--qhm=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Jay%20Ambe%20Xerox%20and%20Stationary&query_place_id=ChIJo4WoiQ2EXjkRn2uk3Mud_uU	2025-08-15 14:14:25.571+00	2025-08-15 14:14:25.571+00
61	61	Parshwanath Xerox Copy Centre	parshwanath-xerox-copy-centre	પાર્શ્વનાથ ઝેરોક્સ કોપી સેન્ટર	Ahmedabad	0	380013	9712602123	Parshwanath Owner	Parshwanath Xerox Copy Centre	Parshwanath Owner	parshwanath@printeasyqr.com	9712602123	3H46+P36, Hasmukh Colony, Vijaynagar Rd, Rang Jyot Society, Naranpura, Ahmedabad, Gujarat 380013, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=g6nsPS9j6Ef7e7wKIj3qtw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=74.657646&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Parshwanath%20Xerox%20Copy%20Centre&query_place_id=ChIJt2S4lYOEXjkRXhSbMtJ_RYU	2025-08-15 14:14:26.864+00	2025-08-15 14:14:26.864+00
62	62	Mahavir Xerox	mahavir-xerox	મહાવીર ઝેરોક્ષ	Ahmedabad	Gujarat	380009	7926400502	Mahavir Owner	Mahavir Xerox	Mahavir Owner	mahavir@printeasyqr.com	7926400502	Shreyas Complex, Bus Stop, 119, opposite Jain Derasar, nr. Navrangpura, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Office services"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nr1JN6CeaazVTMWXnOU8_yYIH6Wb7lUNhHjisOZ8fNodOLVC_HUiT1HpXSf__uHJxxeoY348y6jeE-wKhL0MtLNV7zoa41z_J0BVFKZyEuG5igqFVXvPJatYfGYdRevTnklHnLqGg=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Mahavir%20Xerox&query_place_id=ChIJ____P_WEXjkR7MZe65FztL8	2025-08-15 14:14:28.201+00	2025-08-15 14:14:28.201+00
63	63	Jalaram Xerox	jalaram-xerox	જલારામ ઝેરોક્ષ	Ahmedabad	Gujarat	380009	9898393221	Jalaram Owner	Jalaram Xerox	Jalaram Owner	jalaram@printeasyqr.com	9898393221	5, Ashwamegh Complex, Nr. Mithakhali Underbridge, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Computer accessories store", "Computer hardware manufacturer", "Copying supply store", "Lamination service", "Pen store", "Printing equipment supplier", "Stationery store", "Stationery wholesaler"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:00"}, "monday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "10:30", "closeTime": "19:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrAYWgKGqoDuSOeSe12JcpuWbUsjfxlejYtUTK0_ssDfS77aDxCmKQPlZBgHM1it2e3hAM276rpELD04kHxdTPZn1MjQx-uGrteMbjGTX4N3Y_4BjYb3O8Mm7E2XlDykeFV_Bgx=w408-h304-k-no	https://www.google.com/maps/search/?api=1&query=Jalaram%20Xerox&query_place_id=ChIJ9TK-NvaEXjkRmtRzLVCHySs	2025-08-15 14:14:29.497+00	2025-08-15 14:14:29.497+00
64	64	Khushboo Xerox - Vishalpur, Muslim Society, Navrangpura	khushboo-xerox-1	ખૂશબૂ ઝેરોક્ષ	Ahmedabad	Gujarat	380009	9879687795	Khushboo Owner	Khushboo Xerox	Khushboo Owner	khushboo@printeasyqr.com	9879687795	Bhavani Chambers, 1-2, Ashram Rd, near Times Of India Complex, opp. bahera munga school, Vishalpur, Muslim Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4no_iVDE-QELj6zoulhHzLaDpywzGKc1_XHZ1_uxWlCi7MpBkB1H9wdRwXkKN9jqVhG1H_IajeC40c6ck-GtFyCJQEEDYc1HVbgB-LXRG61k0wnvOfQbnMa50x9Z-HTjgQnSqVSH6A=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Khushboo%20Xerox&query_place_id=ChIJXdYtOV-EXjkRZwUI2R5kbKc	2025-08-15 14:14:31.442+00	2025-08-15 14:14:31.442+00
65	65	Jaya Xerox	jaya-xerox	જય ઝેરોક્સ	Ahmedabad	Gujarat	380015	9427621991	Jaya Owner	Jaya Xerox	Jaya Owner	jaya@printeasyqr.com	9427621991	Shop No.1-55, Shree Krishna Centre, Mithakhali Cir, near Vijaya Bank, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380015, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}, "tuesday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "08:30", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-proxy/ALd4DhEAjGfAfncv6aWDhE6qZC3xqucVhBNeATvrUYvE9tyXhVxHw5LxqhAbMupYEWMeq_I0vjSXMAlTfo022YhNvFTRXNnMSiBT8WQ3OYWP0OlVGjSOGHOZVhzNWOqopR4-wlSfDu1IWFVVTc2BST0DegWFG0JPix47Den0xBs42PLJWMlPflOAKO4duWTev_dmGn_2_w=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Jaya%20Xerox&query_place_id=ChIJJ8Q11vWEXjkRU9QDFPKDM4M	2025-08-15 14:14:32.761+00	2025-08-15 14:14:32.761+00
66	66	PATEL COLOUR XEROX	patel-colour-xerox	પટેલ રંગ લેબ પ્રાઇવેટ લિમિટેડ	Ahmedabad	Gujarat	380009	9824003564	PATEL COLOUR Owner	PATEL COLOUR XEROX	PATEL COLOUR Owner	patelcolour@printeasyqr.com	9824003564	12, Swastik Super Market , Opp. Popular House, Near R. Kumar Ashram Road Mill Officer's Colony, Income Tax, Ahmedabad, Gujarat 380009, India	["Copy shop", "Graphic designer", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipPj7LOsrRsg4p3Snz4EzQWtpfC0ma_p4SL1SAYj=w408-h240-k-no	https://www.google.com/maps/search/?api=1&query=PATEL%20COLOUR%20XEROX&query_place_id=ChIJ1VTzcGCEXjkRZrF5puAsxVA	2025-08-15 14:14:34.056+00	2025-08-15 14:14:34.056+00
67	67	Chaudhari Xerox	chaudhari-xerox	ચૌધરી ઝેરોક્સ	Ahmedabad	Gujarat	380006	7926406868	Chaudhari Owner	Chaudhari Xerox	Chaudhari Owner	chaudhari@printeasyqr.com	7926406868	2HH5+CVF, Opp Axis Bank, Near Samrtheshwar Mahadev, Law Garden, Samartheshwar Mahadev Rd, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Copy shop", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqhNomYiWJDpMC912Id0vSiu_ph_uTMC61NBfqT2jkDaBSykx80ap39ci-BK_3Hsp2r74ncCOB4dN3Jl6CBTQVqpLm2fv06W2bDzV9F7TDcXcbJGlgUzWJWes2rF-KMcAirBSo=w408-h443-k-no	https://www.google.com/maps/search/?api=1&query=Chaudhari%20Xerox&query_place_id=ChIJ1w4p7vCEXjkRoRIZhXY3nNg	2025-08-15 14:14:35.365+00	2025-08-15 14:14:35.365+00
68	68	Kutbi Xerox, Print and Lamination Shop	kutbi-xerox-print-and-lamination-shop	Kutbi Xerox, Mirzapur Road, opposite Mirzapur District Court, Ahmedabad, Gujarat 380001, India	Ahmedabad	0	380001	8487870611	Kutbi ,  and Lamination Owner	Kutbi Xerox, Print and Lamination Shop	Kutbi ,  and Lamination Owner	kutbiandlamination@printeasyqr.com	8487870611	Kutbi Xerox, Mirzapur Road, opposite Mirzapur District Court, Ahmedabad, Gujarat 380001, India	["Copy shop", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipN_GFC_KFfLq-AP5Vto2UmPcyPWndiUjtj9FJTA=w408-h408-k-no	https://www.google.com/maps/search/?api=1&query=Kutbi%20Xerox%2C%20Print%20and%20Lamination%20Shop&query_place_id=ChIJfR3QMUSEXjkRpQZXo66otIw	2025-08-15 14:14:36.661+00	2025-08-15 14:14:36.661+00
69	69	Rajesh Xerox	rajesh-xerox	રાજેશ ઝેરોક્સ	Ahmedabad	0	380006	9825699555	Rajesh Owner	Rajesh Xerox	Rajesh Owner	rajesh@printeasyqr.com	9825699555	UL-29, Samudra Complex, Above Saffron Hotel, C.G.Road, Saffron Hotel, Umashankar Joshi Marg, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380006, India	["Print shop", "Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4npSrAkKKO-z9sTSsOI_g_c2H1mCni-oXNGh3pFjjt7Nig-WSN9C5Vd7kOjxu4lLpmWIKTVxncAbwXZ3GIwIspjgNqCcEYGAj-U_HLqZS3eBpoMY4YZxzJBrv96xnbM9K7ZLtH5uMQ=w408-h725-k-no	https://www.google.com/maps/search/?api=1&query=Rajesh%20Xerox&query_place_id=ChIJVUp4Z0yEXjkRnppkVqPlrSE	2025-08-15 14:14:37.966+00	2025-08-15 14:14:37.966+00
70	70	New best Xerox	new-best-xerox	Shop no 10, Sahyog complex, Mirzapur Rd, near dinbai tower, Old City, Khanpur, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	6355065909	New best Owner	New best Xerox	New best Owner	newbest@printeasyqr.com	6355065909	Shop no 10, Sahyog complex, Mirzapur Rd, near dinbai tower, Old City, Khanpur, Ahmedabad, Gujarat 380001, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=DBFXr-SU5V4HWq-zXNv5fg&cb_client=search.gws-prod.gps&w=408&h=240&yaw=233.64984&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=New%20best%20Xerox&query_place_id=ChIJL64HEJmFXjkRS8kcYwqWkHw	2025-08-15 14:14:39.277+00	2025-08-15 14:14:39.277+00
71	71	VARDHMAN THE DIGITAL PRINT SHOP	vardhman-the-digital-print-shop	9, Suryodaya Complex, Chimanlal Girdharlal Rd, nr. Swastik Cross Road, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	0	380009	8866119119	VARDHMAN THE Owner	VARDHMAN THE DIGITAL PRINT SHOP	VARDHMAN THE Owner	vardhmanthehop@printeasyqr.com	8866119119	9, Suryodaya Complex, Chimanlal Girdharlal Rd, nr. Swastik Cross Road, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "16:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOZZDAbmG3F374zPn32JdtP7cJOMzjP0hjFmt1C=w408-h812-k-no	https://www.google.com/maps/search/?api=1&query=VARDHMAN%20THE%20DIGITAL%20PRINT%20SHOP&query_place_id=ChIJGfbE9AmFXjkRXJBVMavQEjM	2025-08-15 14:14:40.572+00	2025-08-15 14:14:40.572+00
72	72	Shree Padmavati Xerox Centre	shree-padmavati-xerox-centre	શ્રી પદ્માવતી ઝેરોક્ષ સેન્ટર	Ahmedabad	Gujarat	380009	7940041024	Shree Padmavati Owner	Shree Padmavati Xerox Centre	Shree Padmavati Owner	shreepadmavati@printeasyqr.com	7940041024	30, Ashmi Shopping Centre,Opposite Memnagar Fire Station,120 Feet Ring Road, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipNx5OJEJPc3cP44S-1vvU1hGc3GVC5pp_A6lxCH=w426-h240-k-no	https://www.google.com/maps/search/?api=1&query=Shree%20Padmavati%20Xerox%20Centre&query_place_id=ChIJFVVVFfWEXjkR9bt7dmxmTbU	2025-08-15 14:14:41.88+00	2025-08-15 14:14:41.88+00
73	73	Jalaram Xerox - Sarvottam Nagar Society, Navrangpura	jalaram-xerox-1	5, Theosophical Society, Vijay Cross Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879252177	Jalaram Owner	Jalaram Xerox	Jalaram Owner	jalaram@printeasyqr.com	9879252177	5, Theosophical Society, Vijay Cross Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "12:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4noNPW_p0qmyBSjBoqzlSL-NiL7qdtKQjyAqGjajo_zVASd-2U-WZULc9MkstB-QZNTdP9KITgHpWXvlkEy7c7vKcHyTZCAHvJDccx72lT-FXW2ZTP1AvfTIx1fGkkM-Goq1vVRZ=w426-h240-k-no	https://www.google.com/maps/search/?api=1&query=Jalaram%20Xerox&query_place_id=ChIJG9IDH0KFXjkREW60kdNBbFk	2025-08-15 14:14:43.822+00	2025-08-15 14:14:43.822+00
74	74	Shri Umiya Xerox	shri-umiya-xerox	શ્રી ઉમિયા ઝેરોક્સ	Ahmedabad	Gujarat	380009	9974984570	Shri Umiya Owner	Shri Umiya Xerox	Shri Umiya Owner	shriumiya@printeasyqr.com	9974984570	Dhara Complex, Drive In Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=mooy5ETWM4RlhUCslHHT4w&cb_client=search.gws-prod.gps&w=408&h=240&yaw=36.296722&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Shri%20Umiya%20Xerox&query_place_id=ChIJge7DnpaEXjkR_MVmxVVzMVw	2025-08-15 14:14:45.132+00	2025-08-15 14:14:45.132+00
75	75	Navkar Copiers	navkar-copiers	નવકાર કોપિયર્સ	Ahmedabad	0	380006	9726275475	Navkar Copiers Owner	Navkar Copiers	Navkar Copiers Owner	navkarcopiers@printeasyqr.com	9726275475	1, Devnandan Complex, Ashram Rd, opposite Sanyas, near M. J. Library, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Print shop", "Copier repair service", "Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqVtp86RL4Y4c3wr93RPRVvoqPf5smdbnsqXZQ2mQF7fFlWnMHff9YkhbXg-c8go_f5jzdnD9mrAy9ziJYizLa5V62fMAuVCxIkWKOg54f7VFF8MYAIIK3w5uHI2scOoQZoDiJ9=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Navkar%20Copiers&query_place_id=ChIJq_Nf91aEXjkRLO-qXBlZVuY	2025-08-15 14:14:46.426+00	2025-08-15 14:14:46.426+00
76	76	Khushboo Copiers	khushboo-copiers	ખુશ્બૂ કોપિયર્સ	Ahmedabad	1	380006	9228207149	Khushboo Copiers Owner	Khushboo Copiers	Khushboo Copiers Owner	khushboocopiers@printeasyqr.com	9228207149	Ankur Chambers, Opp. Hasubhai Chambers, Behind Town Hall, Surendra Mangaldas Rd, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Digital printer"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqv3o0Md9wFsB31zDCXlLXpktV58h0Usbfmkz3pLwMrOt24MBBDO597QigfprwP41K9A46xR5n4eJxfH6GSZLs_p3kn3WK9dG8JLUMTeA3cfn2QDG3G_r0kkQdN3BzpqUW5mbyt=w408-h724-k-no	https://www.google.com/maps/search/?api=1&query=Khushboo%20Copiers&query_place_id=ChIJYzB2eVaEXjkREUhA_iTPE3E	2025-08-15 14:14:47.724+00	2025-08-15 14:14:47.724+00
77	77	Honest Xerox	honest-xerox	Relief Arcade, Relief Rd, Patthar Kuva, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	Ahmedabad	0	380001	7600109894	Honest Owner	Honest Xerox	Honest Owner	honest@printeasyqr.com	7600109894	Relief Arcade, Relief Rd, Patthar Kuva, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4npRg-nBYi6cxfr1qpW1xCiY6enLZnhIEFimvd0GwUwzr5s0hi__TvTQt8pxVCd1PwX1G1KuUpVixrQg0ySmzWLOZp7MBh2ZbxnVp6EWctiRPtto2Gycph0JWDY1j0fioMdUoOKPqQ=w408-h903-k-no	https://www.google.com/maps/search/?api=1&query=Honest%20Xerox&query_place_id=ChIJ7e_3gh-FXjkRWp8RH_L2xQY	2025-08-15 14:14:49.023+00	2025-08-15 14:14:49.023+00
78	78	Raj Xerox	raj-xerox	1, Saroadar Patel Chambers, 1, near Natraj Hotel, opposite Treasury Office, Old City, Lal Darwaja, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	7383043404	Raj Owner	Raj Xerox	Raj Owner	raj@printeasyqr.com	7383043404	1, Saroadar Patel Chambers, 1, near Natraj Hotel, opposite Treasury Office, Old City, Lal Darwaja, Ahmedabad, Gujarat 380001, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Raj%20Xerox&query_place_id=ChIJn6TWVlCEXjkRzrbyjI7Xc64	2025-08-15 14:14:50.318+00	2025-08-15 14:14:50.318+00
79	79	Bhagvati Colour Xerox	bhagvati-colour-xerox	ભગવતી કલર ઝેરોક્સ	Ahmedabad	0	380009	9377773387	Bhagvati Colour Owner	Bhagvati Colour Xerox	Bhagvati Colour Owner	bhagvaticolour@printeasyqr.com	9377773387	2HP6+8XV, Navrangpura Rd, Opposite Narnarayan Complex, Shrimali Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-proxy/ALd4DhE1mr4oy5PLMJ9WUK2Ilv6gveYovpxOhE68b6Q9ZZgvUBnCVJT_yzQD9wU9bW-gScANc9TkirD-vuvm2Ke4JlE7SYn3m1-_IWq3qx9-NaXENYEe_RC8YLaNck6_QzZCq1U8wyDcZQPOSTDDKDYnP69J9ps3gdZrZAwk7CbYX9FYkXmgFv5b1xlQAiOBolWlu_RAdg=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Bhagvati%20Colour%20Xerox&query_place_id=ChIJ37aOhvSEXjkRViy4xhs4asI	2025-08-15 14:14:51.613+00	2025-08-15 14:14:51.613+00
80	80	CYBERA PRINT ART	cybera-print-art	સાયબર પ્રિન્ટ આર્ટ	Ahmedabad	3	380009	9898309897	CYBERA  ART Owner	CYBERA PRINT ART	CYBERA  ART Owner	cyberaart@printeasyqr.com	9898309897	G-3, Samudra Annexe, Near Girish Cold Drinks Cross Roads, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "19:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMSWUH-iPO_YXujnwhmtIxMCDgNlCapmc8dCRbM=w408-h288-k-no	https://www.google.com/maps/search/?api=1&query=CYBERA%20PRINT%20ART&query_place_id=ChIJrQPTMvKEXjkR1Xsyqg0OFHs	2025-08-15 14:14:52.91+00	2025-08-15 14:14:52.91+00
81	10	Thesis binding (radhe xerox)	thesis-binding-radhe-xerox	gate no.8, shop no.12, sachet 2, Netaji Rd, opp. GLS college, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7778844446	Thesis binding (radhe ) Owner	Thesis binding (radhe xerox)	Thesis binding (radhe ) Owner	thesisbindingradhe@printeasyqr.com	7778844446	gate no.8, shop no.12, sachet 2, Netaji Rd, opp. GLS college, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "19:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=EjCEFiU5DjevMhfMizyCqw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=16.235672&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Thesis%20binding%20(radhe%20xerox)&query_place_id=ChIJsxyR4pSFXjkRe9KCGZu23tg	2025-08-15 14:14:53.773+00	2025-08-15 14:14:53.773+00
82	81	Deepak Copiers And Printers	deepak-copiers-and-printers	Main Gate, opp. Gujarat College, Ellisbridge, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9723227227	Deepak Copiers And Printers Owner	Deepak Copiers And Printers	Deepak Copiers And Printers Owner	deepakcopiersanders@printeasyqr.com	9723227227	Main Gate, opp. Gujarat College, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOIoSr8iT0fzzlnk4MuFS87RXdY8usCwRPgFbv-=w408-h905-k-no	https://www.google.com/maps/search/?api=1&query=Deepak%20Copiers%20And%20Printers&query_place_id=ChIJ04JY55yFXjkRf8m8vYRJfWs	2025-08-15 14:14:55.069+00	2025-08-15 14:14:55.069+00
83	82	Kunal Print Pallet	kunal-print-pallet	કુણાલ પ્રિન્ટ પલ્લેટ	Ahmedabad	2	380009	9327081009	Kunal  Pallet Owner	Kunal Print Pallet	Kunal  Pallet Owner	kunalpallet@printeasyqr.com	9327081009	A1, Navrang Super Market, Bus Stand, Navrangpura Rd, opposite Navrangpura, Navarangpura Gam, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "07:00", "closeTime": "19:00"}, "monday": {"isOpen": true, "openTime": "07:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "07:00", "closeTime": "12:00"}, "tuesday": {"isOpen": true, "openTime": "07:00", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "07:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "07:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "07:00", "closeTime": "19:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOVq8hvj3EmXpqzXJYdY0orLMmORC480YbFjnt1=w408-h274-k-no	https://www.google.com/maps/search/?api=1&query=Kunal%20Print%20Pallet&query_place_id=ChIJ____P_WEXjkRkzDPNTa9hbM	2025-08-15 14:14:56.371+00	2025-08-15 14:14:56.371+00
84	83	Navkar prints	navkar-prints	નવકાર પ્રિન્ટસ	Ahmedabad	0	380009	9157749267	Navkar Owner	Navkar prints	Navkar Owner	navkar@printeasyqr.com	9157749267	Ground Floor, Swastik super Market, Ashram Rd, near Sales India, Mill Officer's Colony, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	["Digital printing service", "Commercial printer", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "13:30"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4no8DcrNfGXqTlmTr4zCz9p8gGLgp6d88W9ydSHde779VAeXW5wYUJKqEIW3t0wwZwqswnamw8DtE2SiMYCCGzidaHOcr8CBELaJjFA55o3rXdgBbVVqG8fmhEUvIDNYPvx35b8j=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Navkar%20prints&query_place_id=ChIJsZDumF-EXjkRU7THLjilzxE	2025-08-15 14:14:57.673+00	2025-08-15 14:14:57.673+00
85	84	Ideal Duplicating Bureau	ideal-duplicating-bureau	આદર્શ નકલ બ્યુરો	Ahmedabad	0	380001	7487052820	Ideal Duplicating Bureau Owner	Ideal Duplicating Bureau	Ideal Duplicating Bureau Owner	idealduplicatingbure@printeasyqr.com	7487052820	72, Sarvoday Commercial Centre, Near G.P.O, Salapose Rd, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	["Print shop", "Commercial printer", "Typing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=xUmIRQ2GtUGb8FF1rYfs3Q&cb_client=search.gws-prod.gps&w=408&h=240&yaw=181.63258&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Ideal%20Duplicating%20Bureau&query_place_id=ChIJVVVVpVGEXjkRIcZjpENu9xE	2025-08-15 14:14:58.968+00	2025-08-15 14:14:58.968+00
86	1	gujarat xerox - Rambagh, Maninagar	gujarat-xerox-2	ગુજરાત ઝેરોક્સ	Ahmedabad	Gujarat	380013	9375825148	gujarat Owner	gujarat xerox	gujarat Owner	gujarat@printeasyqr.com	9375825148	dhanlaxmi avenue, Nirant Cross Rd, near jawahar chowk, Rambagh, Maninagar, Ahmedabad, Gujarat 380013, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=A1IwW6uUPioSFVOXLXPcfw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=33.17099&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=gujarat%20xerox&query_place_id=ChIJ1yPB-OmFXjkR6F_aSjyZFLQ	2025-08-15 14:15:37.82+00	2025-08-15 14:15:37.82+00
87	2	Sonal Xerox - Panchvati Society, Daxini Society, Maninagar	sonal-xerox-3	સોનલ ઝેરોક્સ	Ahmedabad	Gujarat	380008	8905602840	Sonal Owner	Sonal Xerox	Sonal Owner	sonal@printeasyqr.com	8905602840	Mandir Complex, Gf2, Bhairavnath Rd, Opposite Jai Hind School, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMOEgOWrFEIiq5A-og7PE34fbSdoWyrqB88ujHH=w408-h272-k-no	https://www.google.com/maps/search/?api=1&query=Sonal%20Xerox&query_place_id=ChIJP792K-eFXjkRW3AXG9zy_XY	2025-08-15 14:15:39.581+00	2025-08-15 14:15:39.581+00
88	3	Hello Xerox - Prankunj Society, Krishnakunj Society, Maninagar	hello-xerox-1	હેલો ઝેરોક્ષ	Ahmedabad	Gujarat	380008	9427960337	Hello Owner	Hello Xerox	Hello Owner	hello@printeasyqr.com	9427960337	2J22+52H, Rambaug Kankariya Rd, Prankunj Society, Krishnakunj Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "sunday": {"isOpen": true, "openTime": "09:30", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=ZJkkG0Dar194eB6XrP0agQ&cb_client=search.gws-prod.gps&w=408&h=240&yaw=239.67068&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Hello%20Xerox&query_place_id=ChIJAQAQp8OFXjkRfSWiF_JRl_U	2025-08-15 14:15:40.9+00	2025-08-15 14:15:40.9+00
89	4	Shree Saikrupa Xerox Copy Center - Balvatika, Maninagar	shree-saikrupa-xerox-copy-center-1	શ્રી સાઇકૃપા ઝેરોક્સ કોપી સેન્ટર	Ahmedabad	Gujarat	380008	9374061034	Shree Saikrupa Owner	Shree Saikrupa Xerox Copy Center	Shree Saikrupa Owner	shreesaikrupa@printeasyqr.com	9374061034	Shop No. 4, Krishnanand Complex, Near Prince Pavbhaji, Jawahar Chowk Char Rastha, Bhairavnath Rd, opposite Soham Plaza, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=aksH15aYAJLBiKSGezfyEQ&cb_client=search.gws-prod.gps&w=408&h=240&yaw=338.1387&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Shree%20Saikrupa%20Xerox%20Copy%20Center&query_place_id=ChIJn12tuOeFXjkRe2lhRY7sziA	2025-08-15 14:15:42.224+00	2025-08-15 14:15:42.224+00
90	5	Janta Xerox - Digital Printing - Rambagh, Maninagar	janta-xerox-digital-printing-1	જનતા ઝેરોક્ષ	Ahmedabad	Gujarat	380028	9898397056	Janta  -  Printing Owner	Janta Xerox - Digital Printing	Janta  -  Printing Owner	jantaing@printeasyqr.com	9898397056	2, Anand Shopping Center, BRTS, Bhairavnath Rd, opp. Bhairavnath, Rambagh, Maninagar, Ahmedabad, Gujarat 380028, India	["Digital printing service", "Bookbinder", "Graphic designer", "Invitation printing service", "Lamination service", "Screen printing shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "15:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=t-03ttNoCFkZ847JPFnSbw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=11.762504&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Janta%20Xerox%20-%20Digital%20Printing&query_place_id=ChIJ8_qnyIqEXjkR8Xtmhlvw4wA	2025-08-15 14:15:43.549+00	2025-08-15 14:15:43.549+00
91	6	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Bin	radhey-xerox-and-stationary-best-digital-printing--1	No. 1, Mahalaxmi Market, 18, Maninagar Cross Rd, opp. Gandhi Complex, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9824000974	Radhey  and Stationary - Best  Printing  in Maninagar | Lamination Remove & Hard Binding  in Maninagar Owner	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar	Radhey  and Stationary - Best  Printing  in Maninagar | Lamination Remove & Hard Binding  in Maninagar Owner	radheyandstationaryb@printeasyqr.com	9824000974	No. 1, Mahalaxmi Market, 18, Maninagar Cross Rd, opp. Gandhi Complex, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqfhXEXjTOZ3er50e9UxHuGY49tDC9wthhCKDcu6Mtp_8QqhWzCJpSENvCyPoNDkAlc4yTpeCsbZN3OdtPZGuU1lq9pJqzSDs9rXthpyGxI3jEvQSAyU0qDDBoxz2rGOCLmH4RSoQ=w408-h408-k-no	https://www.google.com/maps/search/?api=1&query=Radhey%20Xerox%20and%20Stationary%20-%20Best%20Digital%20Printing%20Shop%20in%20Maninagar%20%7C%20Lamination%20Remove%20%26%20Hard%20Binding%20Shop%20in%20Maninagar&query_place_id=ChIJ_____8KFXjkRr9YZkNloji4	2025-08-15 14:15:44.865+00	2025-08-15 14:15:44.865+00
92	7	Shivam Xerox Copy Centre - Radhavallabh Colony, Maninagar	shivam-xerox-copy-centre-1	શિવમ ઝેરોક્સ કોપી સેન્ટર	Ahmedabad	Gujarat	380008	9879815783	Shivam Owner	Shivam Xerox Copy Centre	Shivam Owner	shivam@printeasyqr.com	9879815783	3, Krishnanand Complex, Near Prince Bhaji Pav, Opp.Soham Plaza, Jawhar Chowk Cross Road, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "16:00"}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4noWf5y1zZUrJF9aU6BVpQDLZp_4xtGeXsdMPo8MOgM2pa7yXWZGO3ZvkLfd6aAvqFpD0gaG1bxRwUXzz1g5UPmDZxSUvZrWEjydb4lCP0iHCPCYrr2i97uWgE1dpZm-l9CQdtqj=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=Shivam%20Xerox%20Copy%20Centre&query_place_id=ChIJEQlNx-eFXjkRlvDMuuqbI48	2025-08-15 14:15:46.186+00	2025-08-15 14:15:46.186+00
93	8	Saniya Colour Xerox - Danilimda	saniya-colour-xerox-1	સણીયા કલર ઝેરોક્સ	Ahmedabad	Gujarat	380028	9898298166	Saniya Colour Owner	Saniya Colour Xerox	Saniya Colour Owner	saniyacolour@printeasyqr.com	9898298166	Shop No:#29, Alishan Complex, Lalbhai Kundiwala Marg, Danilimda, Ahmedabad, Gujarat 380028, India	["Print shop", "Fax service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=B_oH6LR9I6WGdH-u9QZ6Bw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=317.09552&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Saniya%20Colour%20Xerox&query_place_id=ChIJg3VlNL2FXjkRNodNkCCcqnI	2025-08-15 14:15:47.504+00	2025-08-15 14:15:47.504+00
94	9	Gujarat Xerox - Ellisbridge	gujarat-xerox-3	ગુજરાત ઝેરોક્સ	Ahmedabad	Gujarat	380007	9879799981	Gujarat Owner	Gujarat Xerox	Gujarat Owner	gujarat@printeasyqr.com	9879799981	Purshottam Mavlankar Marg, Ellisbridge, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "14:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipN-y85W1LymcBVRL9dNnjpuF7Z6k6xsYXsC8PgU=w408-h625-k-no	https://www.google.com/maps/search/?api=1&query=Gujarat%20Xerox&query_place_id=ChIJxaGal_iEXjkRz8JIwhJDPhk	2025-08-15 14:15:49.271+00	2025-08-15 14:15:49.271+00
95	10	Krishna Xerox and Thesis Binding - Balvatika, Maninagar East, Maninagar	krishna-xerox-and-thesis-binding-1	થેસીસ બાઇન્ડીંગ	Ahmedabad	Gujarat	380008	7778844446	Krishna  and Thesis Binding Owner	Krishna Xerox and Thesis Binding	Krishna  and Thesis Binding Owner	krishnaandthesisbind@printeasyqr.com	7778844446	SHOP NO,4, JL Complex, JAWAHAR CHOWK CHAR RASTA, Bhairavnath Rd, near ILAJ MEDICAL, Balvatika, Maninagar East, Maninagar, Ahmedabad, Gujarat 380008, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "10:00", "closeTime": "13:00"}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4noXvSyj6kx1HP4lTgcLA6Dch5Q29S24E38sQdtQO8tnzi-AulEuMogfke0FUmabHsuixaxZ05k_aQBR61KBy50yxYPpZ0NDhrTo1YrjS_XBInleARAjui9x5rVO31LV85P2QxEe=w408-h541-k-no	https://www.google.com/maps/search/?api=1&query=Krishna%20Xerox%20and%20Thesis%20Binding&query_place_id=ChIJwRD-w-eFXjkR2y6ogobDIP4	2025-08-15 14:15:50.585+00	2025-08-15 14:15:50.585+00
96	11	Dhwani Zerox Centre - Maninagar	dhwani-zerox-centre-1	ધ્વનિ ઝેરોક્સ સેન્ટર	Ahmedabad	Gujarat	380008	7925463587	Dhwani Zerox Owner	Dhwani Zerox Centre	Dhwani Zerox Owner	dhwanizerox@printeasyqr.com	7925463587	2, Kashiwala Complex, Opposite Syndicate Bank, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": true, "openTime": "10:30", "closeTime": "14:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=lGmvb9EgH8Si6R_ZMc6r5g&cb_client=search.gws-prod.gps&w=408&h=240&yaw=353.53445&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Dhwani%20Zerox%20Centre&query_place_id=ChIJ_____8KFXjkR55zs0MQCwAY	2025-08-15 14:15:51.902+00	2025-08-15 14:15:51.902+00
97	12	Shraddha Xerox - Lal Bahadur Shastri Nagar, Behrampura	shraddha-xerox-1	96, Maneklal Kesavlal Chawal Opposite Parixitlalnagar, Lal Bahadur Shastri Nagar, Behrampura, Ahmedabad, Gujarat 380022, India	Ahmedabad	Gujarat	380022	9376517963	Shraddha Owner	Shraddha Xerox	Shraddha Owner	shraddha@printeasyqr.com	9376517963	96, Maneklal Kesavlal Chawal Opposite Parixitlalnagar, Lal Bahadur Shastri Nagar, Behrampura, Ahmedabad, Gujarat 380022, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "23:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipO6NLHziaB5PNCrq4a9zaJtiU51kFonhhTLfy2a=w426-h240-k-no	https://www.google.com/maps/search/?api=1&query=Shraddha%20Xerox&query_place_id=ChIJl28Q8rmFXjkRBJBRqPAIm9s	2025-08-15 14:15:53.22+00	2025-08-15 14:15:53.22+00
98	13	Shree Umiya Xerox - Prankunj Society, Pushpkunj, Maninagar	shree-umiya-xerox-1	શ્રી ઉમિયા ઝેરોક્સ	Ahmedabad	0	380008	9898581713	Shree Umiya Owner	Shree Umiya Xerox	Shree Umiya Owner	shreeumiya@printeasyqr.com	9898581713	4, Gopal Complex, Krishna Bagh Cross Road, Maninagar, Mani Nagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqzHs1ZoN2LgqaGnzNobENtv7kNwyDIXSVKrr4PE_aP2gbE4HRynz-WLoXF5HNdfrbixsk3qeGD21fdKlOVgw09RoDGd6qbQPitTU8M-soLcbyT64yTZ-Pjak5Ivs9qj4_5V7X0=w408-h906-k-no	https://www.google.com/maps/search/?api=1&query=Shree%20Umiya%20Xerox&query_place_id=ChIJ_____8KFXjkRJ7f2HdaAxIo	2025-08-15 14:15:54.536+00	2025-08-15 14:15:54.536+00
99	14	Mahakali Xerox - Gam, Sattar Taluka Society, Usmanpura	mahakali-xerox-1	2HR8+4RM, Mahakali Xerox Sundhiya, Gam, Vadnagar, Gujarat 384355, India	Vadnagar, Ahmedabad	Gujarat	384355	7359105661	Mahakali Owner	Mahakali Xerox	Mahakali Owner	mahakali@printeasyqr.com	7359105661	2HR8+4RM, Mahakali Xerox Sundhiya, Gam, Vadnagar, Gujarat 384355, India	["Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "22:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4npL8E6Cgd0JH8iua4BjLfeS1vQxWzAOutyY3cPJyuUKRNIITyMOlZo95i3LomZDQvYaEkAHhfCMy_Z_S2WLJfQHHg7dgeF5vWLbCFqu85vlQKmIpH2jdeqscFTMz-fO8KzB5tXGVQ=w408-h725-k-no	https://www.google.com/maps/search/?api=1&query=Mahakali%20Xerox&query_place_id=ChIJu78SbQeFXjkRbwFwUSXI4xI	2025-08-15 14:15:55.858+00	2025-08-15 14:15:55.858+00
100	15	Radhe xerox - Sattar Taluka Society, Usmanpura	radhe-xerox-1	રાધે ઝેરોક્સ	Ahmedabad	Gujarat	380014	9328888112	Radhe Owner	Radhe xerox	Radhe Owner	radhe@printeasyqr.com	9328888112	2HR9+P3C, Ghanshyam Avenue, opp. C U Shah college, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "monday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "21:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrB8EOonDewJbw7FNaNlY-e_H76LIVKkBnA2hVS80YxQCH5MslmTV7nz4UfYNyQaw-qn_hW7d1B5qaahbZi24KQL_ViJMkSLkqJLphAyBaqlYhTNwHWGpPJBSBQ_X6fgM4Kn10S=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Radhe%20xerox&query_place_id=ChIJGTeMErKFXjkRK4-lml7ajqA	2025-08-15 14:15:57.174+00	2025-08-15 14:15:57.174+00
101	16	Meet Xerox - Soni Ni Chal, Usmanpura	meet-xerox-1	મિત ઝેરોક્સ	Ahmedabad	Gujarat	380014	9979038192	Meet Owner	Meet Xerox	Meet Owner	meet@printeasyqr.com	9979038192	Auda Complex, Municipal Market, 39, Ashram Rd, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop", "Typing service"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipOBTNHx95Soj-YUQhHph5Z5btXg3CnwxzDQUSGz=w408-h543-k-no	https://www.google.com/maps/search/?api=1&query=Meet%20Xerox&query_place_id=ChIJS_bP1WOEXjkRcoEbRFuZtUY	2025-08-15 14:15:58.491+00	2025-08-15 14:15:58.491+00
102	17	Swastik Xerox - Swastik Society, Navrangpura	swastik-xerox-2	Anupam Complex, Swastik Cross Road, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9375946635	Swastik Owner	Swastik Xerox	Swastik Owner	swastik@printeasyqr.com	9375946635	Anupam Complex, Swastik Cross Road, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipPYunnKMLTgMsDDKckTSff9CawvSoh5X0_naea0=w427-h240-k-no	https://www.google.com/maps/search/?api=1&query=Swastik%20Xerox&query_place_id=ChIJc_wpOfOEXjkRAyrdBm1_RJU	2025-08-15 14:16:00.028+00	2025-08-15 14:16:00.028+00
103	18	NAVRANG XEROX - Swastik Society, Navrangpura	navrang-xerox-1	112, Samapann Complex, opposite Havmor Restaurant, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879152329	NAVRANG Owner	NAVRANG XEROX	NAVRANG Owner	navrang@printeasyqr.com	9879152329	112, Samapann Complex, opposite Havmor Restaurant, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:00"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/p/AF1QipMJbATlp0wLrrzHV6xA-txrUCs6vxqcdHOuXTFx=w408-h533-k-no	https://www.google.com/maps/search/?api=1&query=NAVRANG%20XEROX&query_place_id=ChIJ4VEYXQeFXjkR_NMOAdUQxJo	2025-08-15 14:16:01.342+00	2025-08-15 14:16:01.342+00
105	20	Urgent Thesis { Shree Krishna xerox } - Chaitanya Nagar, Navrangpura	urgent-thesis-shree-krishna-xerox--1	Oxford Avenue, A-22, Ashram Rd, opp. Cu Shah Commerce College, Chaitanya Nagar, Navrangpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9924032032	Urgent Thesis { Shree Krishna  } Owner	Urgent Thesis { Shree Krishna xerox }	Urgent Thesis { Shree Krishna  } Owner	urgentthesisshreekri@printeasyqr.com	9924032032	Oxford Avenue, A-22, Ashram Rd, opp. Cu Shah Commerce College, Chaitanya Nagar, Navrangpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "sunday": {"isOpen": true, "openTime": "11:00", "closeTime": "20:30"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "21:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nplD0mHdyFhGQPzQ40xMdUbpy_KQlklbknV41NXfYzHZW49NcumnHI74Ac5llhR0W70DuhQbEEuZUDtZWXgJeaQlWy3NVdzPIzMMXp8gBC9n7EKXZz60-Mcmp0a0aPHjgn0HU4j=w408-h723-k-no	https://www.google.com/maps/search/?api=1&query=Urgent%20Thesis%20%7B%20Shree%20Krishna%20xerox%20%7D&query_place_id=ChIJ0xurko6EXjkReTvk-o4lnMU	2025-08-15 14:16:03.972+00	2025-08-15 14:16:03.972+00
106	21	Patel Stationers & Xerox - Vasant Vihar, Navrangpura	patel-stationers-xerox-1	પટેલ સ્ટેશનર્સ & ઝેરોક્સ	Ahmedabad	Gujarat	380009	9426286695	Patel Stationers & Owner	Patel Stationers & Xerox	Patel Stationers & Owner	patelstationers@printeasyqr.com	9426286695	G F 1, Piyuraj Complex, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Computer store", "Stationery store", "Office supply store"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "monday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "saturday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "thursday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}, "wednesday": {"isOpen": true, "openTime": "09:30", "closeTime": "22:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqhWJy5HBm-REJUbJWexdOyUJqj0j4VTzNnF242DZLfMDKkIqGzE9EWUflWs_huJRbkVbXbWA0zOYDO6qj1WEqm86GRYquAr-GM9q5Jxbj6HovTjRCJRknCiHhx2Kp3BB2EjsuL=w408-h544-k-no	https://www.google.com/maps/search/?api=1&query=Patel%20Stationers%20%26%20Xerox&query_place_id=ChIJmaIna_OEXjkRkd5dnfgb5r0	2025-08-15 14:16:05.288+00	2025-08-15 14:16:05.288+00
107	22	SONAL XEROX - Swastik Society, Navrangpura	sonal-xerox-4	સોનલ ઝેરોક્સ	Ahmedabad	Gujarat	380009	9016738268	SONAL Owner	SONAL XEROX	SONAL Owner	sonal@printeasyqr.com	9016738268	Anupam-2 Swastik Char Rasta, B-2, Commerce College Rd, below Jain Dairy, opp. Fairdeal house, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Banner store", "Commercial printer", "Copy shop", "Custom label printer", "Lamination service", "Map store", "Offset printing service", "Digital printing service", "Vinyl sign shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "monday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "sunday": {"isOpen": false}, "tuesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "saturday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "thursday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}, "wednesday": {"isOpen": true, "openTime": "10:00", "closeTime": "20:30"}}	f	t	t	t	t	active	\N	0	https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqNr2ayXfmZv6bzhM3I40GJar6VgcCqLYd6kzviMVZ-mRVtCTd6twDLiCTj9QGFbcJV3wzoE_d6B97coPgPQNXOhKzauYV7WsWuOu34nhOt6ojMS2FATwVMrNIJcJhSUEwFMNs=w408-h306-k-no	https://www.google.com/maps/search/?api=1&query=SONAL%20XEROX&query_place_id=ChIJ6TxhOfOEXjkRgqHBlgSSQmk	2025-08-15 14:16:07.27+00	2025-08-15 14:16:07.27+00
19	19	Morari Jumbo Xerox Centre	morari-jumbo-xerox-centre	મોરારી જમ્બો ઝેરોક્સ સેન્ટર	Ahmedabad	Gujarat	380009	7927522736	Morari Jumbo Owner	Morari Jumbo Xerox Centre	Morari Jumbo Owner	morarijumbo@printeasyqr.com	7927522736	5, Visharad Complex, Nehru Park, Gujarat High-court Lane, Navrangpura, Opposite Loha Bhavan, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	t	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=AOoAM7e2LcVdVVbDI7FUrw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=247.68869&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Morari%20Jumbo%20Xerox%20Centre&query_place_id=ChIJW9Qi_1-EXjkRqvsSxD-GLSM	2025-08-15 14:13:30.137+00	2025-08-15 18:10:11.492+00
104	19	Morari Jumbo Xerox Centre - Shreyas Colony, Navrangpura	morari-jumbo-xerox-centre-1	મોરારી જમ્બો ઝેરોક્સ સેન્ટર	Ahmedabad	Gujarat	380009	7927522736	Morari Jumbo Owner	Morari Jumbo Xerox Centre	Morari Jumbo Owner	morarijumbo@printeasyqr.com	7927522736	5, Visharad Complex, Nehru Park, Gujarat High-court Lane, Navrangpura, Opposite Loha Bhavan, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "sunday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "tuesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "saturday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "thursday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}, "wednesday": {"isOpen": true, "openTime": "09:00", "closeTime": "18:00"}}	f	f	t	t	t	active	\N	0	https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=AOoAM7e2LcVdVVbDI7FUrw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=247.68869&pitch=0&thumbfov=100	https://www.google.com/maps/search/?api=1&query=Morari%20Jumbo%20Xerox%20Centre&query_place_id=ChIJW9Qi_1-EXjkRqvsSxD-GLSM	2025-08-15 14:16:02.658+00	2025-08-15 18:10:04.238+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, phone, name, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
1	9375825148	gujarat Owner	gujarat@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:05.596+00	2025-08-15 14:13:05.596+00
2	8905602840	Sonal Owner	sonal@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:06.912+00	2025-08-15 14:13:06.912+00
3	9427960337	Hello Owner	hello@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:08.214+00	2025-08-15 14:13:08.214+00
4	9374061034	Shree Saikrupa Owner	shreesaikrupa@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:09.528+00	2025-08-15 14:13:09.528+00
5	9898397056	Janta  -  Printing Owner	jantaing@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:10.84+00	2025-08-15 14:13:10.84+00
6	9824000974	Radhey  and Stationary - Best  Printing  in Maninagar | Lamination Remove & Hard Binding  in Maninagar Owner	radheyandstationaryb@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:12.135+00	2025-08-15 14:13:12.135+00
7	9879815783	Shivam Owner	shivam@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:13.437+00	2025-08-15 14:13:13.437+00
8	9898298166	Saniya Colour Owner	saniyacolour@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:14.744+00	2025-08-15 14:13:14.744+00
9	9879799981	Gujarat Owner	gujarat1@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:16.268+00	2025-08-15 14:13:16.268+00
10	7778844446	Krishna  and Thesis Binding Owner	krishnaandthesisbind@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:17.78+00	2025-08-15 14:13:17.78+00
11	7925463587	Dhwani Zerox Owner	dhwanizerox@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:19.077+00	2025-08-15 14:13:19.077+00
12	9376517963	Shraddha Owner	shraddha@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:20.379+00	2025-08-15 14:13:20.379+00
13	9898581713	Shree Umiya Owner	shreeumiya@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:21.681+00	2025-08-15 14:13:21.681+00
14	7359105661	Mahakali Owner	mahakali@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:22.987+00	2025-08-15 14:13:22.987+00
15	9328888112	Radhe Owner	radhe@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:24.288+00	2025-08-15 14:13:24.288+00
16	9979038192	Meet Owner	meet@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:25.59+00	2025-08-15 14:13:25.59+00
17	9375946635	Swastik Owner	swastik@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:26.893+00	2025-08-15 14:13:26.893+00
18	9879152329	NAVRANG Owner	navrang@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:28.193+00	2025-08-15 14:13:28.193+00
19	7927522736	Morari Jumbo Owner	morarijumbo@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:29.49+00	2025-08-15 14:13:29.49+00
20	9924032032	Urgent Thesis { Shree Krishna  } Owner	urgentthesisshreekri@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:30.786+00	2025-08-15 14:13:30.786+00
21	9426286695	Patel Stationers & Owner	patelstationers@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:32.082+00	2025-08-15 14:13:32.082+00
22	9016738268	SONAL Owner	sonal1@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:33.602+00	2025-08-15 14:13:33.602+00
23	9879425285	SONAL Owner	sonal2@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:35.545+00	2025-08-15 14:13:35.545+00
24	9624442094	Krishna Owner	krishna@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:37.496+00	2025-08-15 14:13:37.496+00
25	7600503830	Khushboo Owner	khushboo@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:38.796+00	2025-08-15 14:13:38.796+00
26	9825053503	VEERTI  AND STATIONERY Owner	veertiandstationery@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:40.092+00	2025-08-15 14:13:40.092+00
27	9898253080	Star Owner	star@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:41.395+00	2025-08-15 14:13:41.395+00
28	7926574506	Vijay Owner	vijay@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:42.689+00	2025-08-15 14:13:42.689+00
29	9913370932	Harish Duplicators (Rubber Stamp &  ) Owner	harishduplicatorsrub@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:44.007+00	2025-08-15 14:13:44.007+00
30	9825744288	Radhe Graphics and Printing, Naranpura, Ahmedabad I , Offset printer, Visiting Card, Brochure, envelope, flyer printing Owner	radhegraphicsandingn@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:45.302+00	2025-08-15 14:13:45.302+00
31	8128494821	Dheeraa  - Owner	dheeraa@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:46.598+00	2025-08-15 14:13:46.598+00
32	9725881188	Girish  And Stationery Owner	girishandstationery@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:47.896+00	2025-08-15 14:13:47.896+00
33	9998761976	H.P. Owner	hp@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:49.197+00	2025-08-15 14:13:49.197+00
34	9924349653	Dev Owner	dev@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:50.493+00	2025-08-15 14:13:50.493+00
35	9601656698	shivanya Owner	shivanya@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:51.789+00	2025-08-15 14:13:51.789+00
36	7935662235	Shardul Printing Press Owner	shardulingpress@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:53.087+00	2025-08-15 14:13:53.087+00
37	8511121069	Precious Business Owner	preciousbusiness@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:54.385+00	2025-08-15 14:13:54.385+00
38	9824410066	my Owner	myolutions@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:55.683+00	2025-08-15 14:13:55.683+00
39	9824032153	Shreeji Copiers & Stationers Owner	shreejicopiersstatio@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:56.985+00	2025-08-15 14:13:56.985+00
40	9998880683	Ambika Owner	ambika@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:58.286+00	2025-08-15 14:13:58.286+00
41	9898766956	Umiya  And Stationeries Owner	umiyaandstationeries@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:13:59.58+00	2025-08-15 14:13:59.58+00
42	9510686265	New Maheshwari Copiers Owner	newmaheshwaricopiers@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:00.889+00	2025-08-15 14:14:00.889+00
43	9426189957	Swastik Owner	swastik1@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:02.418+00	2025-08-15 14:14:02.418+00
44	9428601475	Sanjay Telecom Owner	sanjaytelecom@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:04.145+00	2025-08-15 14:14:04.145+00
45	9662366071	Pooja Owner	pooja@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:05.44+00	2025-08-15 14:14:05.44+00
46	9909890907	Saloni  Stationary and  Ro plant Sales & Owner	salonistationaryandr@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:06.738+00	2025-08-15 14:14:06.738+00
47	8866662269	Giriraj Copier Owner	girirajcopier@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:08.032+00	2025-08-15 14:14:08.032+00
48	9687507001	Chaitanya Owner	chaitanya@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:09.328+00	2025-08-15 14:14:09.328+00
49	9033222386	Mahavir  and Stationery Owner	mahavirandstationery@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:10.623+00	2025-08-15 14:14:10.623+00
50	7228818844	Gandhi Owner	gandhi@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:11.924+00	2025-08-15 14:14:11.924+00
51	7926462020	Kunal Owner	kunal@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:13.218+00	2025-08-15 14:14:13.218+00
52	9825801898	Sony Owner	sony@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:14.522+00	2025-08-15 14:14:14.522+00
53	9638774406	Classic  & Online Multilink Owner	classiconlinemultili@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:15.822+00	2025-08-15 14:14:15.822+00
54	6353674054	Shree Hari Owner	shreehari@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:17.126+00	2025-08-15 14:14:17.126+00
55	7922921476	Dharmendra Owner	dharmendra@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:18.422+00	2025-08-15 14:14:18.422+00
56	9979504180	New Mahakali - ₹1 per Page(Both Sides) Owner	newmahakali1perpageb@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:19.728+00	2025-08-15 14:14:19.728+00
57	6353757677	VINAYAK Owner	vinayak@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:21.026+00	2025-08-15 14:14:21.026+00
58	9714113789	KIRTI  AND STATIONERY Owner	kirtiandstationery@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:22.321+00	2025-08-15 14:14:22.321+00
59	9898089019	Jay Ambe Owner	jayambe@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:23.627+00	2025-08-15 14:14:23.627+00
60	9898645689	Jay Ambe  and Stationary Owner	jayambeandstationary@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:24.924+00	2025-08-15 14:14:24.924+00
61	9712602123	Parshwanath Owner	parshwanath@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:26.218+00	2025-08-15 14:14:26.218+00
62	7926400502	Mahavir Owner	mahavir@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:27.55+00	2025-08-15 14:14:27.55+00
63	9898393221	Jalaram Owner	jalaram@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:28.851+00	2025-08-15 14:14:28.851+00
64	9879687795	Khushboo Owner	khushboo1@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:30.363+00	2025-08-15 14:14:30.363+00
65	9427621991	Jaya Owner	jaya@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:32.115+00	2025-08-15 14:14:32.115+00
66	9824003564	PATEL COLOUR Owner	patelcolour@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:33.409+00	2025-08-15 14:14:33.409+00
67	7926406868	Chaudhari Owner	chaudhari@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:34.703+00	2025-08-15 14:14:34.703+00
68	8487870611	Kutbi ,  and Lamination Owner	kutbiandlamination@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:36.013+00	2025-08-15 14:14:36.013+00
69	9825699555	Rajesh Owner	rajesh@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:37.315+00	2025-08-15 14:14:37.315+00
70	6355065909	New best Owner	newbest@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:38.613+00	2025-08-15 14:14:38.613+00
71	8866119119	VARDHMAN THE Owner	vardhmanthehop@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:39.925+00	2025-08-15 14:14:39.925+00
72	7940041024	Shree Padmavati Owner	shreepadmavati@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:41.222+00	2025-08-15 14:14:41.222+00
73	9879252177	Jalaram Owner	jalaram1@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:42.743+00	2025-08-15 14:14:42.743+00
74	9974984570	Shri Umiya Owner	shriumiya@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:44.486+00	2025-08-15 14:14:44.486+00
75	9726275475	Navkar Copiers Owner	navkarcopiers@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:45.78+00	2025-08-15 14:14:45.78+00
76	9228207149	Khushboo Copiers Owner	khushboocopiers@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:47.073+00	2025-08-15 14:14:47.073+00
77	7600109894	Honest Owner	honest@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:48.377+00	2025-08-15 14:14:48.377+00
78	7383043404	Raj Owner	raj@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:49.671+00	2025-08-15 14:14:49.671+00
79	9377773387	Bhagvati Colour Owner	bhagvaticolour@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:50.965+00	2025-08-15 14:14:50.965+00
80	9898309897	CYBERA  ART Owner	cyberaart@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:52.264+00	2025-08-15 14:14:52.264+00
81	9723227227	Deepak Copiers And Printers Owner	deepakcopiersanders@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:54.422+00	2025-08-15 14:14:54.422+00
82	9327081009	Kunal  Pallet Owner	kunalpallet@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:55.724+00	2025-08-15 14:14:55.724+00
83	9157749267	Navkar Owner	navkar@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:57.018+00	2025-08-15 14:14:57.018+00
84	7487052820	Ideal Duplicating Bureau Owner	idealduplicatingbure@printeasyqr.com	$2b$12$1zL6/pHMMb1phjt/SBXO0ef7PG.HLdCImG00giRRZqWYWdfOFr/x2	shop_owner	t	2025-08-15 14:14:58.322+00	2025-08-15 14:14:58.322+00
85	7434052121	Harsh Thakar	\N	\N	customer	t	2025-08-15 16:51:35.187+00	2025-08-16 11:55:31.573+00
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 1, true);


--
-- Name: customer_shop_unlocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_shop_unlocks_id_seq', 3, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 9, true);


--
-- Name: qr_scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.qr_scans_id_seq', 1, false);


--
-- Name: shop_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shop_applications_id_seq', 1, false);


--
-- Name: shop_unlocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shop_unlocks_id_seq', 1, false);


--
-- Name: shops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shops_id_seq', 107, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 85, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: customer_shop_unlocks customer_shop_unlocks_customer_id_shop_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_shop_unlocks
    ADD CONSTRAINT customer_shop_unlocks_customer_id_shop_id_key UNIQUE (customer_id, shop_id);


--
-- Name: customer_shop_unlocks customer_shop_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_shop_unlocks
    ADD CONSTRAINT customer_shop_unlocks_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: qr_scans qr_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_scans
    ADD CONSTRAINT qr_scans_pkey PRIMARY KEY (id);


--
-- Name: shop_applications shop_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_applications
    ADD CONSTRAINT shop_applications_pkey PRIMARY KEY (id);


--
-- Name: shop_unlocks shop_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_unlocks
    ADD CONSTRAINT shop_unlocks_pkey PRIMARY KEY (id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: shops shops_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: customer_shop_unlocks_customer_id_shop_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX customer_shop_unlocks_customer_id_shop_id ON public.customer_shop_unlocks USING btree (customer_id, shop_id);


--
-- Name: qr_scans_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX qr_scans_created_at ON public.qr_scans USING btree (created_at);


--
-- Name: qr_scans_customer_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX qr_scans_customer_id ON public.qr_scans USING btree (customer_id);


--
-- Name: qr_scans_shop_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX qr_scans_shop_id ON public.qr_scans USING btree (shop_id);


--
-- Name: shop_unlocks_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shop_unlocks_created_at ON public.shop_unlocks USING btree (created_at);


--
-- Name: shop_unlocks_customer_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shop_unlocks_customer_id ON public.shop_unlocks USING btree (customer_id);


--
-- Name: shop_unlocks_shop_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shop_unlocks_shop_id ON public.shop_unlocks USING btree (shop_id);


--
-- Name: customer_shop_unlocks customer_shop_unlocks_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_shop_unlocks
    ADD CONSTRAINT customer_shop_unlocks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_shop_unlocks customer_shop_unlocks_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_shop_unlocks
    ADD CONSTRAINT customer_shop_unlocks_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: qr_scans qr_scans_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_scans
    ADD CONSTRAINT qr_scans_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: qr_scans qr_scans_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_scans
    ADD CONSTRAINT qr_scans_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE;


--
-- Name: shop_applications shop_applications_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_applications
    ADD CONSTRAINT shop_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shop_unlocks shop_unlocks_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_unlocks
    ADD CONSTRAINT shop_unlocks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: shop_unlocks shop_unlocks_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_unlocks
    ADD CONSTRAINT shop_unlocks_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE;


--
-- Name: shops shops_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

