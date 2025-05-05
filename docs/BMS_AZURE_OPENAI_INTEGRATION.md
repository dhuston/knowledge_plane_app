# BMS Azure OpenAI Integration

This document provides information about the integration of the BMS Azure OpenAI service with Biosphere Alpha.

## Overview

Biosphere Alpha integrates with Azure OpenAI to provide AI-powered features like:
- Insight generation and summaries
- Custom prompt processing
- Content enhancement

The BMS implementation uses Azure OpenAI endpoints specific to the BMS enterprise environment.

## Configuration

### Environment Variables

The following environment variables must be set to enable Azure OpenAI integration:

```
# Azure OpenAI Configuration
OPENAI_IS_AZURE=true
OPENAI_API_KEY=<your-bms-api-key>
AZURE_OPENAI_ENDPOINT=https://bms-openai-services-eastus2-1-nonprod.azu.bms.com
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2023-05-15
DISABLE_OPENAI=false

# Frontend settings (for direct API calls if needed)
VITE_OPENAI_IS_AZURE=true
VITE_OPENAI_API_KEY=<your-bms-api-key>
VITE_AZURE_OPENAI_ENDPOINT=https://bms-openai-services-eastus2-1-nonprod.azu.bms.com
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
```

### Implementation Details

The integration uses a backend proxy approach for security and to avoid CORS issues:

1. **Frontend Service**: `OpenAIService.ts` calls backend endpoints instead of calling Azure OpenAI directly
   - Uses `/api/v1/ai-proxy/` endpoints
   - Handles responses and error conditions gracefully
   - No API keys exposed in client-side code

2. **Backend Proxy**: `ai_proxy.py` proxies requests to Azure OpenAI
   - Handles authentication securely
   - Processes requests and formats responses
   - Provides detailed error information when needed

3. **LLM Service**: `llm_service.py` provides the actual integration with Azure OpenAI
   - Supports both standard OpenAI and Azure OpenAI endpoints
   - Implements retry and fallback mechanisms
   - Proper error logging

## Available Endpoints

| Endpoint | Description | Input |
|----------|-------------|-------|
| `/api/v1/ai-proxy/custom-prompt` | Process a custom prompt | `{"prompt": "Your prompt text"}` |
| `/api/v1/ai-proxy/summarize-insights` | Generate a summary from insights | `{"insights": [...], "user_preferences": {...}}` |
| `/api/v1/ai-proxy/enhance-insight` | Enhance an insight with more context | `{"insight": {...}}` |
| `/api/v1/ai-proxy/generate-insights` | Generate insights from activities | `{"activities": [...], "context_data": {...}}` |

## Troubleshooting

### Testing Connectivity

You can test the Azure OpenAI connection using the provided test scripts:

```bash
# From the backend directory
python scripts/test_azure_openai.py  # General test
python scripts/test_bms_openai.py    # BMS-specific test

# Test the API endpoints directly
curl -X POST -H "Content-Type: application/json" \
  -d '{"prompt":"Write a hello message"}' \
  http://localhost:8001/api/v1/ai-proxy/custom-prompt
```

### Common Issues

1. **500 Internal Server Error**
   - Check backend logs for detailed error messages
   - Ensure Azure OpenAI API key is correct
   - Verify Azure endpoint URL is accessible from your environment
   - Check if the specified deployment exists and is active

2. **"Unable to parse JSON response"**
   - This could indicate an empty or malformed response from the API
   - Check network connectivity to the Azure OpenAI endpoint
   - Verify that the BMS VPN/network is accessible if required

3. **Timeout Issues**
   - Increase the timeout settings if needed
   - Consider implementing request retries for network instability

4. **No Response or Empty Results**
   - Check that `DISABLE_OPENAI` is set to `false`
   - Verify that all required environment variables are set correctly

### Recent Bug Fixes

The following issues were addressed in the latest update:

1. Fixed variable references in LLM service (`self.apiKey` vs `settings.OPENAI_API_KEY`) 
2. Improved error handling in frontend OpenAI service
3. Added more detailed logging throughout the AI proxy
4. Added diagnostic tests to the backend to verify connectivity
5. Fixed inconsistencies in environment variable handling

## Testing Your Integration

After configuration, verify your integration works correctly:

1. Test basic connectivity by sending a simple prompt
2. Check the insight summary functionality with sample insights
3. Monitor backend logs for any error messages
4. Verify that responses include the expected data