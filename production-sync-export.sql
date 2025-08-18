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
    updated_at timestamp with time zone NOT NULL,
    public_id character varying(255)
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
    updated_at timestamp with time zone NOT NULL,
    manual_override_timestamp timestamp without time zone
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
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, order_id, sender_id, sender_name, sender_role, content, files, message_type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, title, message, type, related_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, customer_id, shop_id, order_number, type, title, description, specifications, files, walkin_time, status, is_urgent, estimated_pages, estimated_budget, final_amount, notes, deleted_by, deleted_at, created_at, updated_at, public_id) FROM stdin;
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

COPY public.shops (id, owner_id, name, slug, address, city, state, pin_code, phone, public_owner_name, internal_name, owner_full_name, email, owner_phone, complete_address, services, equipment, custom_services, custom_equipment, years_of_experience, formation_year, working_hours, accepts_walkin_orders, is_online, auto_availability, is_approved, is_public, status, qr_code, total_orders, exterior_image, google_maps_link, created_at, updated_at, manual_override_timestamp) FROM stdin;
1	4	Hello Xerox	hello-xerox	2J22+52H, Rambaug Kankariya Rd, Prankunj Society, Krishnakunj Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9427960337	Hello Xerox Owner	\N	Hello Xerox Owner	hello-xerox@printeasyqr.com	9427960337	2J22+52H, Rambaug Kankariya Rd, Prankunj Society, Krishnakunj Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "09:30", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Hello%20Xerox&query_place_id=ChIJAQAQp8OFXjkRfSWiF_JRl_U	2025-08-18 10:33:28.273+00	2025-08-18 10:33:28.273+00	\N
5	10	Hello Xerox	hello-xerox-1	2J22+52H, Rambaug Kankariya Rd, Prankunj Society, Krishnakunj Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9427960337	Hello Xerox Owner	\N	Hello Xerox Owner	hello-xerox-1@printeasyqr.com	9427960337	2J22+52H, Rambaug Kankariya Rd, Prankunj Society, Krishnakunj Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "09:30", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Hello%20Xerox&query_place_id=ChIJAQAQp8OFXjkRfSWiF_JRl_U	2025-08-18 10:42:46.35+00	2025-08-18 10:42:46.35+00	\N
6	11	Shree Saikrupa Xerox Copy Center	shree-saikrupa-xerox-copy-center	Shop No. 4, Krishnanand Complex, Near Prince Pavbhaji, Jawahar Chowk Char Rastha, Bhairavnath Rd, opposite Soham Plaza, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9374061034	Shree Saikrupa Xerox Copy Center Owner	\N	Shree Saikrupa Xerox Copy Center Owner	shree-saikrupa-xerox-copy-center@printeasyqr.com	9374061034	Shop No. 4, Krishnanand Complex, Near Prince Pavbhaji, Jawahar Chowk Char Rastha, Bhairavnath Rd, opposite Soham Plaza, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "sunday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shree%20Saikrupa%20Xerox%20Copy%20Center&query_place_id=ChIJn12tuOeFXjkRe2lhRY7sziA	2025-08-18 10:42:48.363+00	2025-08-18 10:42:48.363+00	\N
8	13	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar	radhey-xerox-and-stationary-best-digital-printing-shop-in-maninagar-lamination-remove-hard-binding-shop-in-maninagar	No. 1, Mahalaxmi Market, 18, Maninagar Cross Rd, opp. Gandhi Complex, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9824000974	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar Owner	\N	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar Owner	radhey-xerox-and-stationary-best-digital-printing-shop-in-maninagar-lamination-remove-hard-binding-shop-in-maninagar@printeasyqr.com	9824000974	No. 1, Mahalaxmi Market, 18, Maninagar Cross Rd, opp. Gandhi Complex, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Radhey%20Xerox%20and%20Stationary%20-%20Best%20Digital%20Printing%20Shop%20in%20Maninagar%20%7C%20Lamination%20Remove%20%26%20Hard%20Binding%20Shop%20in%20Maninagar&query_place_id=ChIJ_____8KFXjkRr9YZkNloji4	2025-08-18 10:42:51.394+00	2025-08-18 10:42:51.394+00	\N
9	14	Shivam Xerox Copy Centre	shivam-xerox-copy-centre	3, Krishnanand Complex, Near Prince Bhaji Pav, Opp.Soham Plaza, Jawhar Chowk Cross Road, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9879815783	Shivam Xerox Copy Centre Owner	\N	Shivam Xerox Copy Centre Owner	shivam-xerox-copy-centre@printeasyqr.com	9879815783	3, Krishnanand Complex, Near Prince Bhaji Pav, Opp.Soham Plaza, Jawhar Chowk Cross Road, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "16:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shivam%20Xerox%20Copy%20Centre&query_place_id=ChIJEQlNx-eFXjkRlvDMuuqbI48	2025-08-18 10:42:53.151+00	2025-08-18 10:42:53.151+00	\N
10	15	Parmar Xerox and Printing	parmar-xerox-and-printing	Neelam Kunj Society, nr. Mira Cinema, Shah-E-Alam Darwaja, P & T Colony, Maninagar, Ahmedabad, Gujarat 380028, India	Ahmedabad	Gujarat	380028	9998887776	Parmar Xerox and Printing Owner	\N	Parmar Xerox and Printing Owner	parmar-xerox-and-printing@printeasyqr.com	9998887776	Neelam Kunj Society, nr. Mira Cinema, Shah-E-Alam Darwaja, P & T Colony, Maninagar, Ahmedabad, Gujarat 380028, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "22:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Parmar%20Xerox%20and%20Printing&query_place_id=ChIJtx7Tv0WFXjkRFV4CcF-GmgY	2025-08-18 10:42:54.422+00	2025-08-18 10:42:54.422+00	\N
13	18	Dhwani Zerox Centre	dhwani-zerox-centre	2, Kashiwala Complex, Opposite Syndicate Bank, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	7925463587	Dhwani Zerox Centre Owner	\N	Dhwani Zerox Centre Owner	dhwani-zerox-centre@printeasyqr.com	7925463587	2, Kashiwala Complex, Opposite Syndicate Bank, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:30", "close": "14:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dhwani%20Zerox%20Centre&query_place_id=ChIJ_____8KFXjkR55zs0MQCwAY	2025-08-18 10:43:01.621+00	2025-08-18 10:43:01.621+00	\N
14	19	Shraddha Xerox	shraddha-xerox	96, Maneklal Kesavlal Chawal Opposite Parixitlalnagar, Lal Bahadur Shastri Nagar, Behrampura, Ahmedabad, Gujarat 380022, India	Ahmedabad	Gujarat	380022	9376517963	Shraddha Xerox Owner	\N	Shraddha Xerox Owner	shraddha-xerox@printeasyqr.com	9376517963	96, Maneklal Kesavlal Chawal Opposite Parixitlalnagar, Lal Bahadur Shastri Nagar, Behrampura, Ahmedabad, Gujarat 380022, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "23:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "23:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "23:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "23:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "23:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "23:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shraddha%20Xerox&query_place_id=ChIJl28Q8rmFXjkRBJBRqPAIm9s	2025-08-18 10:43:04.119+00	2025-08-18 10:43:04.119+00	\N
16	23	Radhe xerox	radhe-xerox	2HR9+P3C, Ghanshyam Avenue, opp. C U Shah college, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9328888112	Radhe xerox Owner	\N	Radhe xerox Owner	radhe-xerox@printeasyqr.com	9328888112	2HR9+P3C, Ghanshyam Avenue, opp. C U Shah college, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Radhe%20xerox&query_place_id=ChIJGTeMErKFXjkRK4-lml7ajqA	2025-08-18 10:43:11.477+00	2025-08-18 10:43:11.477+00	\N
17	24	Meet Xerox	meet-xerox	Auda Complex, Municipal Market, 39, Ashram Rd, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9979038192	Meet Xerox Owner	\N	Meet Xerox Owner	meet-xerox@printeasyqr.com	9979038192	Auda Complex, Municipal Market, 39, Ashram Rd, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop", "Typing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Meet%20Xerox&query_place_id=ChIJS_bP1WOEXjkRcoEbRFuZtUY	2025-08-18 10:43:13.968+00	2025-08-18 10:43:13.968+00	\N
19	26	NAVRANG XEROX	navrang-xerox	112, Samapann Complex, opposite Havmor Restaurant, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879152329	NAVRANG XEROX Owner	\N	NAVRANG XEROX Owner	navrang-xerox@printeasyqr.com	9879152329	112, Samapann Complex, opposite Havmor Restaurant, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=NAVRANG%20XEROX&query_place_id=ChIJ4VEYXQeFXjkR_NMOAdUQxJo	2025-08-18 10:43:19.652+00	2025-08-18 10:43:19.652+00	\N
20	27	Morari Jumbo Xerox Centre	morari-jumbo-xerox-centre	5, Visharad Complex, Nehru Park, Gujarat High-court Lane, Navrangpura, Opposite Loha Bhavan, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7927522736	Morari Jumbo Xerox Centre Owner	\N	Morari Jumbo Xerox Centre Owner	morari-jumbo-xerox-centre@printeasyqr.com	7927522736	5, Visharad Complex, Nehru Park, Gujarat High-court Lane, Navrangpura, Opposite Loha Bhavan, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Morari%20Jumbo%20Xerox%20Centre&query_place_id=ChIJW9Qi_1-EXjkRqvsSxD-GLSM	2025-08-18 10:43:22.847+00	2025-08-18 10:43:22.847+00	\N
21	28	Urgent Thesis { Shree Krishna xerox }	urgent-thesis-shree-krishna-xerox-	Oxford Avenue, A-22, Ashram Rd, opp. Cu Shah Commerce College, Chaitanya Nagar, Navrangpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9924032032	Urgent Thesis { Shree Krishna xerox } Owner	\N	Urgent Thesis { Shree Krishna xerox } Owner	urgent-thesis-shree-krishna-xerox-@printeasyqr.com	9924032032	Oxford Avenue, A-22, Ashram Rd, opp. Cu Shah Commerce College, Chaitanya Nagar, Navrangpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "sunday": {"open": "11:00", "close": "20:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Urgent%20Thesis%20%7B%20Shree%20Krishna%20xerox%20%7D&query_place_id=ChIJ0xurko6EXjkReTvk-o4lnMU	2025-08-18 10:43:25.793+00	2025-08-18 10:43:25.793+00	\N
22	29	Patel Stationers & Xerox	patel-stationers-xerox	G F 1, Piyuraj Complex, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9426286695	Patel Stationers & Xerox Owner	\N	Patel Stationers & Xerox Owner	patel-stationers-xerox@printeasyqr.com	9426286695	G F 1, Piyuraj Complex, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Computer store", "Stationery store", "Office supply store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "22:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "22:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "22:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "22:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "22:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "22:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Patel%20Stationers%20%26%20Xerox&query_place_id=ChIJmaIna_OEXjkRkd5dnfgb5r0	2025-08-18 10:43:29.235+00	2025-08-18 10:43:29.235+00	\N
23	30	SONAL XEROX	sonal-xerox-2	Anupam-2 Swastik Char Rasta, B-2, Commerce College Rd, below Jain Dairy, opp. Fairdeal house, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879425285	SONAL XEROX Owner	\N	SONAL XEROX Owner	sonal-xerox-2@printeasyqr.com	9879425285	Anupam-2 Swastik Char Rasta, B-2, Commerce College Rd, below Jain Dairy, opp. Fairdeal house, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Banner store", "Commercial printer", "Copy shop", "Custom label printer", "Lamination service", "Map store", "Offset printing service", "Digital printing service", "Vinyl sign shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=SONAL%20XEROX&query_place_id=ChIJ6TxhOfOEXjkRgqHBlgSSQmk	2025-08-18 10:43:33.397+00	2025-08-18 10:43:33.397+00	\N
25	32	Krishna xerox	krishna-xerox	Ajanta chamber, Income tax circle, opposite GUJARAT VIDYAPITH, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9624442094	Krishna xerox Owner	\N	Krishna xerox Owner	krishna-xerox@printeasyqr.com	9624442094	Ajanta chamber, Income tax circle, opposite GUJARAT VIDYAPITH, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Krishna%20xerox&query_place_id=ChIJS97VmKCFXjkRgwGHmD22DXE	2025-08-18 10:43:40.766+00	2025-08-18 10:43:40.766+00	\N
27	34	Hastmilap Xerox	hastmilap-xerox	Sukhsagar Complex, Shop. 17 Ground Floor, Ashram Rd, Shanti Nagar, Usmanpura, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9824234567	Hastmilap Xerox Owner	\N	Hastmilap Xerox Owner	hastmilap-xerox@printeasyqr.com	9824234567	Sukhsagar Complex, Shop. 17 Ground Floor, Ashram Rd, Shanti Nagar, Usmanpura, Ahmedabad, Gujarat 380013, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Hastmilap%20Xerox&query_place_id=ChIJb8AN9SKFXjkRfDS6Ffbqvg8	2025-08-18 10:43:46.457+00	2025-08-18 10:43:46.457+00	\N
28	35	VEERTI XEROX AND STATIONERY	veerti-xerox-and-stationery	3,G/F, Narnarayan Complex, Navrangpura Rd, near Swastik Char Rasta, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9825053503	VEERTI XEROX AND STATIONERY Owner	\N	VEERTI XEROX AND STATIONERY Owner	veerti-xerox-and-stationery@printeasyqr.com	9825053503	3,G/F, Narnarayan Complex, Navrangpura Rd, near Swastik Char Rasta, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "16:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=VEERTI%20XEROX%20AND%20STATIONERY&query_place_id=ChIJR4ozm_SEXjkRBlRlE86YbaI	2025-08-18 10:43:50.142+00	2025-08-18 10:43:50.142+00	\N
29	38	Harish Duplicators (Rubber Stamp & Xerox Store)	harish-duplicators-rubber-stamp-xerox-store	Siddharth Complex, 2-3/A, Ashram Rd, near Dinesh Hall, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9913370932	Harish Duplicators (Rubber Stamp & Xerox Store) Owner	\N	Harish Duplicators (Rubber Stamp & Xerox Store) Owner	harish-duplicators-rubber-stamp-xerox-store@printeasyqr.com	9913370932	Siddharth Complex, 2-3/A, Ashram Rd, near Dinesh Hall, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Lamination service", "Rubber stamp store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Harish%20Duplicators%20(Rubber%20Stamp%20%26%20Xerox%20Store)&query_place_id=ChIJef_Z51-EXjkR6p9tOXXaJg8	2025-08-18 10:44:02.351+00	2025-08-18 10:44:02.351+00	\N
26	33	Khushboo Xerox	khushboo-xerox	G7,G7/A,C9, Liberty Complex, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879687795	Khushboo Xerox Owner	\N	Khushboo Xerox Owner	khushboo-xerox@printeasyqr.com	9879687795	G7,G7/A,C9, Liberty Complex, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "11:00", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Khushboo%20Xerox&query_place_id=ChIJX9otKnWFXjkR-IykARrm3Ig	2025-08-18 10:43:44.7+00	2025-08-18 10:43:44.7+00	\N
32	41	Dheeraa Prints - Xerox	dheeraa-prints-xerox	Shop No. 5, Kamdhenu Complex, Commerce Six Rd, opp. Samved Hospital, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	8128494821	Dheeraa Prints - Xerox Owner	\N	Dheeraa Prints - Xerox Owner	dheeraa-prints-xerox@printeasyqr.com	8128494821	Shop No. 5, Kamdhenu Complex, Commerce Six Rd, opp. Samved Hospital, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "saturday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "thursday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dheeraa%20Prints%20-%20Xerox&query_place_id=ChIJ6-DAEQmFXjkRIXJ72b9677g	2025-08-18 10:44:13.403+00	2025-08-18 10:44:13.403+00	\N
33	42	Girish Xerox And Stationery	girish-xerox-and-stationery	7, nr. Swastik School, opp. Maharshi Complex, Bharat Colony, Sardar Patel Colony, Navjivan, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9725881188	Girish Xerox And Stationery Owner	\N	Girish Xerox And Stationery Owner	girish-xerox-and-stationery@printeasyqr.com	9725881188	7, nr. Swastik School, opp. Maharshi Complex, Bharat Colony, Sardar Patel Colony, Navjivan, Ahmedabad, Gujarat 380014, India	["Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Girish%20Xerox%20And%20Stationery&query_place_id=ChIJ24-32IiEXjkREtWUNBY2SYM	2025-08-18 10:44:18.322+00	2025-08-18 10:44:18.322+00	\N
34	43	H.P. Xerox	hp-xerox	Vidya Vihar Colony Rd, near Hotel Fortune Landmark, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9998761976	H.P. Xerox Owner	\N	H.P. Xerox Owner	hp-xerox@printeasyqr.com	9998761976	Vidya Vihar Colony Rd, near Hotel Fortune Landmark, Soni Ni Chal, Usmanpura, Ahmedabad, Gujarat 380014, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=H.P.%20Xerox&query_place_id=ChIJW_ZhuGOEXjkRz6oAlRUUNyc	2025-08-18 10:44:23.459+00	2025-08-18 10:44:23.459+00	\N
31	40	Gautam Copy Centre	gautam-copy-centre	10, Harsiddh Chambers, Ashram Rd, near Income Tax, next to Oshwal Restaurant, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9825976560	Gautam Copy Centre Owner	\N	Gautam Copy Centre Owner	gautam-copy-centre@printeasyqr.com	9825976560	10, Harsiddh Chambers, Ashram Rd, near Income Tax, next to Oshwal Restaurant, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop", "Commercial printer", "Digital printer", "Digital printing service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Gautam%20Copy%20Centre&query_place_id=ChIJlx53RWCEXjkRTjAcIixMp8c	2025-08-18 10:44:09.002+00	2025-08-18 10:44:09.002+00	\N
36	45	shivanya digital	shivanya-digital	Shop No, 4, Center, Deepawali Complex, Opp, Old High Ct Rd, nr. Income Tex, Ashram Road, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	9601656698	shivanya digital Owner	\N	shivanya digital Owner	shivanya-digital@printeasyqr.com	9601656698	Shop No, 4, Center, Deepawali Complex, Opp, Old High Ct Rd, nr. Income Tex, Ashram Road, Sattar Taluka Society, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=shivanya%20digital&query_place_id=ChIJby0gB1WFXjkRkPISewKZtSo	2025-08-18 10:44:34.434+00	2025-08-18 10:44:34.434+00	\N
37	46	Shardul Printing Press	shardul-printing-press	Basement, Rambha Complex, Income Tax Circle, Ashram Rd, opposite Gujarat Vidyapith Road, Usmanpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	7935662235	Shardul Printing Press Owner	\N	Shardul Printing Press Owner	shardul-printing-press@printeasyqr.com	7935662235	Basement, Rambha Complex, Income Tax Circle, Ashram Rd, opposite Gujarat Vidyapith Road, Usmanpura, Ahmedabad, Gujarat 380014, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "19:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shardul%20Printing%20Press&query_place_id=ChIJef_Z51-EXjkRDxNCqapXDVA	2025-08-18 10:44:39.069+00	2025-08-18 10:44:39.069+00	\N
38	47	Precious Business Systems	precious-business-systems	201, Sunrise Avenue Opp Kailash Tower Nr jain Temple Stadium Circle, To, Commerce College Rd, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	8511121069	Precious Business Systems Owner	\N	Precious Business Systems Owner	precious-business-systems@printeasyqr.com	8511121069	201, Sunrise Avenue Opp Kailash Tower Nr jain Temple Stadium Circle, To, Commerce College Rd, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Copier repair service", "Printing equipment supplier", "Office equipment supplier"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Precious%20Business%20Systems&query_place_id=ChIJ____P_WEXjkRzAknCl44jPc	2025-08-18 10:44:43.947+00	2025-08-18 10:44:43.947+00	\N
40	49	my print solutions	my-print-solutions	C27 gr, floor, SUMEL BUSINESS PARK-6, Dudheshwar Rd, Dudheshwar, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9824410066	my print solutions Owner	\N	my print solutions Owner	my-print-solutions@printeasyqr.com	9824410066	C27 gr, floor, SUMEL BUSINESS PARK-6, Dudheshwar Rd, Dudheshwar, Ahmedabad, Gujarat 380004, India	["Print shop", "Lamination service", "Printing equipment supplier", "Printer repair service", "Toner cartridge supplier"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=my%20print%20solutions&query_place_id=ChIJNz22fJaFXjkRV2UMnnEYo1k	2025-08-18 10:44:52.166+00	2025-08-18 10:44:52.166+00	\N
39	48	Mbabulal printery	mbabulal-printery	Janpath complex, 305, Ashram Rd, opposite Patang Hotel, Paldi, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9876543210	Mbabulal printery Owner	\N	Mbabulal printery Owner	mbabulal-printery@printeasyqr.com	9876543210	Janpath complex, 305, Ashram Rd, opposite Patang Hotel, Paldi, Ahmedabad, Gujarat 380006, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Mbabulal%20printery&query_place_id=ChIJc0wofTOFXjkRJ_lAdjNU8eE	2025-08-18 10:44:46.173+00	2025-08-18 10:44:46.173+00	\N
41	50	Shreeji Copiers & Stationers	shreeji-copiers-stationers	Ground Floor - 1, Omkar House, Behind Femina Town, Near Swastik Char Rasta, Chimanlal Girdharlal Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9824032153	Shreeji Copiers & Stationers Owner	\N	Shreeji Copiers & Stationers Owner	shreeji-copiers-stationers@printeasyqr.com	9824032153	Ground Floor - 1, Omkar House, Behind Femina Town, Near Swastik Char Rasta, Chimanlal Girdharlal Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shreeji%20Copiers%20%26%20Stationers&query_place_id=ChIJMecFsvSEXjkRkzQsYVaA6F8	2025-08-18 10:44:58.264+00	2025-08-18 10:44:58.264+00	\N
42	51	Ambika Xerox	ambika-xerox	XJR7+9G9, Near Daxini Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9998880683	Ambika Xerox Owner	\N	Ambika Xerox Owner	ambika-xerox@printeasyqr.com	9998880683	XJR7+9G9, Near Daxini Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Ambika%20Xerox&query_place_id=ChIJWUgUa-KFXjkRugEcXtz6RyA	2025-08-18 10:45:04.584+00	2025-08-18 10:45:04.584+00	\N
43	52	Umiya Xerox And Stationeries	umiya-xerox-and-stationeries	B-36,Radhe Shopping, Khokhra Cir, G I D C Industrial Area, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9898766956	Umiya Xerox And Stationeries Owner	\N	Umiya Xerox And Stationeries Owner	umiya-xerox-and-stationeries@printeasyqr.com	9898766956	B-36,Radhe Shopping, Khokhra Cir, G I D C Industrial Area, Ahmedabad, Gujarat 380008, India	["Copy shop", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Umiya%20Xerox%20And%20Stationeries&query_place_id=ChIJnTdSRnSGXjkRHeCX8YyQj38	2025-08-18 10:45:11.174+00	2025-08-18 10:45:11.174+00	\N
44	53	New Maheshwari Copiers	new-maheshwari-copiers	5, Muktajiwan Estate, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9510686265	New Maheshwari Copiers Owner	\N	New Maheshwari Copiers Owner	new-maheshwari-copiers@printeasyqr.com	9510686265	5, Muktajiwan Estate, Near Swaminarayan Wadi, Old Railway Crossing, Bhairavnath Rd, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=New%20Maheshwari%20Copiers&query_place_id=ChIJIXv1_eCFXjkRmM-lGT8mauw	2025-08-18 10:45:17.998+00	2025-08-18 10:45:17.998+00	\N
46	55	HAPPY XEROX	happy-xerox	Freniben Desai Marg, Fatehpura Gam, Paldi, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9106202562	HAPPY XEROX Owner	\N	HAPPY XEROX Owner	happy-xerox@printeasyqr.com	9106202562	Freniben Desai Marg, Fatehpura Gam, Paldi, Ahmedabad, Gujarat 380007, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=HAPPY%20XEROX&query_place_id=ChIJt1pQUvGFXjkRZHb7KhouXzE	2025-08-18 10:45:25.821+00	2025-08-18 10:45:25.821+00	\N
49	59	Giriraj Copier	giriraj-copier	Shop No 8, Sambhavtirth Shopping Centre, Vasna, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	8866662269	Giriraj Copier Owner	\N	Giriraj Copier Owner	giriraj-copier@printeasyqr.com	8866662269	Shop No 8, Sambhavtirth Shopping Centre, Vasna, Ahmedabad, Gujarat 380007, India	["Copy shop", "Banner store", "Income tax help association", "Lamination service", "Notary public", "Passport agent", "Passport photo processor", "Rubber stamp store", "Vinyl sign shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:30", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Giriraj%20Copier&query_place_id=ChIJ7XX8qReFXjkR6S9AXunz1SE	2025-08-18 10:45:50.907+00	2025-08-18 10:45:50.907+00	\N
50	60	Chaitanya Xerox	chaitanya-xerox	2, Hitek Centre, opposite Sanskar Kendra, Paldi, Paldi, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9687507001	Chaitanya Xerox Owner	\N	Chaitanya Xerox Owner	chaitanya-xerox@printeasyqr.com	9687507001	2, Hitek Centre, opposite Sanskar Kendra, Paldi, Paldi, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Chaitanya%20Xerox&query_place_id=ChIJ_____wKFXjkRPLyC3_FDYTc	2025-08-18 10:45:58.433+00	2025-08-18 10:45:58.433+00	\N
51	61	Mahavir Xerox and Stationery	mahavir-xerox-and-stationery	LL-2, Murlidhar Complex, Surendra Mangaldas Rd, beside Sunphoto, Patel Colony, Ambawadi, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9033222386	Mahavir Xerox and Stationery Owner	\N	Mahavir Xerox and Stationery Owner	mahavir-xerox-and-stationery@printeasyqr.com	9033222386	LL-2, Murlidhar Complex, Surendra Mangaldas Rd, beside Sunphoto, Patel Colony, Ambawadi, Ahmedabad, Gujarat 380015, India	["Copy shop", "Christmas store", "Dairy store", "Passport photo processor", "Photo lab", "Photography service", "Photography studio", "Print shop", "Stationery store", "Stationery wholesaler"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "00:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Mahavir%20Xerox%20and%20Stationery&query_place_id=ChIJ9W8tMRqFXjkRwuX0TX4B9WE	2025-08-18 10:46:04.279+00	2025-08-18 10:46:04.279+00	\N
55	66	Sony Xerox Center	sony-xerox-center	Old City, Sarangpur, Sherkotda, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	9825801898	Sony Xerox Center Owner	\N	Sony Xerox Center Owner	sony-xerox-center@printeasyqr.com	9825801898	Old City, Sarangpur, Sherkotda, Ahmedabad, Gujarat 380001, India	["Print shop", "Bookbinder", "Commercial printer", "Digital printer", "Drafting service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "13:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "13:30", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "13:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "13:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "13:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "13:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Sony%20Xerox%20Center&query_place_id=ChIJxSGK9TSEXjkRwy0SUFPw39c	2025-08-18 10:46:30.081+00	2025-08-18 10:46:30.081+00	\N
58	70	Dharmendra Xerox	dharmendra-xerox	2JJ4+2WG, Saraspur Rd, Opp. Ambedkar Hall, Saraspur, Ahmedabad, Gujarat 380018, India	Ahmedabad	Gujarat	380018	7922921476	Dharmendra Xerox Owner	\N	Dharmendra Xerox Owner	dharmendra-xerox@printeasyqr.com	7922921476	2JJ4+2WG, Saraspur Rd, Opp. Ambedkar Hall, Saraspur, Ahmedabad, Gujarat 380018, India	["Copy shop", "Cosmetics store", "Payphone"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dharmendra%20Xerox&query_place_id=ChIJmSAoES-EXjkR8mqwir7MJpU	2025-08-18 10:46:48.991+00	2025-08-18 10:46:48.991+00	\N
56	68	Gulshan Xerox	gulshan-xerox	679/19,Deepak Chamber,Kalupur,oppsite Railway Station Kalupur, Kalupur Tower Rd, Kalupur, Ahmedabad, Gujarat 380002, India	Ahmedabad	Gujarat	380002	9377773388	Gulshan Xerox Owner	\N	Gulshan Xerox Owner	gulshan-xerox@printeasyqr.com	9377773388	679/19,Deepak Chamber,Kalupur,oppsite Railway Station Kalupur, Kalupur Tower Rd, Kalupur, Ahmedabad, Gujarat 380002, India	["Copy shop", "Lamination service", "Print shop", "Train ticket agency"]	[]	\N	\N	\N	\N	{"friday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "07:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Gulshan%20Xerox&query_place_id=ChIJq6qqOjeEXjkRXQUOpS2jIJ8	2025-08-18 10:46:41.119+00	2025-08-18 10:46:41.119+00	\N
61	75	KIRTI XEROX AND STATIONERY	kirti-xerox-and-stationery	G/3, Ravi Raj Avenue, nr. Parth Tower, Bhimjipura, Nava Vadaj, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9714113789	KIRTI XEROX AND STATIONERY Owner	\N	KIRTI XEROX AND STATIONERY Owner	kirti-xerox-and-stationery@printeasyqr.com	9714113789	G/3, Ravi Raj Avenue, nr. Parth Tower, Bhimjipura, Nava Vadaj, Ahmedabad, Gujarat 380013, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=KIRTI%20XEROX%20AND%20STATIONERY&query_place_id=ChIJK6ZpjpuDXjkRH_Dye7YAJl4	2025-08-18 10:47:19.323+00	2025-08-18 10:47:19.323+00	\N
63	77	Jay Ambe Xerox and Stationary	jay-ambe-xerox-and-stationary	G-43 Shubh Complex Nr Rajasthan Hospital, Shahibag, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9898645689	Jay Ambe Xerox and Stationary Owner	\N	Jay Ambe Xerox and Stationary Owner	jay-ambe-xerox-and-stationary@printeasyqr.com	9898645689	G-43 Shubh Complex Nr Rajasthan Hospital, Shahibag, Ahmedabad, Gujarat 380004, India	["Copy shop", "Print shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Jay%20Ambe%20Xerox%20and%20Stationary&query_place_id=ChIJo4WoiQ2EXjkRn2uk3Mud_uU	2025-08-18 10:49:29.562+00	2025-08-18 10:49:29.562+00	\N
64	78	Parshwanath Xerox Copy Centre	parshwanath-xerox-copy-centre	3H46+P36, Hasmukh Colony, Vijaynagar Rd, Rang Jyot Society, Naranpura, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9712602123	Parshwanath Xerox Copy Centre Owner	\N	Parshwanath Xerox Copy Centre Owner	parshwanath-xerox-copy-centre@printeasyqr.com	9712602123	3H46+P36, Hasmukh Colony, Vijaynagar Rd, Rang Jyot Society, Naranpura, Ahmedabad, Gujarat 380013, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Parshwanath%20Xerox%20Copy%20Centre&query_place_id=ChIJt2S4lYOEXjkRXhSbMtJ_RYU	2025-08-18 10:49:30.844+00	2025-08-18 10:49:30.844+00	\N
59	72	Dev xerox	dev-xerox	dhanlaxmi evenuy, A-3, Jawahar Chowk, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9924349654	Dev xerox Owner	\N	Dev xerox Owner	dev-xerox@printeasyqr.com	9924349654	dhanlaxmi evenuy, A-3, Jawahar Chowk, Balvatika, Maninagar, Ahmedabad, Gujarat 380008, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dev%20xerox&query_place_id=ChIJL909cmOFXjkRMSUznsfFKTE	2025-08-18 10:47:00.489+00	2025-08-18 10:47:00.489+00	\N
67	81	Jaya Xerox	jaya-xerox	Shop No.1-55, Shree Krishna Centre, Mithakhali Cir, near Vijaya Bank, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9427621991	Jaya Xerox Owner	\N	Jaya Xerox Owner	jaya-xerox@printeasyqr.com	9427621991	Shop No.1-55, Shree Krishna Centre, Mithakhali Cir, near Vijaya Bank, Mithakhali, Navrangpura, Ahmedabad, Gujarat 380015, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Jaya%20Xerox&query_place_id=ChIJJ8Q11vWEXjkRU9QDFPKDM4M	2025-08-18 10:49:33.612+00	2025-08-18 10:49:33.612+00	\N
68	82	PATEL COLOUR XEROX	patel-colour-xerox	12, Swastik Super Market , Opp. Popular House, Near R. Kumar Ashram Road Mill Officer's Colony, Income Tax, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9824003564	PATEL COLOUR XEROX Owner	\N	PATEL COLOUR XEROX Owner	patel-colour-xerox@printeasyqr.com	9824003564	12, Swastik Super Market , Opp. Popular House, Near R. Kumar Ashram Road Mill Officer's Colony, Income Tax, Ahmedabad, Gujarat 380009, India	["Copy shop", "Graphic designer", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=PATEL%20COLOUR%20XEROX&query_place_id=ChIJ1VTzcGCEXjkRZrF5puAsxVA	2025-08-18 10:49:34.375+00	2025-08-18 10:49:34.375+00	\N
69	83	Chaudhari Xerox	chaudhari-xerox	2HH5+CVF, Opp Axis Bank, Near Samrtheshwar Mahadev, Law Garden, Samartheshwar Mahadev Rd, Ellisbridge, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	7926406868	Chaudhari Xerox Owner	\N	Chaudhari Xerox Owner	chaudhari-xerox@printeasyqr.com	7926406868	2HH5+CVF, Opp Axis Bank, Near Samrtheshwar Mahadev, Law Garden, Samartheshwar Mahadev Rd, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Copy shop", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Chaudhari%20Xerox&query_place_id=ChIJ1w4p7vCEXjkRoRIZhXY3nNg	2025-08-18 10:49:35.147+00	2025-08-18 10:49:35.147+00	\N
70	84	Kutbi Xerox, Print and Lamination Shop	kutbi-xerox-print-and-lamination-shop	Kutbi Xerox, Mirzapur Road, opposite Mirzapur District Court, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	8487870611	Kutbi Xerox, Print and Lamination Shop Owner	\N	Kutbi Xerox, Print and Lamination Shop Owner	kutbi-xerox-print-and-lamination-shop@printeasyqr.com	8487870611	Kutbi Xerox, Mirzapur Road, opposite Mirzapur District Court, Ahmedabad, Gujarat 380001, India	["Copy shop", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Kutbi%20Xerox%2C%20Print%20and%20Lamination%20Shop&query_place_id=ChIJfR3QMUSEXjkRpQZXo66otIw	2025-08-18 10:49:35.916+00	2025-08-18 10:49:35.916+00	\N
66	80	Jalaram Xerox	jalaram-xerox	5, Ashwamegh Complex, Nr. Mithakhali Underbridge, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9879252177	Jalaram Xerox Owner	\N	Jalaram Xerox Owner	jalaram-xerox@printeasyqr.com	9879252177	5, Ashwamegh Complex, Nr. Mithakhali Underbridge, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Computer accessories store", "Computer hardware manufacturer", "Copying supply store", "Lamination service", "Pen store", "Printing equipment supplier", "Stationery store", "Stationery wholesaler"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:30", "close": "19:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:30", "close": "19:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:30", "close": "19:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:30", "close": "19:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:30", "close": "19:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:30", "close": "19:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Jalaram%20Xerox&query_place_id=ChIJ9TK-NvaEXjkRmtRzLVCHySs	2025-08-18 10:49:32.379+00	2025-08-18 10:49:32.379+00	\N
72	86	New best Xerox	new-best-xerox	Shop no 10, Sahyog complex, Mirzapur Rd, near dinbai tower, Old City, Khanpur, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	6355065909	New best Xerox Owner	\N	New best Xerox Owner	new-best-xerox@printeasyqr.com	6355065909	Shop no 10, Sahyog complex, Mirzapur Rd, near dinbai tower, Old City, Khanpur, Ahmedabad, Gujarat 380001, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "17:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=New%20best%20Xerox&query_place_id=ChIJL64HEJmFXjkRS8kcYwqWkHw	2025-08-18 10:49:37.682+00	2025-08-18 10:49:37.682+00	\N
73	87	VARDHMAN THE DIGITAL PRINT SHOP	vardhman-the-digital-print-shop	9, Suryodaya Complex, Chimanlal Girdharlal Rd, nr. Swastik Cross Road, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	8866119119	VARDHMAN THE DIGITAL PRINT SHOP Owner	\N	VARDHMAN THE DIGITAL PRINT SHOP Owner	vardhman-the-digital-print-shop@printeasyqr.com	8866119119	9, Suryodaya Complex, Chimanlal Girdharlal Rd, nr. Swastik Cross Road, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "16:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=VARDHMAN%20THE%20DIGITAL%20PRINT%20SHOP&query_place_id=ChIJGfbE9AmFXjkRXJBVMavQEjM	2025-08-18 10:49:38.456+00	2025-08-18 10:49:38.456+00	\N
74	88	Shree Padmavati Xerox Centre	shree-padmavati-xerox-centre	30, Ashmi Shopping Centre,Opposite Memnagar Fire Station,120 Feet Ring Road, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7940041024	Shree Padmavati Xerox Centre Owner	\N	Shree Padmavati Xerox Centre Owner	shree-padmavati-xerox-centre@printeasyqr.com	7940041024	30, Ashmi Shopping Centre,Opposite Memnagar Fire Station,120 Feet Ring Road, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shree%20Padmavati%20Xerox%20Centre&query_place_id=ChIJFVVVFfWEXjkR9bt7dmxmTbU	2025-08-18 10:49:39.227+00	2025-08-18 10:49:39.227+00	\N
76	90	Navkar Copiers	navkar-copiers	1, Devnandan Complex, Ashram Rd, opposite Sanyas, near M. J. Library, Ellisbridge, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9726275475	Navkar Copiers Owner	\N	Navkar Copiers Owner	navkar-copiers@printeasyqr.com	9726275475	1, Devnandan Complex, Ashram Rd, opposite Sanyas, near M. J. Library, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Print shop", "Copier repair service", "Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Navkar%20Copiers&query_place_id=ChIJq_Nf91aEXjkRLO-qXBlZVuY	2025-08-18 10:49:41.471+00	2025-08-18 10:49:41.471+00	\N
75	89	Shri Umiya Xerox	shri-umiya-xerox	Dhara Complex, Drive In Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9714060648	Shri Umiya Xerox Owner	\N	Shri Umiya Xerox Owner	shri-umiya-xerox@printeasyqr.com	9714060648	Dhara Complex, Drive In Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shri%20Umiya%20Xerox&query_place_id=ChIJge7DnpaEXjkR_MVmxVVzMVw	2025-08-18 10:49:40.464+00	2025-08-18 10:49:40.464+00	\N
78	92	Honest Xerox	honest-xerox	Relief Arcade, Relief Rd, Patthar Kuva, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	7600109894	Honest Xerox Owner	\N	Honest Xerox Owner	honest-xerox@printeasyqr.com	7600109894	Relief Arcade, Relief Rd, Patthar Kuva, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Honest%20Xerox&query_place_id=ChIJ7e_3gh-FXjkRWp8RH_L2xQY	2025-08-18 10:49:43.013+00	2025-08-18 10:49:43.013+00	\N
80	94	Bhagvati Colour Xerox	bhagvati-colour-xerox	2HP6+8XV, Navrangpura Rd, Opposite Narnarayan Complex, Shrimali Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9377773387	Bhagvati Colour Xerox Owner	\N	Bhagvati Colour Xerox Owner	bhagvati-colour-xerox@printeasyqr.com	9377773387	2HP6+8XV, Navrangpura Rd, Opposite Narnarayan Complex, Shrimali Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Bhagvati%20Colour%20Xerox&query_place_id=ChIJ37aOhvSEXjkRViy4xhs4asI	2025-08-18 10:49:44.549+00	2025-08-18 10:49:44.549+00	\N
81	95	CYBERA PRINT ART	cybera-print-art	G-3, Samudra Annexe, Near Girish Cold Drinks Cross Roads, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9898309897	CYBERA PRINT ART Owner	\N	CYBERA PRINT ART Owner	cybera-print-art@printeasyqr.com	9898309897	G-3, Samudra Annexe, Near Girish Cold Drinks Cross Roads, Chimanlal Girdharlal Rd, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380009, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=CYBERA%20PRINT%20ART&query_place_id=ChIJrQPTMvKEXjkR1Xsyqg0OFHs	2025-08-18 10:49:45.66+00	2025-08-18 10:49:45.66+00	\N
82	96	Thesis binding (radhe xerox)	thesis-binding-radhe-xerox	gate no.8, shop no.12, sachet 2, Netaji Rd, opp. GLS college, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7778844446	Thesis binding (radhe xerox) Owner	\N	Thesis binding (radhe xerox) Owner	thesis-binding-radhe-xerox@printeasyqr.com	7778844446	gate no.8, shop no.12, sachet 2, Netaji Rd, opp. GLS college, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "19:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Thesis%20binding%20(radhe%20xerox)&query_place_id=ChIJsxyR4pSFXjkRe9KCGZu23tg	2025-08-18 10:49:46.674+00	2025-08-18 10:49:46.674+00	\N
84	98	Kunal Print Pallet	kunal-print-pallet	A1, Navrang Super Market, Bus Stand, Navrangpura Rd, opposite Navrangpura, Navarangpura Gam, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9327081009	Kunal Print Pallet Owner	\N	Kunal Print Pallet Owner	kunal-print-pallet@printeasyqr.com	9327081009	A1, Navrang Super Market, Bus Stand, Navrangpura Rd, opposite Navrangpura, Navarangpura Gam, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "07:00", "close": "19:00", "closed": false, "is24Hours": false}, "monday": {"open": "07:00", "close": "19:00", "closed": false, "is24Hours": false}, "sunday": {"open": "07:00", "close": "12:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "07:00", "close": "19:00", "closed": false, "is24Hours": false}, "saturday": {"open": "07:00", "close": "19:00", "closed": false, "is24Hours": false}, "thursday": {"open": "07:00", "close": "19:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "07:00", "close": "19:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Kunal%20Print%20Pallet&query_place_id=ChIJ____P_WEXjkRkzDPNTa9hbM	2025-08-18 10:49:48.203+00	2025-08-18 10:49:48.203+00	\N
85	99	Navkar prints	navkar-prints	Ground Floor, Swastik super Market, Ashram Rd, near Sales India, Mill Officer's Colony, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9157749267	Navkar prints Owner	\N	Navkar prints Owner	navkar-prints@printeasyqr.com	9157749267	Ground Floor, Swastik super Market, Ashram Rd, near Sales India, Mill Officer's Colony, Shreyas Colony, Navrangpura, Ahmedabad, Gujarat 380009, India	["Digital printing service", "Commercial printer", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:30", "close": "13:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Navkar%20prints&query_place_id=ChIJsZDumF-EXjkRU7THLjilzxE	2025-08-18 10:49:48.966+00	2025-08-18 10:49:48.966+00	\N
86	100	Ideal Duplicating Bureau	ideal-duplicating-bureau	72, Sarvoday Commercial Centre, Near G.P.O, Salapose Rd, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	7487052820	Ideal Duplicating Bureau Owner	\N	Ideal Duplicating Bureau Owner	ideal-duplicating-bureau@printeasyqr.com	7487052820	72, Sarvoday Commercial Centre, Near G.P.O, Salapose Rd, Gheekanta, Bhadra, Ahmedabad, Gujarat 380001, India	["Print shop", "Commercial printer", "Typing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Ideal%20Duplicating%20Bureau&query_place_id=ChIJVVVVpVGEXjkRIcZjpENu9xE	2025-08-18 10:49:49.737+00	2025-08-18 10:49:49.737+00	\N
87	101	SAMEER STATIONERY & XEROX	sameer-stationery-xerox	Samir parlour, opp. rangeela police chowky, near torrent power, Old City, Shahpur, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	9624022818	SAMEER STATIONERY & XEROX Owner	\N	SAMEER STATIONERY & XEROX Owner	sameer-stationery-xerox@printeasyqr.com	9624022818	Samir parlour, opp. rangeela police chowky, near torrent power, Old City, Shahpur, Ahmedabad, Gujarat 380001, India	["Print shop", "Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:30", "close": "15:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:30", "close": "15:00", "closed": false, "is24Hours": false}, "sunday": {"open": "00:00", "close": "15:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:30", "close": "15:00", "closed": false, "is24Hours": false}, "saturday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "thursday": {"open": "10:30", "close": "15:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:30", "close": "15:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=SAMEER%20STATIONERY%20%26%20XEROX&query_place_id=ChIJRyNHc2OFXjkR5-_XAZr4fKo	2025-08-18 10:49:50.5+00	2025-08-18 10:49:50.5+00	\N
88	102	Gayatri Service Centre Copy Centre	gayatri-service-centre-copy-centre	B-7-8, Central Complex, Vijay Char Rasta, Drive In Rd, Vijay Cross Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7926422561	Gayatri Service Centre Copy Centre Owner	\N	Gayatri Service Centre Copy Centre Owner	gayatri-service-centre-copy-centre@printeasyqr.com	7926422561	B-7-8, Central Complex, Vijay Char Rasta, Drive In Rd, Vijay Cross Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Gayatri%20Service%20Centre%20Copy%20Centre&query_place_id=ChIJ40l3AZSEXjkRTfUtkGVVHYE	2025-08-18 10:49:51.268+00	2025-08-18 10:49:51.268+00	\N
91	105	Shubham Laser Printing & Binding	shubham-laser-printing-binding	1st Floor, Shanta Sagar Complex, 2, near Hatkesh Society Road, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9824014868	Shubham Laser Printing & Binding Owner	\N	Shubham Laser Printing & Binding Owner	shubham-laser-printing-binding@printeasyqr.com	9824014868	1st Floor, Shanta Sagar Complex, 2, near Hatkesh Society Road, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Bookbinder", "Digital printing service", "Lamination service", "Offset printing service", "Pen store", "Stationery manufacturer", "Stationery wholesaler"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "00:00", "close": "19:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shubham%20Laser%20Printing%20%26%20Binding&query_place_id=ChIJ04pKNpCEXjkRijg1Fp53cTw	2025-08-18 10:49:53.817+00	2025-08-18 10:49:53.817+00	\N
92	106	Quick Copier	quick-copier	6, Shukun Siddhi Complex, Balkunj St, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9712821797	Quick Copier Owner	\N	Quick Copier Owner	quick-copier@printeasyqr.com	9712821797	6, Shukun Siddhi Complex, Balkunj St, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Quick%20Copier&query_place_id=ChIJUWANS9yFXjkR2vy53Rx74VY	2025-08-18 10:49:54.814+00	2025-08-18 10:49:54.814+00	\N
93	107	Shreeji Xerox	shreeji-xerox	4, Jai Hind Cross Rd, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9978078412	Shreeji Xerox Owner	\N	Shreeji Xerox Owner	shreeji-xerox@printeasyqr.com	9978078412	4, Jai Hind Cross Rd, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:15", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:15", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:15", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:15", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:15", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:15", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shreeji%20Xerox&query_place_id=ChIJP-5tAYSFXjkRIBZmnDE6cpo	2025-08-18 10:49:55.577+00	2025-08-18 10:49:55.577+00	\N
94	108	Prima Xerox & Computer	prima-xerox-computer	Om Complex, Opp Navkar Complex, Near Shreyas Crossing Over Bridge, Shreyas Railway Crossing Rd, Mithila Society, Ambawadi, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9374894022	Prima Xerox & Computer Owner	\N	Prima Xerox & Computer Owner	prima-xerox-computer@printeasyqr.com	9374894022	Om Complex, Opp Navkar Complex, Near Shreyas Crossing Over Bridge, Shreyas Railway Crossing Rd, Mithila Society, Ambawadi, Ahmedabad, Gujarat 380015, India	["Print shop", "Book store", "Computer store", "Digital printing service", "Invitation printing service", "Lamination service", "Offset printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "12:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Prima%20Xerox%20%26%20Computer&query_place_id=ChIJC9kX7x-FXjkRIUexVRei97M	2025-08-18 10:49:56.34+00	2025-08-18 10:49:56.34+00	\N
96	110	Tushar Xerox	tushar-xerox	Gandhi Park, 7, University Rd, near Sahajanand College, Bemanagar, Acharya Narendradev Nagar, Ambawadi, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	7926300815	Tushar Xerox Owner	\N	Tushar Xerox Owner	tushar-xerox@printeasyqr.com	7926300815	Gandhi Park, 7, University Rd, near Sahajanand College, Bemanagar, Acharya Narendradev Nagar, Ambawadi, Ahmedabad, Gujarat 380015, India	["Print shop", "Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Tushar%20Xerox&query_place_id=ChIJKxfMSd2EXjkRRoFiLQ6NKLg	2025-08-18 10:49:57.867+00	2025-08-18 10:49:57.867+00	\N
97	111	Navkar Xerox	navkar-xerox	GF-2, Dharnidhar Tower, 120 Feet Ring Rd, opposite Dharnidhar Derasar, Dharnidhar Society, Yashkamal Society, Vasna, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	7940097709	Navkar Xerox Owner	\N	Navkar Xerox Owner	navkar-xerox@printeasyqr.com	7940097709	GF-2, Dharnidhar Tower, 120 Feet Ring Rd, opposite Dharnidhar Derasar, Dharnidhar Society, Yashkamal Society, Vasna, Ahmedabad, Gujarat 380007, India	["Print shop", "Computer repair service", "Computer service", "Computer store", "Digital printer", "Digital printing service", "Graphic designer", "Law firm", "Legal services", "Offset printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Navkar%20Xerox&query_place_id=ChIJrWySsB6FXjkROGRbeb1wUTw	2025-08-18 10:49:58.63+00	2025-08-18 10:49:58.63+00	\N
98	112	Pooja Stationers & Book Depot	pooja-stationers-book-depot	B-31, Mangaltirth Tower, Near Dharnidhar Char Rasta, 120 Feet Ring Rd, Sharda Nagar Society, Paldi, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9825041163	Pooja Stationers & Book Depot Owner	\N	Pooja Stationers & Book Depot Owner	pooja-stationers-book-depot@printeasyqr.com	9825041163	B-31, Mangaltirth Tower, Near Dharnidhar Char Rasta, 120 Feet Ring Rd, Sharda Nagar Society, Paldi, Ahmedabad, Gujarat 380007, India	["Copy shop", "Art center", "Computer store", "Stationery store", "Courier service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Pooja%20Stationers%20%26%20Book%20Depot&query_place_id=ChIJB5YC6h6FXjkRbFzRpjS6cQM	2025-08-18 10:49:59.393+00	2025-08-18 10:49:59.393+00	\N
99	113	Vraj Xerox	vraj-xerox	6, Shiv Complex, opposite Hirabhai Tower, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9727160019	Vraj Xerox Owner	\N	Vraj Xerox Owner	vraj-xerox@printeasyqr.com	9727160019	6, Shiv Complex, opposite Hirabhai Tower, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "12:00", "close": "00:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Vraj%20Xerox&query_place_id=ChIJn90l7-WFXjkRC06gK8zKDcU	2025-08-18 10:50:00.398+00	2025-08-18 10:50:00.398+00	\N
100	114	New Aakash Xerox	new-aakash-xerox	2GHX+W8R, Skylon Tower, Opp. Jhanvi Restaurant, University Rd, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9824013271	New Aakash Xerox Owner	\N	New Aakash Xerox Owner	new-aakash-xerox@printeasyqr.com	9824013271	2GHX+W8R, Skylon Tower, Opp. Jhanvi Restaurant, University Rd, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380015, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=New%20Aakash%20Xerox&query_place_id=ChIJFeOba-mEXjkRwbsNBDz-Wr0	2025-08-18 10:51:15.653+00	2025-08-18 10:51:15.653+00	\N
102	116	Komal Copiers	komal-copiers	Lal Bunglow, Municipal Staff Quarters, opp. IDBI Bank, New Commercial Mills Staff Society, Ellisbridge, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9825343337	Komal Copiers Owner	\N	Komal Copiers Owner	komal-copiers@printeasyqr.com	9825343337	Lal Bunglow, Municipal Staff Quarters, opp. IDBI Bank, New Commercial Mills Staff Society, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Komal%20Copiers&query_place_id=ChIJ____P_iEXjkRa8ds_sdgE2g	2025-08-18 10:51:17.473+00	2025-08-18 10:51:17.473+00	\N
103	117	Laxmi Copiers	laxmi-copiers	Panjarapole Char Rasta, Antriksh Complex, 10, University Rd, Panjara Pol, Ambawadi, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9724420000	Laxmi Copiers Owner	\N	Laxmi Copiers Owner	laxmi-copiers@printeasyqr.com	9724420000	Panjarapole Char Rasta, Antriksh Complex, 10, University Rd, Panjara Pol, Ambawadi, Ahmedabad, Gujarat 380015, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "15:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Laxmi%20Copiers&query_place_id=ChIJ835jKOiEXjkRqnGvCpvPU74	2025-08-18 10:51:18.261+00	2025-08-18 10:51:18.261+00	\N
104	118	PHOTO GHOR & XEROX CENTER	photo-ghor-xerox-center	2HMV+JFG, Old City, Dariyapur, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	8653843757	PHOTO GHOR & XEROX CENTER Owner	\N	PHOTO GHOR & XEROX CENTER Owner	photo-ghor-xerox-center@printeasyqr.com	8653843757	2HMV+JFG, Old City, Dariyapur, Ahmedabad, Gujarat 380001, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=PHOTO%20GHOR%20%26%20XEROX%20CENTER&query_place_id=ChIJ____7ziEXjkRJhc0qQ_R3FU	2025-08-18 10:51:19.048+00	2025-08-18 10:51:19.048+00	\N
105	119	Xerox & Print House	xerox-print-house	Petrol Pump, Zakariya Masjid, besides Zankar Gali, opposite Nagina Masjid, Old City, Tankshal, Khadia, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	9106952137	Xerox & Print House Owner	\N	Xerox & Print House Owner	xerox-print-house@printeasyqr.com	9106952137	Petrol Pump, Zakariya Masjid, besides Zankar Gali, opposite Nagina Masjid, Old City, Tankshal, Khadia, Ahmedabad, Gujarat 380001, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "13:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "13:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "13:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "13:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "13:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "13:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Xerox%20%26%20Print%20House&query_place_id=ChIJm9uUiaqFXjkRnIoEizCAOO4	2025-08-18 10:51:19.831+00	2025-08-18 10:51:19.831+00	\N
106	120	Login Print Shop	login-print-shop	B-4 SHIVSHYAM COMPLEX OPP L D ENGG COLLEGE PASSPORT OFFICE UNIVERSITY ROAD GULBAI TEKRA, University Rd, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9067330045	Login Print Shop Owner	\N	Login Print Shop Owner	login-print-shop@printeasyqr.com	9067330045	B-4 SHIVSHYAM COMPLEX OPP L D ENGG COLLEGE PASSPORT OFFICE UNIVERSITY ROAD GULBAI TEKRA, University Rd, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Login%20Print%20Shop&query_place_id=ChIJc9iEqJaFXjkR6DbmKz0dlZA	2025-08-18 10:51:20.649+00	2025-08-18 10:51:20.649+00	\N
108	122	Akash Copiers	akash-copiers	5, Shivshyam Complex, University Rd, near Tulsi Hotel, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9426606057	Akash Copiers Owner	\N	Akash Copiers Owner	akash-copiers@printeasyqr.com	9426606057	5, Shivshyam Complex, University Rd, near Tulsi Hotel, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380015, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Akash%20Copiers&query_place_id=ChIJmd804-uEXjkRHKI_GyOuo6o	2025-08-18 10:51:22.227+00	2025-08-18 10:51:22.227+00	\N
109	123	Shahji Enterprise	shahji-enterprise	Opposite Moti Brahamputi Pole, Khadia Paper Market Khadia, Kalupur, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	7922160320	Shahji Enterprise Owner	\N	Shahji Enterprise Owner	shahji-enterprise@printeasyqr.com	7922160320	Opposite Moti Brahamputi Pole, Khadia Paper Market Khadia, Kalupur, Ahmedabad, Gujarat 380001, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:30", "close": "19:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shahji%20Enterprise&query_place_id=ChIJq6qqOjeEXjkRd8x5-pJoye4	2025-08-18 10:51:23.015+00	2025-08-18 10:51:23.015+00	\N
110	124	Niharica Xerox	niharica-xerox	8 Paradise Shopping Center, VS Road, opp. Ketav Petrol Pump, Ambawadi, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	7940074781	Niharica Xerox Owner	\N	Niharica Xerox Owner	niharica-xerox@printeasyqr.com	7940074781	8 Paradise Shopping Center, VS Road, opp. Ketav Petrol Pump, Ambawadi, Ahmedabad, Gujarat 380015, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Niharica%20Xerox&query_place_id=ChIJYTr5kuOEXjkROXzE1E95TLY	2025-08-18 10:51:23.801+00	2025-08-18 10:51:23.801+00	\N
111	125	Royal Xerox & Printing	royal-xerox-printing	44, opp. U N Mehta Hospital, opp. Gate -1, Dhabharnagar Society, Arihant Nagar, Shahibag, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9825069908	Royal Xerox & Printing Owner	\N	Royal Xerox & Printing Owner	royal-xerox-printing@printeasyqr.com	9825069908	44, opp. U N Mehta Hospital, opp. Gate -1, Dhabharnagar Society, Arihant Nagar, Shahibag, Ahmedabad, Gujarat 380004, India	["Print shop", "Bus ticket agency", "Copy shop", "Lamination service", "Train ticket agency"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "22:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "22:30", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "21:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "22:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "22:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "22:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "22:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Royal%20Xerox%20%26%20Printing&query_place_id=ChIJUV52hGqEXjkROTIZ4D2YvEM	2025-08-18 10:51:25.796+00	2025-08-18 10:51:25.796+00	\N
112	126	Swastik Print shop and Book Stationary stor	swastik-print-shop-and-book-stationary-stor	Ghevar Complex, Shahibaug Rd., near Raj Hospital, Shahibag, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9909085620	Swastik Print shop and Book Stationary stor Owner	\N	Swastik Print shop and Book Stationary stor Owner	swastik-print-shop-and-book-stationary-stor@printeasyqr.com	9909085620	Ghevar Complex, Shahibaug Rd., near Raj Hospital, Shahibag, Ahmedabad, Gujarat 380004, India	["Print shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "00:00", "close": "19:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Swastik%20Print%20shop%20and%20Book%20Stationary%20stor&query_place_id=ChIJj18RYw6EXjkRYpc2rE3OyZo	2025-08-18 10:51:26.582+00	2025-08-18 10:51:26.582+00	\N
114	128	Gopal Xerox Center	gopal-xerox-center	2JX3+M68, Rukshmani Bhuvan, Civil Hospital Rd, opp. O.P.D Block, Asarwa, Ahmedabad, Gujarat 380016, India	Ahmedabad	Gujarat	380016	9898527384	Gopal Xerox Center Owner	\N	Gopal Xerox Center Owner	gopal-xerox-center@printeasyqr.com	9898527384	2JX3+M68, Rukshmani Bhuvan, Civil Hospital Rd, opp. O.P.D Block, Asarwa, Ahmedabad, Gujarat 380016, India	["Copy shop", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "18:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Gopal%20Xerox%20Center&query_place_id=ChIJt0fVqxCEXjkR-GxvCc2G_fA	2025-08-18 10:51:28.399+00	2025-08-18 10:51:28.399+00	\N
115	129	Maruti General Store & Xerox Centre	maruti-general-store-xerox-centre	15, Bipin Complex, Opp. Cancer Hospital, Civil Hospital Rd, near Prabhu Parlour, Asarwa, Ahmedabad, Gujarat 380016, India	Ahmedabad	Gujarat	380016	9624342282	Maruti General Store & Xerox Centre Owner	\N	Maruti General Store & Xerox Centre Owner	maruti-general-store-xerox-centre@printeasyqr.com	9624342282	15, Bipin Complex, Opp. Cancer Hospital, Civil Hospital Rd, near Prabhu Parlour, Asarwa, Ahmedabad, Gujarat 380016, India	["Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"open": "07:30", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "07:30", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "07:30", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "07:30", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "07:30", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "07:30", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Maruti%20General%20Store%20%26%20Xerox%20Centre&query_place_id=ChIJZY6IgxmEXjkRuKnVdB7PvVQ	2025-08-18 10:51:29.184+00	2025-08-18 10:51:29.184+00	\N
116	130	Amee Xerox & Telecom	amee-xerox-telecom	2JX3+M68, Civil Hospital Rd, opposite New Civil Hospital, Patel Society, Asarwa, Ahmedabad, Gujarat 380016, India	Ahmedabad	Gujarat	380016	9824244035	Amee Xerox & Telecom Owner	\N	Amee Xerox & Telecom Owner	amee-xerox-telecom@printeasyqr.com	9824244035	2JX3+M68, Civil Hospital Rd, opposite New Civil Hospital, Patel Society, Asarwa, Ahmedabad, Gujarat 380016, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Amee%20Xerox%20%26%20Telecom&query_place_id=ChIJGakpqhCEXjkRMDjM8ZvRnEY	2025-08-18 10:51:30.216+00	2025-08-18 10:51:30.216+00	\N
117	131	Vinayak Xerox	vinayak-xerox	2HWX+WXJ, Shanitpura, opposite Eye Hospital, Girdhar Nagar, Ahmedabad, Gujarat 380016, India	Ahmedabad	Gujarat	380016	9898116998	Vinayak Xerox Owner	\N	Vinayak Xerox Owner	vinayak-xerox@printeasyqr.com	9898116998	2HWX+WXJ, Shanitpura, opposite Eye Hospital, Girdhar Nagar, Ahmedabad, Gujarat 380016, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Vinayak%20Xerox&query_place_id=ChIJv24g3BaEXjkREUU_9cNOz1o	2025-08-18 10:51:31.524+00	2025-08-18 10:51:31.524+00	\N
118	132	SREE XEROX ONLINE	sree-xerox-online	SHANTIPURA BALIYA LIMBDI CHAR RASTA, New Civil Hospital Rd, Asarwa, Gujarat 380016, India	Ahmedabad	Gujarat	380016	7698575710	SREE XEROX ONLINE Owner	\N	SREE XEROX ONLINE Owner	sree-xerox-online@printeasyqr.com	7698575710	SHANTIPURA BALIYA LIMBDI CHAR RASTA, New Civil Hospital Rd, Asarwa, Gujarat 380016, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=SREE%20XEROX%20ONLINE&query_place_id=ChIJh2GSSi-FXjkRShCTCgh2QvM	2025-08-18 10:51:32.307+00	2025-08-18 10:51:32.307+00	\N
120	134	Maruti Xerox	maruti-xerox	Government E Colony, 69/272, opp. Amber Cinema, Dhobi Ghat, Kailash Nagar, Saraspur, Ahmedabad, Gujarat 380024, India	Ahmedabad	Gujarat	380024	9998988870	Maruti Xerox Owner	\N	Maruti Xerox Owner	maruti-xerox@printeasyqr.com	9998988870	Government E Colony, 69/272, opp. Amber Cinema, Dhobi Ghat, Kailash Nagar, Saraspur, Ahmedabad, Gujarat 380024, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "15:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Maruti%20Xerox&query_place_id=ChIJq6qq6o-GXjkRSnM1vI_Q9W8	2025-08-18 10:51:33.88+00	2025-08-18 10:51:33.88+00	\N
121	135	Shiv Zerox	shiv-zerox	3J22+V5F, Jay Complex, Vittal Nagar Road, Shahibaug, Girdhar Nagar, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9924242632	Shiv Zerox Owner	\N	Shiv Zerox Owner	shiv-zerox@printeasyqr.com	9924242632	3J22+V5F, Jay Complex, Vittal Nagar Road, Shahibaug, Girdhar Nagar, Ahmedabad, Gujarat 380004, India	["Copy shop", "Digital printer"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "00:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "00:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:30", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "00:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "00:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "00:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "00:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shiv%20Zerox&query_place_id=ChIJaXKpUhCEXjkRPg0FB6EYseM	2025-08-18 10:51:34.669+00	2025-08-18 10:51:34.669+00	\N
122	136	Parshwa Copiers	parshwa-copiers	15, Ashmi Shopping Centre, Opposite Shalby Hospital, Opposite Mem Nagar Fire Station, Vijay Cross Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7940046880	Parshwa Copiers Owner	\N	Parshwa Copiers Owner	parshwa-copiers@printeasyqr.com	7940046880	15, Ashmi Shopping Centre, Opposite Shalby Hospital, Opposite Mem Nagar Fire Station, Vijay Cross Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Parshwa%20Copiers&query_place_id=ChIJRUihOZGEXjkR7M6BcRvT3ts	2025-08-18 10:51:35.458+00	2025-08-18 10:51:35.458+00	\N
123	137	Dudh Wala Xerox Centre	dudh-wala-xerox-centre	Shop No. 18, Opp Rani Shipri Masjid, Astodian Gate, Swami Vivekananda Rd, Astodia, Khamasa, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	7925390169	Dudh Wala Xerox Centre Owner	\N	Dudh Wala Xerox Centre Owner	dudh-wala-xerox-centre@printeasyqr.com	7925390169	Shop No. 18, Opp Rani Shipri Masjid, Astodian Gate, Swami Vivekananda Rd, Astodia, Khamasa, Ahmedabad, Gujarat 380001, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "23:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dudh%20Wala%20Xerox%20Centre&query_place_id=ChIJodADa7WFXjkRdBehrH_DJgQ	2025-08-18 10:51:36.48+00	2025-08-18 10:51:36.48+00	\N
124	138	Orbit Multiprint	orbit-multiprint	Sumel 11, An Indian Textile Plaza, 143, BAPS Cir, nr. BAPS, Bhadreshwar Society, Shahibag, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9016528799	Orbit Multiprint Owner	\N	Orbit Multiprint Owner	orbit-multiprint@printeasyqr.com	9016528799	Sumel 11, An Indian Textile Plaza, 143, BAPS Cir, nr. BAPS, Bhadreshwar Society, Shahibag, Ahmedabad, Gujarat 380004, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "19:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "19:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Orbit%20Multiprint&query_place_id=ChIJT1lP4n-FXjkRK2VMvgcpjeo	2025-08-18 10:51:37.278+00	2025-08-18 10:51:37.278+00	\N
125	139	Manibhadra Enterprise( Mfg’s Of Dr File Printing)	manibhadra-enterprise-mfgs-of-dr-file-printing	Shop No, E-108, SUMEL BUSINESS PARK-6, Shahibag, Ahmedabad, Gujarat 380004, India	Ahmedabad	Gujarat	380004	9824069174	Manibhadra Enterprise( Mfg’s Of Dr File Printing) Owner	\N	Manibhadra Enterprise( Mfg’s Of Dr File Printing) Owner	manibhadra-enterprise-mfgs-of-dr-file-printing@printeasyqr.com	9824069174	Shop No, E-108, SUMEL BUSINESS PARK-6, Shahibag, Ahmedabad, Gujarat 380004, India	["Print shop", "Offset printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Manibhadra%20Enterprise(%20Mfg%E2%80%99s%20Of%20Dr%20File%20Printing)&query_place_id=ChIJgTyGy26EXjkRqtDJhEwdJE0	2025-08-18 10:51:38.062+00	2025-08-18 10:51:38.062+00	\N
126	140	Ashirwad Xerox	ashirwad-xerox	2H44+826, Chitrakar Rasiklal Parikh Marg, Opposite Sahajanand Complex, Bhatta, Paldi, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9825976559	Ashirwad Xerox Owner	\N	Ashirwad Xerox Owner	ashirwad-xerox@printeasyqr.com	9825976559	2H44+826, Chitrakar Rasiklal Parikh Marg, Opposite Sahajanand Complex, Bhatta, Paldi, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Ashirwad%20Xerox&query_place_id=ChIJZbXk2BqFXjkRQwaVnOhOKLY	2025-08-18 10:51:38.846+00	2025-08-18 10:51:38.846+00	\N
127	141	Shivam Xerox	shivam-xerox	2JP8+24H, Pushparaj Complex, Near Potalia Char Rasta, Saraspur, Ahmedabad, Gujarat 380018, India	Ahmedabad	Gujarat	380018	9409250394	Shivam Xerox Owner	\N	Shivam Xerox Owner	shivam-xerox@printeasyqr.com	9409250394	2JP8+24H, Pushparaj Complex, Near Potalia Char Rasta, Saraspur, Ahmedabad, Gujarat 380018, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shivam%20Xerox&query_place_id=ChIJWx0zY52GXjkRrP3MNfLAK1w	2025-08-18 10:51:39.632+00	2025-08-18 10:51:39.632+00	\N
128	142	UDGGAM PRINT	udggam-print	1,GROUND FLOOR,CENTURY MARKET, CHAR RASTA, next to THE CENTRAL MALL, nr. AMBAVADI, Ambawadi, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	8264843297	UDGGAM PRINT Owner	\N	UDGGAM PRINT Owner	udggam-print@printeasyqr.com	8264843297	1,GROUND FLOOR,CENTURY MARKET, CHAR RASTA, next to THE CENTRAL MALL, nr. AMBAVADI, Ambawadi, Ahmedabad, Gujarat 380006, India	["Print shop"]	[]	[]	[]	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	f	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=UDGGAM%20PRINT&query_place_id=ChIJ9SmNArGFXjkRUzEPZYITxMs	2025-08-18 10:51:40.419+00	2025-08-18 11:03:59.076+00	\N
2	7	Janta Xerox - Digital Printing	janta-xerox-digital-printing	2, Anand Shopping Center, BRTS, Bhairavnath Rd, opp. Bhairavnath, Rambagh, Maninagar, Ahmedabad, Gujarat 380028, India	Ahmedabad	Gujarat	380028	9898397056	Janta Xerox - Digital Printing Owner	\N	Janta Xerox - Digital Printing Owner	janta-xerox-digital-printing@printeasyqr.com	9898397056	2, Anand Shopping Center, BRTS, Bhairavnath Rd, opp. Bhairavnath, Rambagh, Maninagar, Ahmedabad, Gujarat 380028, India	["Digital printing service", "Bookbinder", "Graphic designer", "Invitation printing service", "Lamination service", "Screen printing shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "15:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Janta%20Xerox%20-%20Digital%20Printing&query_place_id=ChIJ8_qnyIqEXjkR8Xtmhlvw4wA	2025-08-18 10:36:51.843+00	2025-08-18 10:36:51.843+00	\N
7	12	Janta Xerox - Digital Printing	janta-xerox-digital-printing-1	2, Anand Shopping Center, BRTS, Bhairavnath Rd, opp. Bhairavnath, Rambagh, Maninagar, Ahmedabad, Gujarat 380028, India	Ahmedabad	Gujarat	380028	9898397056	Janta Xerox - Digital Printing Owner	\N	Janta Xerox - Digital Printing Owner	janta-xerox-digital-printing-1@printeasyqr.com	9898397056	2, Anand Shopping Center, BRTS, Bhairavnath Rd, opp. Bhairavnath, Rambagh, Maninagar, Ahmedabad, Gujarat 380028, India	["Digital printing service", "Bookbinder", "Graphic designer", "Invitation printing service", "Lamination service", "Screen printing shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "15:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "21:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Janta%20Xerox%20-%20Digital%20Printing&query_place_id=ChIJ8_qnyIqEXjkR8Xtmhlvw4wA	2025-08-18 10:42:49.878+00	2025-08-18 10:42:49.878+00	\N
11	16	Saniya Colour Xerox	saniya-colour-xerox	Shop No:#29, Alishan Complex, Lalbhai Kundiwala Marg, Danilimda, Ahmedabad, Gujarat 380028, India	Ahmedabad	Gujarat	380028	9898298166	Saniya Colour Xerox Owner	\N	Saniya Colour Xerox Owner	saniya-colour-xerox@printeasyqr.com	9898298166	Shop No:#29, Alishan Complex, Lalbhai Kundiwala Marg, Danilimda, Ahmedabad, Gujarat 380028, India	["Print shop", "Fax service", "Lamination service"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Saniya%20Colour%20Xerox&query_place_id=ChIJg3VlNL2FXjkRNodNkCCcqnI	2025-08-18 10:42:56.436+00	2025-08-18 10:42:56.436+00	\N
12	17	Krishna Xerox and Thesis Binding	krishna-xerox-and-thesis-binding	SHOP NO,4, JL Complex, JAWAHAR CHOWK CHAR RASTA, Bhairavnath Rd, near ILAJ MEDICAL, Balvatika, Maninagar East, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	7778844446	Krishna Xerox and Thesis Binding Owner	\N	Krishna Xerox and Thesis Binding Owner	krishna-xerox-and-thesis-binding@printeasyqr.com	7778844446	SHOP NO,4, JL Complex, JAWAHAR CHOWK CHAR RASTA, Bhairavnath Rd, near ILAJ MEDICAL, Balvatika, Maninagar East, Maninagar, Ahmedabad, Gujarat 380008, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "13:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Krishna%20Xerox%20and%20Thesis%20Binding&query_place_id=ChIJwRD-w-eFXjkR2y6ogobDIP4	2025-08-18 10:42:59.393+00	2025-08-18 10:42:59.393+00	\N
15	22	Mahakali Xerox	mahakali-xerox	2HR8+4RM, Mahakali Xerox Sundhiya, Gam, Vadnagar, Gujarat 384355, India	Vadnagar, Ahmedabad	Gujarat	384355	7359105661	Mahakali Xerox Owner	\N	Mahakali Xerox Owner	mahakali-xerox@printeasyqr.com	7359105661	2HR8+4RM, Mahakali Xerox Sundhiya, Gam, Vadnagar, Gujarat 384355, India	["Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Mahakali%20Xerox&query_place_id=ChIJu78SbQeFXjkRbwFwUSXI4xI	2025-08-18 10:43:08.746+00	2025-08-18 10:43:08.746+00	\N
24	31	SONAL XEROX	sonal-xerox-3	14/15, Swastik Super Market, Sales India Lane, 14/15, Ashram Rd, Navrangpura, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	9879425285	SONAL XEROX Owner	\N	SONAL XEROX Owner	sonal-xerox-3@printeasyqr.com	9879425285	14/15, Swastik Super Market, Sales India Lane, 14/15, Ashram Rd, Navrangpura, Ahmedabad, Gujarat 380008, India	["Copy shop", "Commercial printer", "Digital printer", "Digital printing service", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=SONAL%20XEROX&query_place_id=ChIJewBWjfaEXjkRtoEmPi6b3-4	2025-08-18 10:43:37.324+00	2025-08-18 10:43:37.324+00	\N
30	39	Radhe Graphics and Printing, Naranpura, Ahmedabad I Xerox, Offset printer, Visiting Card, Brochure, envelope, flyer printing	radhe-graphics-and-printing-naranpura-ahmedabad-i-xerox-offset-printer-visiting-card-brochure-envelope-flyer-printing	FF-5, Char Rasta, Shopping Villa, nr. Super Bazar, Sundar Nagar, Naranpura, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9825744288	Radhe Graphics and Printing, Naranpura, Ahmedabad I Xerox, Offset printer, Visiting Card, Brochure, envelope, flyer printing Owner	\N	Radhe Graphics and Printing, Naranpura, Ahmedabad I Xerox, Offset printer, Visiting Card, Brochure, envelope, flyer printing Owner	radhe-graphics-and-printing-naranpura-ahmedabad-i-xerox-offset-printer-visiting-card-brochure-envelope-flyer-printing@printeasyqr.com	9825744288	FF-5, Char Rasta, Shopping Villa, nr. Super Bazar, Sundar Nagar, Naranpura, Ahmedabad, Gujarat 380013, India	["Print shop", "Digital printer", "Graphic designer", "Offset printing service", "Screen printer", "Sticker manufacturer"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Radhe%20Graphics%20and%20Printing%2C%20Naranpura%2C%20Ahmedabad%20I%20Xerox%2C%20Offset%20printer%2C%20Visiting%20Card%2C%20Brochure%2C%20envelope%2C%20flyer%20printing&query_place_id=ChIJq6qqqp2EXjkRHQIrP7lYPUo	2025-08-18 10:44:07.015+00	2025-08-18 10:44:07.015+00	\N
35	44	Dev Copy	dev-copy	19-20, Vishwa Kosh Marg, Shanti Nagar, Usmanpura, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9924349653	Dev Copy Owner	\N	Dev Copy Owner	dev-copy@printeasyqr.com	9924349653	19-20, Vishwa Kosh Marg, Shanti Nagar, Usmanpura, Ahmedabad, Gujarat 380013, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:30", "close": "17:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dev%20Copy&query_place_id=ChIJF-bYLoiEXjkRhmMBh_GgXHs	2025-08-18 10:44:28.814+00	2025-08-18 10:44:28.814+00	\N
18	25	Swastik Xerox	swastik-xerox	Anupam Complex, Swastik Cross Road, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9426189957	Swastik Xerox Owner	\N	Swastik Xerox Owner	swastik-xerox@printeasyqr.com	9426189957	Anupam Complex, Swastik Cross Road, Swastik Society Cross Rd, Swastik Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Copy shop", "Pen store"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Swastik%20Xerox&query_place_id=ChIJc_wpOfOEXjkRAyrdBm1_RJU	2025-08-18 10:43:16.936+00	2025-08-18 10:43:16.936+00	\N
83	97	Deepak Copiers And Printers	deepak-copiers-and-printers	Main Gate, opp. Gujarat College, Ellisbridge, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9723227227	Deepak Copiers And Printers Owner	\N	Deepak Copiers And Printers Owner	deepak-copiers-and-printers@printeasyqr.com	9723227227	Main Gate, opp. Gujarat College, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Deepak%20Copiers%20And%20Printers&query_place_id=ChIJ04JY55yFXjkRf8m8vYRJfWs	2025-08-18 10:49:47.437+00	2025-08-18 10:49:47.437+00	\N
89	103	Sneha Copier	sneha-copier	Darpan Six Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380014, India	Ahmedabad	Gujarat	380014	8140448399	Sneha Copier Owner	\N	Sneha Copier Owner	sneha-copier@printeasyqr.com	8140448399	Darpan Six Rd, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380014, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "11:00", "close": "17:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Sneha%20Copier&query_place_id=ChIJFbbQSZCEXjkRdqmuGaCCDus	2025-08-18 10:49:52.041+00	2025-08-18 10:49:52.041+00	\N
45	54	Swastik Xerox	swastik-xerox-1	Shop No -1upper, Leval Tempal, Dharnidhar Derasar, Dharnidhar Cross Rd, Dharnidhar Society, Lavanya Society, Vasna, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9426189957	Swastik Xerox Owner	\N	Swastik Xerox Owner	swastik-xerox-1@printeasyqr.com	9426189957	Shop No -1upper, Leval Tempal, Dharnidhar Derasar, Dharnidhar Cross Rd, Dharnidhar Society, Lavanya Society, Vasna, Ahmedabad, Gujarat 380007, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "17:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Swastik%20Xerox&query_place_id=ChIJO21ooQuFXjkRT9MlLq1l-n4	2025-08-18 10:45:23.355+00	2025-08-18 10:45:23.355+00	\N
47	56	Sanjay Telecom Xerox	sanjay-telecom-xerox	51, Pankaj Society, Bhatta, Paldi, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9428601475	Sanjay Telecom Xerox Owner	\N	Sanjay Telecom Xerox Owner	sanjay-telecom-xerox@printeasyqr.com	9428601475	51, Pankaj Society, Bhatta, Paldi, Ahmedabad, Gujarat 380007, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Sanjay%20Telecom%20Xerox&query_place_id=ChIJie7ttRqFXjkRVN2eI1O4oXM	2025-08-18 10:45:31.178+00	2025-08-18 10:45:31.178+00	\N
48	58	Saloni Enterprise Stationary and Xerox Ro plant Sales & service	saloni-enterprise-stationary-and-xerox-ro-plant-sales-service	Shop No - 16,G/F Swaminarayan Park 2, NR. Popular Wheelar Service B/H. G.B, shah College, Vasna, Ahmedabad, Gujarat 380007, India	Ahmedabad	Gujarat	380007	9909890907	Saloni Enterprise Stationary and Xerox Ro plant Sales & service Owner	\N	Saloni Enterprise Stationary and Xerox Ro plant Sales & service Owner	saloni-enterprise-stationary-and-xerox-ro-plant-sales-service@printeasyqr.com	9909890907	Shop No - 16,G/F Swaminarayan Park 2, NR. Popular Wheelar Service B/H. G.B, shah College, Vasna, Ahmedabad, Gujarat 380007, India	["Print shop", "Pen store", "Water purification company", "Water treatment supplier"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Saloni%20Enterprise%20Stationary%20and%20Xerox%20Ro%20plant%20Sales%20%26%20service&query_place_id=ChIJs-0URBiFXjkRgPgOPXZC16I	2025-08-18 10:45:45.27+00	2025-08-18 10:45:45.27+00	\N
52	62	Gandhi Xerox	gandhi-xerox	F-5,Sundar Gopal Complex,Ambawadi Circle,Ambawadi, Panchavati Rd, opposite centro mall, Panchavati Society, Gulbai Tekra, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	7228818844	Gandhi Xerox Owner	\N	Gandhi Xerox Owner	gandhi-xerox@printeasyqr.com	7228818844	F-5,Sundar Gopal Complex,Ambawadi Circle,Ambawadi, Panchavati Rd, opposite centro mall, Panchavati Society, Gulbai Tekra, Ahmedabad, Gujarat 380006, India	["Digital printing service", "Bookbinder", "Digital printer", "Lamination service", "Offset printing service", "Print shop", "Screen printing shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:30", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Gandhi%20Xerox&query_place_id=ChIJ____P_iEXjkRU9MlIW8vc9Y	2025-08-18 10:46:10.401+00	2025-08-18 10:46:10.401+00	\N
57	69	Shree Hari Xerox	shree-hari-xerox	Dhanlaxmi Market,, Relief Rd, Revdi Bazar, Kalupur, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	6353674054	Shree Hari Xerox Owner	\N	Shree Hari Xerox Owner	shree-hari-xerox@printeasyqr.com	6353674054	Dhanlaxmi Market,, Relief Rd, Revdi Bazar, Kalupur, Ahmedabad, Gujarat 380001, India	["Copy shop", "Copying supply store", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "11:00", "close": "21:30", "closed": false, "is24Hours": false}, "monday": {"open": "11:00", "close": "21:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "11:00", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "11:00", "close": "21:30", "closed": false, "is24Hours": false}, "thursday": {"open": "11:00", "close": "21:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "11:00", "close": "21:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shree%20Hari%20Xerox&query_place_id=ChIJbSPzITGEXjkRbesm6GsPlXE	2025-08-18 10:46:42.394+00	2025-08-18 10:46:42.394+00	\N
60	73	VINAYAK PRINTS	vinayak-prints	Natvar Flat, A-6, opp. Yamunaji Haveli, Bhaduat Nagar, Janpath Society, Bhadwatnagar, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	6353757677	VINAYAK PRINTS Owner	\N	VINAYAK PRINTS Owner	vinayak-prints@printeasyqr.com	6353757677	Natvar Flat, A-6, opp. Yamunaji Haveli, Bhaduat Nagar, Janpath Society, Bhadwatnagar, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printer", "Digital printing service", "Invitation printing service", "Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "13:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=VINAYAK%20PRINTS&query_place_id=ChIJD7ObL-aFXjkR7gq4esuSD8k	2025-08-18 10:47:07.329+00	2025-08-18 10:47:07.329+00	\N
62	76	Jay Ambe Xerox	jay-ambe-xerox	17,G.F,Avani complex,Naranpura, Ahmedabad, Gujarat 380013, India	Ahmedabad	Gujarat	380013	9898089019	Jay Ambe Xerox Owner	\N	Jay Ambe Xerox Owner	jay-ambe-xerox@printeasyqr.com	9898089019	17,G.F,Avani complex,Naranpura, Ahmedabad, Gujarat 380013, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "08:00", "close": "12:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Jay%20Ambe%20Xerox&query_place_id=ChIJM7Z5uJuEXjkR-dke6Hm4GUA	2025-08-18 10:47:28.107+00	2025-08-18 10:47:28.107+00	\N
65	79	Mahavir Xerox	mahavir-xerox	Shreyas Complex, Bus Stop, 119, opposite Jain Derasar, nr. Navrangpura, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	7926400502	Mahavir Xerox Owner	\N	Mahavir Xerox Owner	mahavir-xerox@printeasyqr.com	7926400502	Shreyas Complex, Bus Stop, 119, opposite Jain Derasar, nr. Navrangpura, Navrangpura, Ahmedabad, Gujarat 380009, India	["Copy shop", "Office services"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:30", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Mahavir%20Xerox&query_place_id=ChIJ____P_WEXjkR7MZe65FztL8	2025-08-18 10:49:31.61+00	2025-08-18 10:49:31.61+00	\N
71	85	Rajesh Xerox	rajesh-xerox	UL-29, Samudra Complex, Above Saffron Hotel, C.G.Road, Saffron Hotel, Umashankar Joshi Marg, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9825699555	Rajesh Xerox Owner	\N	Rajesh Xerox Owner	rajesh-xerox@printeasyqr.com	9825699555	UL-29, Samudra Complex, Above Saffron Hotel, C.G.Road, Saffron Hotel, Umashankar Joshi Marg, Vasant Vihar, Navrangpura, Ahmedabad, Gujarat 380006, India	["Print shop", "Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Rajesh%20Xerox&query_place_id=ChIJVUp4Z0yEXjkRnppkVqPlrSE	2025-08-18 10:49:36.677+00	2025-08-18 10:49:36.677+00	\N
77	91	Khushboo Copiers	khushboo-copiers	Ankur Chambers, Opp. Hasubhai Chambers, Behind Town Hall, Surendra Mangaldas Rd, Ellisbridge, Ahmedabad, Gujarat 380006, India	Ahmedabad	Gujarat	380006	9228207149	Khushboo Copiers Owner	\N	Khushboo Copiers Owner	khushboo-copiers@printeasyqr.com	9228207149	Ankur Chambers, Opp. Hasubhai Chambers, Behind Town Hall, Surendra Mangaldas Rd, Ellisbridge, Ahmedabad, Gujarat 380006, India	["Digital printer"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Khushboo%20Copiers&query_place_id=ChIJYzB2eVaEXjkREUhA_iTPE3E	2025-08-18 10:49:42.238+00	2025-08-18 10:49:42.238+00	\N
79	93	Raj Xerox	raj-xerox	1, Saroadar Patel Chambers, 1, near Natraj Hotel, opposite Treasury Office, Old City, Lal Darwaja, Ahmedabad, Gujarat 380001, India	Ahmedabad	Gujarat	380001	7383043404	Raj Xerox Owner	\N	Raj Xerox Owner	raj-xerox@printeasyqr.com	7383043404	1, Saroadar Patel Chambers, 1, near Natraj Hotel, opposite Treasury Office, Old City, Lal Darwaja, Ahmedabad, Gujarat 380001, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Raj%20Xerox&query_place_id=ChIJn6TWVlCEXjkRzrbyjI7Xc64	2025-08-18 10:49:43.78+00	2025-08-18 10:49:43.78+00	\N
90	104	Dwarkesh Stationers - Art Xerox - Manish Electricals	dwarkesh-stationers-art-xerox-manish-electricals	BLOCK-A, Drive In Rd, N.K.Group Society, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9328282744	Dwarkesh Stationers - Art Xerox - Manish Electricals Owner	\N	Dwarkesh Stationers - Art Xerox - Manish Electricals Owner	dwarkesh-stationers-art-xerox-manish-electricals@printeasyqr.com	9328282744	BLOCK-A, Drive In Rd, N.K.Group Society, Sarvottam Nagar Society, Navrangpura, Ahmedabad, Gujarat 380009, India	["Print shop", "Electrical supply store", "Lamination service", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Dwarkesh%20Stationers%20-%20Art%20Xerox%20-%20Manish%20Electricals&query_place_id=ChIJSRUst5OEXjkRowvAYprgNq4	2025-08-18 10:49:53.053+00	2025-08-18 10:49:53.053+00	\N
95	109	Jay Ambe Stationery & Xerox Stores	jay-ambe-stationery-xerox-stores	2G7M+WFC, Maa Anandmayi Marg, Satellite, Shyamal, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9375973370	Jay Ambe Stationery & Xerox Stores Owner	\N	Jay Ambe Stationery & Xerox Stores Owner	jay-ambe-stationery-xerox-stores@printeasyqr.com	9375973370	2G7M+WFC, Maa Anandmayi Marg, Satellite, Shyamal, Ahmedabad, Gujarat 380015, India	["Copy shop", "Stationery store"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Jay%20Ambe%20Stationery%20%26%20Xerox%20Stores&query_place_id=ChIJ50ikNdiEXjkRj7CyD561LPg	2025-08-18 10:49:57.105+00	2025-08-18 10:49:57.105+00	\N
53	63	Kunal Xerox	kunal-xerox	Near Standard Chartered Bank, Navrangpura, Mithakhali Six Rd, Mithakhali, Ellisbridge, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9428113511	Kunal Xerox Owner	\N	Kunal Xerox Owner	kunal-xerox@printeasyqr.com	9428113511	Near Standard Chartered Bank, Navrangpura, Mithakhali Six Rd, Mithakhali, Ellisbridge, Ahmedabad, Gujarat 380009, India	["Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "18:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Kunal%20Xerox&query_place_id=ChIJe52MuvaEXjkRzUN_VBYl5Do	2025-08-18 10:46:16.777+00	2025-08-18 10:46:16.777+00	\N
101	115	Getway Xerox	getway-xerox	3, Shiv Shyam Complex, University Rd, opposite L.D Engineering Hostel, near S.S Book Stall, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380015, India	Ahmedabad	Gujarat	380015	9427623905	Getway Xerox Owner	\N	Getway Xerox Owner	getway-xerox@printeasyqr.com	9427623905	3, Shiv Shyam Complex, University Rd, opposite L.D Engineering Hostel, near S.S Book Stall, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380015, India	["Print shop", "Bookbinder", "Copy shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "10:00", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "08:30", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Getway%20Xerox&query_place_id=ChIJ53zk4uuEXjkRARnsb1gD53M	2025-08-18 10:51:16.682+00	2025-08-18 10:51:16.682+00	\N
107	121	Shree Krishna Copiar	shree-krishna-copiar	Gulbai Tekra Rd, Gangotri Society, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380009, India	Ahmedabad	Gujarat	380009	9925727458	Shree Krishna Copiar Owner	\N	Shree Krishna Copiar Owner	shree-krishna-copiar@printeasyqr.com	9925727458	Gulbai Tekra Rd, Gangotri Society, Hollywood Basti, Gulbai Tekra, Ahmedabad, Gujarat 380009, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:15", "close": "21:30", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Shree%20Krishna%20Copiar&query_place_id=ChIJWYJZaemEXjkRVQyy-lcsC2E	2025-08-18 10:51:21.441+00	2025-08-18 10:51:21.441+00	\N
3	8	Sonal Xerox	sonal-xerox	Mandir Complex, Gf2, Bhairavnath Rd, Opposite Jai Hind School, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	7925351716	Sonal Xerox Owner	\N	Sonal Xerox Owner	sonal-xerox@printeasyqr.com	7925351716	Mandir Complex, Gf2, Bhairavnath Rd, Opposite Jai Hind School, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Sonal%20Xerox&query_place_id=ChIJP792K-eFXjkRW3AXG9zy_XY	2025-08-18 10:40:37.285+00	2025-08-18 10:40:37.285+00	\N
4	9	Sonal Xerox	sonal-xerox-1	Mandir Complex, Gf2, Bhairavnath Rd, Opposite Jai Hind School, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	Ahmedabad	Gujarat	380008	7925351716	Sonal Xerox Owner	\N	Sonal Xerox Owner	sonal-xerox-1@printeasyqr.com	7925351716	Mandir Complex, Gf2, Bhairavnath Rd, Opposite Jai Hind School, Panchvati Society, Daxini Society, Maninagar, Ahmedabad, Gujarat 380008, India	["Digital printing service"]	[]	\N	\N	\N	\N	{"friday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "monday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "sunday": {"open": "", "close": "", "closed": true, "is24Hours": false}, "tuesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "saturday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "thursday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "10:00", "close": "20:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Sonal%20Xerox&query_place_id=ChIJP792K-eFXjkRW3AXG9zy_XY	2025-08-18 10:42:44.287+00	2025-08-18 10:42:44.287+00	\N
113	127	Ambica Xerox	ambica-xerox	Shop No. 4, First Floor Opp. U. N. Mehta Heart Hospital New Civil Hospital, Asarwa, Shahibag, Ahmedabad, Gujarat 380016, India	Ahmedabad	Gujarat	380016	8320920065	Ambica Xerox Owner	\N	Ambica Xerox Owner	ambica-xerox@printeasyqr.com	8320920065	Shop No. 4, First Floor Opp. U. N. Mehta Heart Hospital New Civil Hospital, Asarwa, Shahibag, Ahmedabad, Gujarat 380016, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "14:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "19:30", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Ambica%20Xerox&query_place_id=ChIJo_73EBeFXjkRkQzFbCqfc5U	2025-08-18 10:51:27.61+00	2025-08-18 10:51:27.61+00	\N
119	133	Burhani Xerox	burhani-xerox	Naroda Road, Opp. Amdupura Petroleum, nr. Vohra na roja, Amdupura, Ahmedabad, Gujarat 380018, India	Ahmedabad	Gujarat	380018	9106202561	Burhani Xerox Owner	\N	Burhani Xerox Owner	burhani-xerox@printeasyqr.com	9106202561	Naroda Road, Opp. Amdupura Petroleum, nr. Vohra na roja, Amdupura, Ahmedabad, Gujarat 380018, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "18:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=Burhani%20Xerox&query_place_id=ChIJDR_0L4-FXjkRD8Q7fbZnxmo	2025-08-18 10:51:33.091+00	2025-08-18 10:51:33.091+00	\N
54	64	S P xerox	s-p-xerox	New Cloth Market, 26, Cabin No, Raipur, near 512, Ahmedabad, Gujarat 380025, India	Ahmedabad	Gujarat	380025	9898309898	S P xerox Owner	\N	S P xerox Owner	s-p-xerox@printeasyqr.com	9898309898	New Cloth Market, 26, Cabin No, Raipur, near 512, Ahmedabad, Gujarat 380025, India	["Print shop"]	[]	\N	\N	\N	\N	{"friday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "monday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "sunday": {"open": "09:00", "close": "15:00", "closed": false, "is24Hours": false}, "tuesday": {"open": "09:00", "close": "21:30", "closed": false, "is24Hours": false}, "saturday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "thursday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}, "wednesday": {"open": "09:00", "close": "21:00", "closed": false, "is24Hours": false}}	t	t	t	t	t	active	\N	0	\N	https://www.google.com/maps/search/?api=1&query=S%20P%20xerox&query_place_id=ChIJTXRxuv-HXjkR3iqsjg_KD-I	2025-08-18 10:46:19.523+00	2025-08-18 10:46:19.523+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, phone, name, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
18	0000091004	Dhwani Zerox Centre Owner	dhwani-zerox-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:01.379+00	2025-08-18 10:56:37.949+00
19	0000091005	Shraddha Xerox Owner	shraddha-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:03.874+00	2025-08-18 10:56:37.949+00
20	0000092004	Shree Umiya Xerox Owner	shree-umiya-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:06.125+00	2025-08-18 10:56:37.949+00
22	0000091711	Mahakali Xerox Owner	mahakali-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:08.503+00	2025-08-18 10:56:37.949+00
23	0000091006	Radhe xerox Owner	radhe-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:11.234+00	2025-08-18 10:56:37.949+00
24	0000092005	Meet Xerox Owner	meet-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:13.724+00	2025-08-18 10:56:37.949+00
25	0000091007	Swastik Xerox Owner	swastik-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:16.677+00	2025-08-18 10:56:37.949+00
26	0000092006	NAVRANG XEROX Owner	navrang-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:19.411+00	2025-08-18 10:56:37.949+00
27	0000091008	Morari Jumbo Xerox Centre Owner	morari-jumbo-xerox-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:22.603+00	2025-08-18 10:56:37.949+00
28	0000092007	Urgent Thesis { Shree Krishna xerox } Owner	urgent-thesis-shree-krishna-xerox-@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:25.55+00	2025-08-18 10:56:37.949+00
29	0000091009	Patel Stationers & Xerox Owner	patel-stationers-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:28.993+00	2025-08-18 10:56:37.949+00
30	0000091010	SONAL XEROX Owner	sonal-xerox-2@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:33.154+00	2025-08-18 10:56:37.949+00
31	0000092008	SONAL XEROX Owner	sonal-xerox-3@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:37.082+00	2025-08-18 10:56:37.949+00
32	0000092009	Krishna xerox Owner	krishna-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:40.524+00	2025-08-18 10:56:37.949+00
33	0000091011	Khushboo Xerox Owner	khushboo-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:44.458+00	2025-08-18 10:56:37.949+00
35	0000092010	VEERTI XEROX AND STATIONERY Owner	veerti-xerox-and-stationery@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:49.897+00	2025-08-18 10:56:37.949+00
36	0000092012	Star Xerox Owner	star-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:54.055+00	2025-08-18 10:56:37.949+00
37	0000091012	Vijay Xerox Owner	vijay-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:57.962+00	2025-08-18 10:56:37.949+00
38	0000092013	Harish Duplicators (Rubber Stamp & Xerox Store) Owner	harish-duplicators-rubber-stamp-xerox-store@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:02.109+00	2025-08-18 10:56:37.949+00
39	0000092014	Radhe Graphics and Printing, Naranpura, Ahmedabad I Xerox, Offset printer, Visiting Card, Brochure, envelope, flyer printing Owner	radhe-graphics-and-printing-naranpura-ahmedabad-i-xerox-offset-printer-visiting-card-brochure-envelope-flyer-printing@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:06.772+00	2025-08-18 10:56:37.949+00
41	0000091013	Dheeraa Prints - Xerox Owner	dheeraa-prints-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:13.16+00	2025-08-18 10:56:37.949+00
42	0000092015	Girish Xerox And Stationery Owner	girish-xerox-and-stationery@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:18.08+00	2025-08-18 10:56:37.949+00
43	0000092016	H.P. Xerox Owner	hp-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:23.217+00	2025-08-18 10:56:37.949+00
44	0000092017	Dev Copy Owner	dev-copy@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:28.572+00	2025-08-18 10:56:37.949+00
46	0000091014	Shardul Printing Press Owner	shardul-printing-press@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:38.827+00	2025-08-18 10:56:37.949+00
47	0000091015	Precious Business Systems Owner	precious-business-systems@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:43.705+00	2025-08-18 10:56:37.949+00
49	0000092019	my print solutions Owner	my-print-solutions@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:51.915+00	2025-08-18 10:56:37.949+00
50	0000092020	Shreeji Copiers & Stationers Owner	shreeji-copiers-stationers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:58.022+00	2025-08-18 10:56:37.949+00
51	0000092021	Ambika Xerox Owner	ambika-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:04.343+00	2025-08-18 10:56:37.949+00
52	0000092022	Umiya Xerox And Stationeries Owner	umiya-xerox-and-stationeries@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:10.931+00	2025-08-18 10:56:37.949+00
53	0000092023	New Maheshwari Copiers Owner	new-maheshwari-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:17.757+00	2025-08-18 10:56:37.949+00
54	0000091016	Swastik Xerox Owner	swastik-xerox-1@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:23.112+00	2025-08-18 10:56:37.949+00
56	0000091017	Sanjay Telecom Xerox Owner	sanjay-telecom-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:30.936+00	2025-08-18 10:56:37.949+00
57	0000092024	Pooja Xerox Owner	pooja-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:37.987+00	2025-08-18 10:56:37.949+00
58	0000092025	Saloni Enterprise Stationary and Xerox Ro plant Sales & service Owner	saloni-enterprise-stationary-and-xerox-ro-plant-sales-service@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:45.028+00	2025-08-18 10:56:37.949+00
59	0000091018	Giriraj Copier Owner	giriraj-copier@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:50.642+00	2025-08-18 10:56:37.949+00
60	0000092026	Chaitanya Xerox Owner	chaitanya-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:58.191+00	2025-08-18 10:56:37.949+00
55	9106202562	HAPPY XEROX Owner	happy-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:45:25.579+00	2025-08-18 10:56:37.949+00
34	9824234567	Hastmilap Xerox Owner	hastmilap-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:46.214+00	2025-08-18 10:56:37.949+00
45	0000092018	shivanya digital Owner	shivanya-digital@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:34.192+00	2025-08-18 10:56:37.949+00
61	0000091019	Mahavir Xerox and Stationery Owner	mahavir-xerox-and-stationery@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:04.037+00	2025-08-18 10:56:37.949+00
62	0000091020	Gandhi Xerox Owner	gandhi-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:10.158+00	2025-08-18 10:56:37.949+00
63	0000091021	Kunal Xerox Owner	kunal-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:16.534+00	2025-08-18 10:56:37.949+00
65	1234567007	JAY XEROX Owner	jay-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:22.279+00	2025-08-18 10:56:37.949+00
66	0000092027	Sony Xerox Center Owner	sony-xerox-center@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:29.838+00	2025-08-18 10:56:37.949+00
67	0000092028	Classic Xerox & Online Multilink Services Owner	classic-xerox-online-multilink-services@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:37.892+00	2025-08-18 10:56:37.949+00
69	0000091611	Shree Hari Xerox Owner	shree-hari-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:42.151+00	2025-08-18 10:56:37.949+00
70	0000091022	Dharmendra Xerox Owner	dharmendra-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:48.748+00	2025-08-18 10:56:37.949+00
71	0000092029	New Mahakali Xerox- ₹1 per Page(Both Sides) Owner	new-mahakali-xerox-1-per-pageboth-sides@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:57.038+00	2025-08-18 10:56:37.949+00
73	0000091023	VINAYAK PRINTS Owner	vinayak-prints@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:47:07.086+00	2025-08-18 10:56:37.949+00
74	1234567010	Kalyani Xerox Copy Lamination Stationery Shop Owner	kalyani-xerox-copy-lamination-stationery-shop@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:47:10.794+00	2025-08-18 10:56:37.949+00
75	0000092030	KIRTI XEROX AND STATIONERY Owner	kirti-xerox-and-stationery@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:47:19.079+00	2025-08-18 10:56:37.949+00
76	0000092031	Jay Ambe Xerox Owner	jay-ambe-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:47:27.863+00	2025-08-18 10:56:37.949+00
77	9898645689	Jay Ambe Xerox and Stationary Owner	jay-ambe-xerox-and-stationary@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:29.304+00	2025-08-18 10:56:37.949+00
78	9712602123	Parshwanath Xerox Copy Centre Owner	parshwanath-xerox-copy-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:30.606+00	2025-08-18 10:56:37.949+00
79	7926400502	Mahavir Xerox Owner	mahavir-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:31.374+00	2025-08-18 10:56:37.949+00
80	9898393221	Jalaram Xerox Owner	jalaram-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:32.144+00	2025-08-18 10:56:37.949+00
81	9427621991	Jaya Xerox Owner	jaya-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:33.376+00	2025-08-18 10:56:37.949+00
82	9824003564	PATEL COLOUR XEROX Owner	patel-colour-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:34.14+00	2025-08-18 10:56:37.949+00
83	7926406868	Chaudhari Xerox Owner	chaudhari-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:34.912+00	2025-08-18 10:56:37.949+00
84	8487870611	Kutbi Xerox, Print and Lamination Shop Owner	kutbi-xerox-print-and-lamination-shop@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:35.675+00	2025-08-18 10:56:37.949+00
85	9825699555	Rajesh Xerox Owner	rajesh-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:36.442+00	2025-08-18 10:56:37.949+00
86	6355065909	New best Xerox Owner	new-best-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:37.441+00	2025-08-18 10:56:37.949+00
87	8866119119	VARDHMAN THE DIGITAL PRINT SHOP Owner	vardhman-the-digital-print-shop@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:38.22+00	2025-08-18 10:56:37.949+00
88	7940041024	Shree Padmavati Xerox Centre Owner	shree-padmavati-xerox-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:38.992+00	2025-08-18 10:56:37.949+00
89	9974984570	Shri Umiya Xerox Owner	shri-umiya-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:40.229+00	2025-08-18 10:56:37.949+00
90	9726275475	Navkar Copiers Owner	navkar-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:41.231+00	2025-08-18 10:56:37.949+00
91	9228207149	Khushboo Copiers Owner	khushboo-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:42.002+00	2025-08-18 10:56:37.949+00
92	7600109894	Honest Xerox Owner	honest-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:42.778+00	2025-08-18 10:56:37.949+00
93	7383043404	Raj Xerox Owner	raj-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:43.545+00	2025-08-18 10:56:37.949+00
94	9377773387	Bhagvati Colour Xerox Owner	bhagvati-colour-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:44.314+00	2025-08-18 10:56:37.949+00
95	9898309897	CYBERA PRINT ART Owner	cybera-print-art@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:45.425+00	2025-08-18 10:56:37.949+00
96	7778844446	Thesis binding (radhe xerox) Owner	thesis-binding-radhe-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:46.438+00	2025-08-18 10:56:37.949+00
97	9723227227	Deepak Copiers And Printers Owner	deepak-copiers-and-printers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:47.202+00	2025-08-18 10:56:37.949+00
98	9327081009	Kunal Print Pallet Owner	kunal-print-pallet@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:47.968+00	2025-08-18 10:56:37.949+00
99	9157749267	Navkar prints Owner	navkar-prints@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:48.731+00	2025-08-18 10:56:37.949+00
72	9924349654	Dev xerox Owner	dev-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:47:00.244+00	2025-08-18 10:56:37.949+00
100	7487052820	Ideal Duplicating Bureau Owner	ideal-duplicating-bureau@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:49.502+00	2025-08-18 10:56:37.949+00
68	9377773388	Gulshan Xerox Owner	gulshan-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:40.874+00	2025-08-18 10:56:37.949+00
64	9898309898	S P xerox Owner	s-p-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:46:19.277+00	2025-08-18 10:56:37.949+00
101	9624022818	SAMEER STATIONERY & XEROX Owner	sameer-stationery-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:50.266+00	2025-08-18 10:56:37.949+00
102	7926422561	Gayatri Service Centre Copy Centre Owner	gayatri-service-centre-copy-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:51.033+00	2025-08-18 10:56:37.949+00
103	8140448399	Sneha Copier Owner	sneha-copier@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:51.803+00	2025-08-18 10:56:37.949+00
104	9328282744	Dwarkesh Stationers - Art Xerox - Manish Electricals Owner	dwarkesh-stationers-art-xerox-manish-electricals@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:52.813+00	2025-08-18 10:56:37.949+00
105	9824014868	Shubham Laser Printing & Binding Owner	shubham-laser-printing-binding@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:53.583+00	2025-08-18 10:56:37.949+00
106	9712821797	Quick Copier Owner	quick-copier@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:54.579+00	2025-08-18 10:56:37.949+00
107	9978078412	Shreeji Xerox Owner	shreeji-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:55.342+00	2025-08-18 10:56:37.949+00
108	9374894022	Prima Xerox & Computer Owner	prima-xerox-computer@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:56.105+00	2025-08-18 10:56:37.949+00
109	9375973370	Jay Ambe Stationery & Xerox Stores Owner	jay-ambe-stationery-xerox-stores@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:56.87+00	2025-08-18 10:56:37.949+00
110	7926300815	Tushar Xerox Owner	tushar-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:57.632+00	2025-08-18 10:56:37.949+00
111	7940097709	Navkar Xerox Owner	navkar-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:58.395+00	2025-08-18 10:56:37.949+00
112	9825041163	Pooja Stationers & Book Depot Owner	pooja-stationers-book-depot@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:49:59.158+00	2025-08-18 10:56:37.949+00
113	9727160019	Vraj Xerox Owner	vraj-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:50:00.16+00	2025-08-18 10:56:37.949+00
114	9824013271	New Aakash Xerox Owner	new-aakash-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:15.402+00	2025-08-18 10:56:37.949+00
115	9427623905	Getway Xerox Owner	getway-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:16.44+00	2025-08-18 10:56:37.949+00
116	9825343337	Komal Copiers Owner	komal-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:17.23+00	2025-08-18 10:56:37.949+00
117	9724420000	Laxmi Copiers Owner	laxmi-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:18.019+00	2025-08-18 10:56:37.949+00
118	8653843757	PHOTO GHOR & XEROX CENTER Owner	photo-ghor-xerox-center@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:18.805+00	2025-08-18 10:56:37.949+00
119	9106952137	Xerox & Print House Owner	xerox-print-house@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:19.589+00	2025-08-18 10:56:37.949+00
120	9067330045	Login Print Shop Owner	login-print-shop@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:20.406+00	2025-08-18 10:56:37.949+00
121	9925727458	Shree Krishna Copiar Owner	shree-krishna-copiar@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:21.198+00	2025-08-18 10:56:37.949+00
122	9426606057	Akash Copiers Owner	akash-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:21.985+00	2025-08-18 10:56:37.949+00
123	7922160320	Shahji Enterprise Owner	shahji-enterprise@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:22.774+00	2025-08-18 10:56:37.949+00
124	7940074781	Niharica Xerox Owner	niharica-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:23.559+00	2025-08-18 10:56:37.949+00
125	9825069908	Royal Xerox & Printing Owner	royal-xerox-printing@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:25.555+00	2025-08-18 10:56:37.949+00
126	9909085620	Swastik Print shop and Book Stationary stor Owner	swastik-print-shop-and-book-stationary-stor@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:26.337+00	2025-08-18 10:56:37.949+00
127	8320920065	Ambica Xerox Owner	ambica-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:27.368+00	2025-08-18 10:56:37.949+00
128	9898527384	Gopal Xerox Center Owner	gopal-xerox-center@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:28.155+00	2025-08-18 10:56:37.949+00
129	9624342282	Maruti General Store & Xerox Centre Owner	maruti-general-store-xerox-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:28.943+00	2025-08-18 10:56:37.949+00
130	9824244035	Amee Xerox & Telecom Owner	amee-xerox-telecom@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:29.968+00	2025-08-18 10:56:37.949+00
131	9898116998	Vinayak Xerox Owner	vinayak-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:31.241+00	2025-08-18 10:56:37.949+00
132	7698575710	SREE XEROX ONLINE Owner	sree-xerox-online@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:32.065+00	2025-08-18 10:56:37.949+00
133	9106202561	Burhani Xerox Owner	burhani-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:32.848+00	2025-08-18 10:56:37.949+00
134	9998988870	Maruti Xerox Owner	maruti-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:33.638+00	2025-08-18 10:56:37.949+00
1	91911	gujarat xerox Owner	gujarat-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:31:38.706+00	2025-08-18 10:56:37.949+00
4	0000091911	Hello Xerox Owner	hello-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:33:28.02+00	2025-08-18 10:56:37.949+00
8	8905602840	Sonal Xerox Owner	sonal-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:40:37.031+00	2025-08-18 10:56:37.949+00
7	9898397056	Janta Xerox - Digital Printing Owner	janta-xerox-digital-printing@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:36:51.596+00	2025-08-18 10:56:37.949+00
9	0000091001	Sonal Xerox Owner	sonal-xerox-1@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:44.033+00	2025-08-18 10:56:37.949+00
10	0000091002	Hello Xerox Owner	hello-xerox-1@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:46.106+00	2025-08-18 10:56:37.949+00
11	0000091003	Shree Saikrupa Xerox Copy Center Owner	shree-saikrupa-xerox-copy-center@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:48.12+00	2025-08-18 10:56:37.949+00
12	0000092011	Janta Xerox - Digital Printing Owner	janta-xerox-digital-printing-1@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:49.635+00	2025-08-18 10:56:37.949+00
13	0000092001	Radhey Xerox and Stationary - Best Digital Printing Shop in Maninagar | Lamination Remove & Hard Binding Shop in Maninagar Owner	radhey-xerox-and-stationary-best-digital-printing-shop-in-maninagar-lamination-remove-hard-binding-shop-in-maninagar@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:51.149+00	2025-08-18 10:56:37.949+00
14	0000092002	Shivam Xerox Copy Centre Owner	shivam-xerox-copy-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:52.908+00	2025-08-18 10:56:37.949+00
16	0000092003	Saniya Colour Xerox Owner	saniya-colour-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:56.18+00	2025-08-18 10:56:37.949+00
17	0000091811	Krishna Xerox and Thesis Binding Owner	krishna-xerox-and-thesis-binding@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:59.15+00	2025-08-18 10:56:37.949+00
21	1234567001	LINK XEROX Owner	link-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:43:07.45+00	2025-08-18 10:56:37.949+00
15	9998887776	Parmar Xerox and Printing Owner	parmar-xerox-and-printing@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:42:54.179+00	2025-08-18 10:56:37.949+00
135	9924242632	Shiv Zerox Owner	shiv-zerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:34.428+00	2025-08-18 10:56:37.949+00
136	7940046880	Parshwa Copiers Owner	parshwa-copiers@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:35.216+00	2025-08-18 10:56:37.949+00
137	7925390169	Dudh Wala Xerox Centre Owner	dudh-wala-xerox-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:36.238+00	2025-08-18 10:56:37.949+00
138	9016528799	Orbit Multiprint Owner	orbit-multiprint@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:37.037+00	2025-08-18 10:56:37.949+00
139	9824069174	Manibhadra Enterprise( Mfg’s Of Dr File Printing) Owner	manibhadra-enterprise-mfgs-of-dr-file-printing@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:37.82+00	2025-08-18 10:56:37.949+00
140	9825976559	Ashirwad Xerox Owner	ashirwad-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:38.605+00	2025-08-18 10:56:37.949+00
141	9409250394	Shivam Xerox Owner	shivam-xerox@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:39.391+00	2025-08-18 10:56:37.949+00
142	8264843297	UDGGAM PRINT Owner	udggam-print@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:51:40.177+00	2025-08-18 10:56:37.949+00
40	9825976560	Gautam Copy Centre Owner	gautam-copy-centre@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:08.76+00	2025-08-18 10:56:37.949+00
48	9876543210	Mbabulal printery Owner	mbabulal-printery@printeasyqr.com	$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK	shop_owner	t	2025-08-18 10:44:45.931+00	2025-08-18 10:56:37.949+00
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 1, true);


--
-- Name: customer_shop_unlocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_shop_unlocks_id_seq', 6, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.shops_id_seq', 128, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 142, true);


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
-- Name: shops unique_owner_per_shop; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT unique_owner_per_shop UNIQUE (owner_id);


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
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

