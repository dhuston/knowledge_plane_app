-- Create nodes for departments
WITH dept_data AS (
  SELECT 
    d.id as dept_id,
    d.name as dept_name,
    d.description as dept_description,
    d.tenant_id as tenant_id,
    gen_random_uuid() as node_id,
    random() * 200 - 100 as x_pos,
    random() * 200 - 100 as y_pos
  FROM departments d
  JOIN tenants t ON d.tenant_id = t.id
  WHERE t.name = 'Tech Innovations Inc.'
)
INSERT INTO nodes (
  id, tenant_id, type, props, x, y, created_at, updated_at
)
SELECT 
  node_id,
  tenant_id,
  'department',
  json_build_object(
    'name', dept_name,
    'description', COALESCE(dept_description, ''),
    'entity_id', dept_id,
    'entity_type', 'department'
  )::jsonb,
  x_pos,
  y_pos,
  NOW(),
  NOW()
FROM dept_data
ON CONFLICT DO NOTHING;

-- Create edges between departments and teams
WITH rel_data AS (
  SELECT 
    d_node.id AS dept_node_id,
    t_node.id AS team_node_id,
    d.name AS dept_name,
    t.name AS team_name,
    t.tenant_id AS tenant_id
  FROM departments d
  JOIN teams t ON t.department_id = d.id
  JOIN nodes d_node ON d_node.props->>'entity_id' = d.id::text AND d_node.type = 'department'
  JOIN nodes t_node ON t_node.props->>'entity_id' = t.id::text AND t_node.type = 'team'
  WHERE t.tenant_id = (SELECT id FROM tenants WHERE name = 'Tech Innovations Inc.')
)
INSERT INTO edges (
  id, tenant_id, src, dst, label, props, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  tenant_id,
  dept_node_id,
  team_node_id,
  'HAS_TEAM',
  '{}'::jsonb,
  NOW(),
  NOW()
FROM rel_data
ON CONFLICT DO NOTHING;