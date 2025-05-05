#!/usr/bin/env python3
"""
BMS Azure OpenAI Test Script

This script tests connectivity to the BMS Azure OpenAI service and verifies that the
API key and endpoint are correctly configured.
"""

import os
import sys
import asyncio
from openai import AsyncAzureOpenAI
import json
import traceback

async def test_bms_openai():
    print("Testing BMS Azure OpenAI Connection")
    print("===================================")
    
    # Get credentials from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    endpoint = os.environ.get('AZURE_OPENAI_ENDPOINT')
    deployment = os.environ.get('AZURE_OPENAI_DEPLOYMENT')
    api_version = os.environ.get('AZURE_OPENAI_API_VERSION', '2023-05-15')
    
    # Print configuration
    print(f"API Key: {'*' * (len(api_key) - 4) if api_key else ''}{''.join(api_key[-4:] if api_key else 'Not set')}")
    print(f"Endpoint: {endpoint}")
    print(f"Deployment: {deployment}")
    print(f"API Version: {api_version}")
    print(f"Is Azure: {os.environ.get('OPENAI_IS_AZURE')}")
    print("-" * 50)
    
    # Check if required variables are set
    missing_vars = []
    if not api_key:
        missing_vars.append("OPENAI_API_KEY")
    if not endpoint:
        missing_vars.append("AZURE_OPENAI_ENDPOINT")
    if not deployment:
        missing_vars.append("AZURE_OPENAI_DEPLOYMENT")
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    try:
        # Create Azure OpenAI client
        print("Creating Azure OpenAI client...")
        client = AsyncAzureOpenAI(
            api_key=api_key,  
            api_version=api_version,
            azure_endpoint=endpoint
        )
        
        print("Client created successfully!")
        print("\nSending test request to get available deployments...")
        
        # Test deployments listing
        try:
            # This endpoint might not work with all BMS OpenAI proxies
            deployments_response = await client.with_raw_response.deployments.list()
            print(f"Deployments Status Code: {deployments_response.http_request.status_code}")
            if deployments_response.http_request.status_code == 200:
                deployments = deployments_response.parsed
                print(f"Available Deployments: {', '.join([d.id for d in deployments.data])}")
        except Exception as e:
            print(f"Could not list deployments: {e}")
            print("This is normal if the BMS proxy doesn't support this endpoint.")
        
        # Send a simple chat completion request
        print("\nSending test chat completion request...")
        response = await client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": "You are a helpful assistant for BMS employees."},
                {"role": "user", "content": "Hello, please provide a brief response confirming you're connected to BMS Azure OpenAI services."}
            ],
            max_tokens=100
        )
        
        print("\nConnection successful! Response details:")
        print(f"Model: {response.model}")
        print(f"Completion ID: {response.id}")
        print(f"Usage: {response.usage.prompt_tokens} prompt tokens, {response.usage.completion_tokens} completion tokens")
        print(f"Response: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"\nError connecting to BMS Azure OpenAI: {e}")
        print("\nDetailed error information:")
        traceback.print_exc()
        
        # Check network connectivity
        try:
            import aiohttp
            
            print("\nChecking network connectivity to BMS endpoints...")
            async with aiohttp.ClientSession() as session:
                urls_to_check = [
                    endpoint,
                    "https://bms-openai-proxy-eus-prod.azu.bms.com"
                ]
                
                for url in urls_to_check:
                    try:
                        print(f"Testing connection to {url}...")
                        async with session.get(url, timeout=5, ssl=False) as response:
                            print(f"  Status: {response.status}")
                    except Exception as conn_error:
                        print(f"  Error: {conn_error}")
        
        except Exception as network_error:
            print(f"Network connectivity check failed: {network_error}")
        
        print("\nTroubleshooting tips:")
        print("1. Make sure you're connected to the BMS network or VPN")
        print("2. Verify your API key is correct")
        print("3. Check that the endpoint URL is correct")
        print("4. Ensure the deployment exists and is available to your API key")
        
        return False

if __name__ == "__main__":
    asyncio.run(test_bms_openai())