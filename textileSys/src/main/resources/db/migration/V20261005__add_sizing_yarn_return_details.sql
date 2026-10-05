ALTER TABLE sizing_yarn_inward
    ADD COLUMN count_and_ticket VARCHAR(200),
    ADD COLUMN issued_bags DECIMAL(12, 3),
    ADD COLUMN issued_cones DECIMAL(12, 3),
    ADD COLUMN issued_gross_weight DECIMAL(12, 3),
    ADD COLUMN empty_cone_tare_grams DECIMAL(8, 3);
