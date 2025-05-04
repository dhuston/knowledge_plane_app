# Tenant Setup Scripts

This directory contains scripts to set up demo tenants for the Biosphere Alpha platform across multiple industries.

## Available Demo Tenants

### 1. Pharma AI Demo

A pharmaceutical R&D organization with:
- 7 pharmaceutical departments
- 21 teams
- 272 users
- 60 goals
- 100 research projects

To set up:
```bash
./generate_test_data.py
```

### 2. Tech Innovations Inc.

A technology company focused on software development with:
- 6 departments
- 16 teams
- 17 users
- 3 goals
- 4 projects

To set up:
```bash
./create_tech_tenant.py
```

### 3. Metropolitan Health System

A healthcare provider with integrated medical services:
- 10 departments
- 21 teams
- 23 users
- 5 goals
- 6 projects

To set up:
```bash
./create_healthcare_tenant.py
```

### 4. Global Financial Group

A financial services organization with diverse business units:
- 8 departments
- 22 teams
- 23 users
- 6 goals
- 7 projects

To set up:
```bash
./create_financial_tenant.py
```

### 5. Advanced Manufacturing Corp

A manufacturing enterprise focused on industrial innovation:
- 8 departments
- 23 teams
- 24 users
- 7 goals
- 8 projects

To set up:
```bash
./create_manufacturing_tenant.py
```

### 6. University Research Alliance

A higher education institution with extensive research programs:
- 8 departments
- 24 teams
- 25 users
- 8 goals
- 9 projects

To set up:
```bash
./create_education_tenant.py
```

### Setting Up All Demo Tenants

To create all demo tenants at once:
```bash
./run_create_demo_tenants.sh
```

## Creating Custom Tenants

To create a custom tenant, you can use any of the scripts as a template and modify the:
- Tenant details (name, domain)
- Department structure
- Team organization
- User data
- Projects and goals

## Accessing Demo Tenants

After setup, you can access the tenants using the provided admin credentials:

1. Pharma AI Demo:
   - Email: admin@pharmademo.com
   - Password: password123

2. Tech Innovations Inc:
   - Email: admin@techinnovations.com
   - Password: password123

3. Metropolitan Health System:
   - Email: admin@metrohealth.org
   - Password: password123

4. Global Financial Group:
   - Email: admin@globalfingroup.com
   - Password: password123

5. Advanced Manufacturing Corp:
   - Email: admin@advancedmfg.com
   - Password: password123

6. University Research Alliance:
   - Email: admin@uniresearch.edu
   - Password: password123

## Database Configuration

All scripts expect a properly initialized database with the complete schema. Make sure you've run all migrations before creating tenants:

```bash
docker-compose exec backend alembic upgrade head
```

## Customizing for Specific Industries

Each tenant script is designed to showcase how Biosphere Alpha can be used in different industries:

- **Pharmaceutical**: Research collaboration, regulatory compliance, drug development
- **Technology**: Agile development, product innovation, engineering teams
- **Healthcare**: Patient care, clinical research, medical specialties
- **Financial Services**: Investment banking, risk management, compliance
- **Manufacturing**: Production efficiency, quality control, supply chain
- **Education**: Academic research, faculty collaboration, strategic initiatives

These scripts can be customized to match specific organizational structures and use cases.