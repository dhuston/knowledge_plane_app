-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS ix_departments_tenant_id ON departments(tenant_id);

-- Add department_id to teams table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'department_id') THEN
        ALTER TABLE teams ADD COLUMN department_id UUID REFERENCES departments(id);
    END IF;
END
$$;

-- Insert departments for Tech Innovations Inc.
INSERT INTO departments (id, name, description, tenant_id, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Engineering', 'Engineering Department', 
        (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.'), 
        NOW(), NOW()),
    (gen_random_uuid(), 'Product', 'Product Management Department', 
        (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.'), 
        NOW(), NOW()),
    (gen_random_uuid(), 'Marketing', 'Marketing Department', 
        (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.'), 
        NOW(), NOW()),
    (gen_random_uuid(), 'Operations', 'Operations Department', 
        (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.'), 
        NOW(), NOW()),
    (gen_random_uuid(), 'Research', 'Research Department', 
        (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.'), 
        NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign teams to departments
DO $$
DECLARE
    engineering_dept_id UUID;
BEGIN
    -- Get Engineering department ID
    SELECT id INTO engineering_dept_id FROM departments 
    WHERE name = 'Engineering' AND tenant_id = (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.');
    
    -- Assign teams to Engineering department
    UPDATE teams 
    SET department_id = engineering_dept_id
    WHERE name IN ('Frontend', 'Backend', 'DevOps', 'Mobile')
    AND tenant_id = (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.');
    
    -- Assign Data Science team to Research department
    UPDATE teams 
    SET department_id = (
        SELECT id FROM departments 
        WHERE name = 'Research' AND tenant_id = (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.')
    )
    WHERE name = 'Data Science'
    AND tenant_id = (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.');
END
$$;