-- Thread colours catalog for cross-stitch patterns
CREATE TABLE thread_colours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand text NOT NULL,
    colour_code text NOT NULL,
    name text NOT NULL,
    r smallint CHECK (r >= 0 AND r <= 255),
    g smallint CHECK (g >= 0 AND g <= 255),
    b smallint CHECK (b >= 0 AND b <= 255),
    hex text,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT thread_colours_brand_code_unique UNIQUE (brand, colour_code)
);

-- Index for brand filtering
CREATE INDEX idx_thread_colours_brand ON thread_colours(brand);

-- Table comment
COMMENT ON TABLE thread_colours IS 'Catalog of thread colours from various brands (DMC, Anchor, Sullivans, etc.) for cross-stitch patterns';
