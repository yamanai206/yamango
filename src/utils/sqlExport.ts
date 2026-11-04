/**
 * PostgreSQL / Supabase DDL Schema Exporter for yamango
 * Generates ready-to-run SQL for production database deployment.
 */

export const POSTGRES_DDL_SCHEMA = `
-- ========================================================================
-- YAMANGO PLATFORM DDL SCHEMA (PostgreSQL / Supabase Ready)
-- Target Region: As-Suwayda & Al-Kafr Governorate
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'lessor', 'garage', 'agent', 'admin');
CREATE TYPE zone_location AS ENUM ('al_kafr', 'suwayda', 'shahba', 'salkhad', 'al_qurayya', 'ariqa', 'mazraa');
CREATE TYPE listing_category AS ENUM ('cars', 'tractors', 'excavators', 'trucks', 'agricultural', 'heavy_machinery');
CREATE TYPE listing_operation AS ENUM ('sale', 'rent');
CREATE TYPE deal_status AS ENUM ('offer', 'agreement', 'contract_signed', 'escrow_pending', 'escrow_secured', 'delivery_pending', 'completed', 'disputed');
CREATE TYPE currency_code AS ENUM ('SYP', 'USD');
CREATE TYPE promotion_status AS ENUM ('active', 'queued', 'expired', 'cancelled');

-- 2. USERS & ROLES
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    zone zone_location NOT NULL DEFAULT 'al_kafr',
    kyc_status VARCHAR(20) DEFAULT 'unverified',
    id_card_url TEXT,
    selfie_url TEXT,
    rating_avg NUMERIC(3,2) DEFAULT 5.00,
    deals_completed INT DEFAULT 0,
    referral_code VARCHAR(30) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- 3. CERTIFIED GARAGES (Inspection Service)
CREATE TABLE garage_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    zone zone_location NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    inspection_fee_syp INT DEFAULT 150000,
    inspection_fee_usd INT DEFAULT 15,
    rating_avg NUMERIC(3,2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    subscription_plan VARCHAR(20) DEFAULT 'basic',
    subscription_active BOOLEAN DEFAULT TRUE,
    subscription_expires_at TIMESTAMPTZ,
    completed_inspections_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENT AGENTS (Escrow Cash Handlers)
CREATE TABLE payment_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agency_name VARCHAR(150) NOT NULL,
    zone zone_location NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    float_balance_syp BIGINT DEFAULT 0,
    float_balance_usd BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LISTINGS (Cars & Machinery)
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category listing_category NOT NULL,
    operation listing_operation NOT NULL,
    make VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    year INT NOT NULL,
    metric_type VARCHAR(20) NOT NULL DEFAULT 'mileage_km', -- mileage_km OR work_hours
    metric_value INT NOT NULL DEFAULT 0,
    price_amount BIGINT NOT NULL,
    currency currency_code NOT NULL DEFAULT 'USD',
    
    -- Rent specifics
    rent_rate_unit VARCHAR(20),
    rent_rate_amount BIGINT,
    has_driver_option BOOLEAN DEFAULT FALSE,
    driver_fee_per_day BIGINT DEFAULT 0,
    security_deposit BIGINT DEFAULT 0,

    zone zone_location NOT NULL,
    location_details TEXT,
    images TEXT[] DEFAULT '{}',
    chassis_number VARCHAR(100),
    ownership_verified BOOLEAN DEFAULT FALSE,
    
    -- Promotion
    is_promoted BOOLEAN DEFAULT FALSE,
    promotion_scope VARCHAR(30) DEFAULT 'al_kafr_only',
    promotion_activated_at TIMESTAMPTZ,
    promotion_expires_at TIMESTAMPTZ,

    -- Inspection badge
    inspection_status VARCHAR(20) DEFAULT 'none',
    inspection_report_id UUID,

    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for the Promoted-First chronological ranking
CREATE INDEX idx_listings_ranking ON listings (is_promoted DESC, promotion_activated_at DESC NULLS LAST, created_at DESC);
CREATE INDEX idx_listings_zone_cat ON listings (zone, category, operation);

-- 6. INSPECTION REQUESTS & REPORTS
CREATE TABLE inspection_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id),
    garage_id UUID REFERENCES garage_profiles(id),
    status VARCHAR(30) DEFAULT 'pending_seller',
    requested_date DATE NOT NULL,
    fee_amount BIGINT NOT NULL,
    currency currency_code NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspection_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES inspection_requests(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id),
    garage_id UUID REFERENCES garage_profiles(id),
    inspector_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    verdict VARCHAR(20) NOT NULL,
    checklist_json JSONB NOT NULL,
    recommendation TEXT,
    tamper_proof_hash VARCHAR(128) NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEALS & ESCROW SYSTEM
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    agreed_price BIGINT NOT NULL,
    currency currency_code NOT NULL,
    deposit_amount BIGINT NOT NULL,
    commission_rate NUMERIC(4,3) NOT NULL,
    commission_amount BIGINT NOT NULL,
    status deal_status DEFAULT 'offer',
    
    -- Agent verification secret token
    secret_otp VARCHAR(20) NOT NULL,
    agent_id UUID REFERENCES payment_agents(id),
    receipt_number VARCHAR(50),
    escrow_confirmed_at TIMESTAMPTZ,
    
    -- Electronic Contract
    contract_number VARCHAR(50) UNIQUE,
    contract_terms_ar TEXT,
    buyer_signature_at TIMESTAMPTZ,
    seller_signature_at TIMESTAMPTZ,
    contract_qr_hash VARCHAR(128),
    
    -- Delivery Verification
    pickup_hours_or_km INT,
    return_hours_or_km INT,
    pickup_date TIMESTAMPTZ,
    delivery_confirmed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TAXI READINESS (Phase 2 Future expansion tables)
CREATE TABLE taxi_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(50) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    current_lat NUMERIC(9,6),
    current_lng NUMERIC(9,6),
    wallet_balance_syp BIGINT DEFAULT 0
);

CREATE TABLE taxi_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES taxi_drivers(id),
    rider_id UUID REFERENCES users(id),
    pickup_zone zone_location NOT NULL,
    dropoff_zone zone_location NOT NULL,
    estimated_fare_syp BIGINT NOT NULL,
    final_fare_syp BIGINT,
    platform_fee_syp BIGINT,
    status VARCHAR(30) DEFAULT 'requested',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
