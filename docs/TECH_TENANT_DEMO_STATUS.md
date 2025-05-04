# Tech Innovations Inc. Demo Tenant Status

## Overview

This document outlines the current state of the Tech Innovations Inc. demo tenant and provides instructions for viewing and testing the Living Map with this tenant.

## Demo Data Created

We have successfully created the following demo data for the Tech Innovations Inc. tenant:

### Teams
- **Frontend**: Frontend development team
- **Backend**: Backend services and APIs team
- **DevOps**: Infrastructure and deployment team
- **Mobile**: Mobile app development team
- **Data Science**: ML and data analytics team

### Projects
- **NextGen Cloud Platform**: Complete redesign of our cloud computing platform with containerization, microservices, and serverless capabilities (owned by Backend team)
- **Mobile App v3.0**: Major update to our mobile application with AI-powered features, improved UI, and faster performance (owned by Mobile team)
- **Developer Productivity Toolkit**: Internal tooling improvements for developer workflows including automated testing, CI/CD enhancements, and code quality checks (owned by DevOps team)
- **Customer Data Platform Integration**: Integration of marketing, sales and product data to create a unified customer data platform (owned by Data Science team)
- **AI Assistant Product Feature**: Development of an AI assistant feature for our core product to provide contextual help and automate routine tasks (owned by Data Science team)

### Graph Data
- All teams have corresponding nodes in the graph database
- All projects have corresponding nodes in the graph database
- Team -> Project ownership relationships are established with "OWNS" edges in the graph

## Accessing the Demo

### Login Credentials
- **Email**: admin@techinnovations.com
- **Password**: password123

### Viewing the Living Map
1. Login to the application using the credentials above
2. Navigate to the Living Map section
3. You should see the teams and projects displayed as nodes on the map, with connecting edges showing ownership relationships

## Current Limitations

- No users have been added to the teams yet
- No department structure has been created
- No goals have been created
- No knowledge assets have been added

## Next Steps

To complete the Tech Innovations Inc. demo tenant:

1. Create user accounts with appropriate roles and team assignments
2. Set up department structure and assign teams to departments
3. Create goals and align them with projects
4. Add knowledge assets related to projects
5. Create more complex relationships between entities

## Troubleshooting

If you don't see the data in the Living Map:
1. Ensure you're logged in with the correct tenant credentials
2. Try clearing your browser cache
3. Verify the backend service is running properly (check logs for errors)
4. If using DBeaver to view the database, note that some tables may not appear correctly due to migration issues, but the data is present as confirmed by direct SQL queries