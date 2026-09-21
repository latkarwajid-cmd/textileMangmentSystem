CREATE DATABASE IF NOT EXISTS textile_db;
USE textile_db;


-- =========================================================
-- 1. PARTIES
-- =========================================================

CREATE TABLE parties (
    party_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    party_name VARCHAR(150) NOT NULL,
    party_type VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    gst_no VARCHAR(30),
    status BOOLEAN DEFAULT TRUE
);


-- =========================================================
-- 2. TICKITS
-- Tickit belongs to a Party
-- =========================================================

CREATE TABLE tickits (
    tickit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tickit_name VARCHAR(100) NOT NULL,
    party_id BIGINT NOT NULL,
    count_id BIGINT,
    tickit_id BIGINT,
    supplier_id BIGINT,
    active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_tickit_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id),

    CONSTRAINT uk_tickit_party
        UNIQUE (tickit_name, party_id)
);


-- =========================================================
-- 3. YARN COUNTS
-- =========================================================

CREATE TABLE yarn_counts (
    count_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    count_name VARCHAR(50) NOT NULL UNIQUE,
    count_type VARCHAR(30),
    description VARCHAR(200),
    active BOOLEAN DEFAULT TRUE
);


CREATE TABLE yarn_storage_locations (
    storage_location_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO yarn_storage_locations (location_name) VALUES
    ('Factory Warehouse'),
    ('Gate Pass'),
    ('Weaver'),
    ('Sizing'),
    ('Other'),
    ('Dyeing');


-- =========================================================
-- 4. SIZING UNITS
-- Sizing belongs to a Party
-- =========================================================

CREATE TABLE sizing_units (
    sizing_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sizing_name VARCHAR(100) NOT NULL,
    party_id BIGINT,
    active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_sizing_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id),

    CONSTRAINT uk_sizing_party
        UNIQUE (sizing_name, party_id)
);


-- =========================================================
-- 5. FABRIC ORDERS
-- Main customer/order party
-- =========================================================

CREATE TABLE fabric_orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    order_date DATE NOT NULL,

    party_id BIGINT NOT NULL,

    quality VARCHAR(255),
    rate DECIMAL(12,2),

    ordered_meters DECIMAL(12,3),
    dispatched_meters DECIMAL(12,3) DEFAULT 0,

    status VARCHAR(30) DEFAULT 'OPEN',
    complete BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_order_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id),
    CONSTRAINT fk_order_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),
    CONSTRAINT fk_order_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),
    CONSTRAINT fk_order_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 6. YARN INWARD
-- Supplier party can be different from order party
-- =========================================================

CREATE TABLE yarn_inward (
    yarn_inward_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT,
    inward_date DATE NOT NULL,

    count_id BIGINT,
    tickit_id BIGINT,

    bags DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    supplier_id BIGINT,

    storage_location_id BIGINT,
    storage_sizing_id BIGINT,
    storage_party_id BIGINT,

    bill_no VARCHAR(50),

    rate DECIMAL(12,2),
    gst_percent DECIMAL(5,2),

    calculated_amount DECIMAL(14,2),
    actual_amount DECIMAL(14,2),

    payment_status VARCHAR(20) DEFAULT 'UNPAID',
    paid_date DATE,
    paid_amount DECIMAL(14,2) DEFAULT 0,

    received_payment DECIMAL(14,2) DEFAULT 0,
    bill_amount DECIMAL(14,2),

    remark TEXT,
    remark2 TEXT,

    CONSTRAINT fk_yarn_inward_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_yarn_inward_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_yarn_inward_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_yarn_inward_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES parties(party_id),

    CONSTRAINT fk_yarn_inward_storage_location
        FOREIGN KEY (storage_location_id)
        REFERENCES yarn_storage_locations(storage_location_id),

    CONSTRAINT fk_yarn_inward_storage_sizing
        FOREIGN KEY (storage_sizing_id)
        REFERENCES sizing_units(sizing_id),

    CONSTRAINT fk_yarn_inward_storage_party
        FOREIGN KEY (storage_party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 7. PAYMENTS
-- Multiple payments can be made for one yarn inward/bill
-- =========================================================

CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    yarn_inward_id BIGINT NOT NULL,

    payment_date DATE NOT NULL,
    amount DECIMAL(14,2) NOT NULL,

    payment_mode VARCHAR(30),

    tds DECIMAL(12,2) DEFAULT 0,
    gst DECIMAL(12,2) DEFAULT 0,
    interest DECIMAL(12,2) DEFAULT 0,
    tcs DECIMAL(12,2) DEFAULT 0,
    additional_amount DECIMAL(12,2) DEFAULT 0,

    status VARCHAR(20) DEFAULT 'PAID',
    remark TEXT,

    CONSTRAINT fk_payment_yarn
        FOREIGN KEY (yarn_inward_id)
        REFERENCES yarn_inward(yarn_inward_id)
);


-- =========================================================
-- 8. YARN OUT FOR WEFT
-- Party here can be different from Fabric Order party
-- =========================================================

CREATE TABLE yarn_out_weft (
    yarn_out_weft_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT,
    out_date DATE NOT NULL,

    count_id BIGINT,
    tickit_id BIGINT,

    bags DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    party_id BIGINT,

    CONSTRAINT fk_weft_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_weft_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_weft_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_weft_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 9. SIZING SET
-- =========================================================

CREATE TABLE sizing_sets (
    sizing_set_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    set_no VARCHAR(50) NOT NULL UNIQUE,

    order_id BIGINT,
    count_id BIGINT,
    tickit_id BIGINT,
    sizing_id BIGINT,
    party_id BIGINT,

    quality VARCHAR(255),

    total_ends INT,
    sizing_meters DECIMAL(12,3),
    sizing_count VARCHAR(50),

    status VARCHAR(30) DEFAULT 'OPEN',

    CONSTRAINT fk_set_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_set_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_set_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_set_sizing
        FOREIGN KEY (sizing_id)
        REFERENCES sizing_units(sizing_id),

    CONSTRAINT fk_set_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 10. YARN OUT FOR SIZING
-- =========================================================

CREATE TABLE yarn_out_sizing (
    yarn_out_sizing_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    sizing_set_id BIGINT NOT NULL,

    out_date DATE NOT NULL,

    bags DECIMAL(12,3),
    cone DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    rate DECIMAL(12,2),
    bill_no VARCHAR(50),
    amount DECIMAL(14,2),

    CONSTRAINT fk_sizing_out_set
        FOREIGN KEY (sizing_set_id)
        REFERENCES sizing_sets(sizing_set_id)
);


-- =========================================================
-- 11. SIZING YARN INWARD
-- =========================================================

CREATE TABLE sizing_yarn_inward (
    sizing_inward_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    sizing_set_id BIGINT,
    order_id BIGINT,

    sizing_id BIGINT,

    inward_date DATE,

    count_id BIGINT,
    tickit_id BIGINT,

    bags DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    party_id BIGINT,

    remark TEXT,

    CONSTRAINT fk_sizing_inward_set
        FOREIGN KEY (sizing_set_id)
        REFERENCES sizing_sets(sizing_set_id),

    CONSTRAINT fk_sizing_inward_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_sizing_inward_sizing
        FOREIGN KEY (sizing_id)
        REFERENCES sizing_units(sizing_id),

    CONSTRAINT fk_sizing_inward_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_sizing_inward_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_sizing_inward_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 12. YARN OUT FOR DYEING
-- =========================================================

CREATE TABLE yarn_out_dyeing (
    dyeing_out_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    sizing_set_id BIGINT,
    order_id BIGINT,

    out_date DATE,

    count_id BIGINT,
    tickit_id BIGINT,
    sizing_id BIGINT,
    party_id BIGINT,

    bags DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    quality VARCHAR(255),

    total_ends INT,

    sizing_meters DECIMAL(12,3),
    sizing_received_weight DECIMAL(12,3),
    fresh_bags_received DECIMAL(12,3),

    balance_in_sizing DECIMAL(12,3),
    sizing_consumption_kg DECIMAL(12,3),

    sizing_count VARCHAR(50),

    bill_no VARCHAR(50),

    status VARCHAR(30),

    CONSTRAINT fk_dyeing_set
        FOREIGN KEY (sizing_set_id)
        REFERENCES sizing_sets(sizing_set_id),

    CONSTRAINT fk_dyeing_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_dyeing_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_dyeing_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_dyeing_sizing
        FOREIGN KEY (sizing_id)
        REFERENCES sizing_units(sizing_id),

    CONSTRAINT fk_dyeing_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 13. DYED YARN INWARD
-- =========================================================

CREATE TABLE dyed_yarn_inward (
    dyed_yarn_inward_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    dyeing_out_id BIGINT,

    inward_date DATE,

    count_id BIGINT,
    tickit_id BIGINT,

    bags DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    party_id BIGINT,

    bill_no VARCHAR(50),

    status VARCHAR(30),

    remark TEXT,

    CONSTRAINT fk_dyed_from_dyeing
        FOREIGN KEY (dyeing_out_id)
        REFERENCES yarn_out_dyeing(dyeing_out_id),

    CONSTRAINT fk_dyed_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_dyed_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_dyed_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 14. YARN RETURNS
-- =========================================================

CREATE TABLE yarn_returns (
    return_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    return_date DATE,

    source_transaction_type VARCHAR(50),
    source_transaction_id BIGINT,

    order_id BIGINT,
    count_id BIGINT,
    tickit_id BIGINT,
    party_id BIGINT,

    bags DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    reason VARCHAR(255),
    remark TEXT,

    CONSTRAINT fk_return_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_return_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_return_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_return_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 15. BEAM INWARD
-- =========================================================

CREATE TABLE beam_inward (
    beam_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    sizing_set_id BIGINT,
    order_id BIGINT,

    inward_date DATE,

    beam_no VARCHAR(50),

    count_id BIGINT,
    tickit_id BIGINT,

    meter DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    party_id BIGINT,

    status VARCHAR(30),
    remark TEXT,

    CONSTRAINT fk_beam_set
        FOREIGN KEY (sizing_set_id)
        REFERENCES sizing_sets(sizing_set_id),

    CONSTRAINT fk_beam_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_beam_count
        FOREIGN KEY (count_id)
        REFERENCES yarn_counts(count_id),

    CONSTRAINT fk_beam_tickit
        FOREIGN KEY (tickit_id)
        REFERENCES tickits(tickit_id),

    CONSTRAINT fk_beam_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 16. FABRIC INWARD
-- =========================================================

CREATE TABLE fabric_inward (
    fabric_inward_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT,

    inward_date DATE,

    quality VARCHAR(255),

    meters DECIMAL(12,3),
    rolls DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    party_id BIGINT,

    remark TEXT,

    CONSTRAINT fk_fabric_inward_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_fabric_inward_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 17. FABRIC OUT FOR PROCESS
-- =========================================================

CREATE TABLE fabric_process_out (
    process_out_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT,
    fabric_inward_id BIGINT,

    process_type VARCHAR(50),

    out_date DATE,

    meters DECIMAL(12,3),
    rolls DECIMAL(12,3),

    party_id BIGINT,

    status VARCHAR(30),
    remark TEXT,

    CONSTRAINT fk_process_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_process_fabric_inward
        FOREIGN KEY (fabric_inward_id)
        REFERENCES fabric_inward(fabric_inward_id),

    CONSTRAINT fk_process_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 18. FINISH FABRIC INWARD
-- =========================================================

CREATE TABLE finish_fabric_inward (
    finish_fabric_inward_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT,
    process_out_id BIGINT,

    inward_date DATE,

    quality VARCHAR(255),

    meters DECIMAL(12,3),
    rolls DECIMAL(12,3),
    weight_kg DECIMAL(12,3),

    party_id BIGINT,

    status VARCHAR(30),
    remark TEXT,

    CONSTRAINT fk_finish_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_finish_process
        FOREIGN KEY (process_out_id)
        REFERENCES fabric_process_out(process_out_id),

    CONSTRAINT fk_finish_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);


-- =========================================================
-- 19. FABRIC DISPATCH
-- =========================================================

CREATE TABLE fabric_dispatch (
    dispatch_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT,
    finish_fabric_inward_id BIGINT,

    dispatch_date DATE,

    party_id BIGINT,

    meters DECIMAL(12,3),
    rolls DECIMAL(12,3),

    vehicle_no VARCHAR(30),
    transporter VARCHAR(150),
    bill_no VARCHAR(50),

    status VARCHAR(30),
    remark TEXT,

    CONSTRAINT fk_dispatch_order
        FOREIGN KEY (order_id)
        REFERENCES fabric_orders(order_id),

    CONSTRAINT fk_dispatch_finish
        FOREIGN KEY (finish_fabric_inward_id)
        REFERENCES finish_fabric_inward(finish_fabric_inward_id),

    CONSTRAINT fk_dispatch_party
        FOREIGN KEY (party_id)
        REFERENCES parties(party_id)
);