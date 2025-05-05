# BMS Azure OpenAI Integration Setup Guide

This document provides instructions for setting up Azure OpenAI integration with Biosphere Alpha platform using the BMS Azure OpenAI services.

## Overview

Biosphere Alpha can use either standard OpenAI API or Azure OpenAI API for its AI-powered features. The BMS Azure OpenAI proxy provides secure access to OpenAI models through BMS's enterprise Azure environment, ensuring compliance with BMS security policies.

## Prerequisites

1. BMS network access (corporate network or VPN)
2. An API key for the BMS Azure OpenAI service
3. Access to the BMS OpenAI proxy service endpoints

## Setup Instructions

### 1. BMS OpenAI Services Information

The BMS OpenAI proxy service provides multiple endpoints and models. The service information can be found at:
```
https://bms-openai-proxy-eus-prod.azu.bms.com/openai-urls.json
```

You can query this endpoint to get the available models and their deployment information.

### 2. Configure Environment Variables

Edit the `.env` file at the root of the project and update the following variables with your BMS Azure OpenAI credentials:

```env
# BMS Azure OpenAI Configuration
OPENAI_IS_AZURE=true
OPENAI_API_KEY=your-bms-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://bms-openai-services-eastus2-1-nonprod.azu.bms.com
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2023-05-15
DISABLE_OPENAI=false

# Comment out standard OpenAI settings
# OPENAI_API_KEY=your-standard-openai-key
# OPENAI_MODEL=gpt-4o
```

The frontend environment variables should also be updated:

```env
# Frontend settings
VITE_API_BASE_URL=http://localhost:8001
VITE_OPENAI_IS_AZURE=true
VITE_OPENAI_API_KEY=your-bms-azure-openai-api-key-here
VITE_AZURE_OPENAI_ENDPOINT=https://bms-openai-services-eastus2-1-nonprod.azu.bms.com
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
```

### 3. Available BMS OpenAI Deployments

BMS provides several OpenAI deployments across different regions. For example:

#### GPT-4.1-mini

```json
"gpt-4.1-mini": [
  {
    "azure_region": "eastus2",
    "deployment_name": "gpt-4.1-mini",
    "endpoint": "https://bms-openai-services-eastus2-1-nonprod.azu.bms.com",
    "model_version": "2025-04-14",
    "requests_per_minute_across_bms": 29940
  },
  {
    "azure_region": "swedencentral",
    "deployment_name": "gpt-4.1-mini", 
    "endpoint": "https://bms-openai-services-swedencentral-1-nonprod.azu.bms.com",
    "model_version": "2025-04-14",
    "requests_per_minute_across_bms": 30000
  }
]
```

You can choose the region closest to your deployment or with the least load.

### 4. Restart the Application

After updating the environment variables, restart both the frontend and backend:

```bash
docker-compose down
docker-compose up -d
```

### 5. Verify Integration

To verify that the BMS Azure OpenAI integration is working, you can run the test script:

```bash
docker-compose exec backend python /app/scripts/test_azure_openai.py
```

Then check the application:

1. Log into the application
2. Navigate to the Insights Dashboard
3. Check if insights are being generated correctly
4. Check the logs for any errors related to Azure OpenAI

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - Verify that your BMS Azure OpenAI API key is correct
   - Check that your API key has access to the specified deployment

2. **Connection Errors**
   - Ensure you're connected to the BMS network or VPN
   - Verify the endpoint URL is correct
   - Check that your machine has proper DNS resolution for BMS domains

3. **No insights generated**
   - Check the browser console and backend logs for errors
   - Verify that `DISABLE_OPENAI` is set to `false`
   - Make sure the selected deployment has sufficient rate limits available

### Testing Connectivity

You can test the BMS Azure OpenAI connection using the provided test script:

```bash
docker-compose exec backend python /app/scripts/test_azure_openai.py
```

## BMS-Specific Considerations

- Follow BMS security guidelines for handling API keys
- Use BMS-approved deployments and models
- Be aware of rate limits and token quotas for your selected model
- For production applications, coordinate with the BMS AI team to ensure proper resource allocation

## Additional Resources

- BMS AI Services Portal (internal)
- [OpenAI Python Library Documentation](https://github.com/openai/openai-python)
- BMS AI Community (internal)