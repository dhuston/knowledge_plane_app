#!/usr/bin/env python3

import os
import sys
import asyncio
from openai import AsyncAzureOpenAI

async def test_azure_openai():
    print("Testing Azure OpenAI connection...")
    
    # Get credentials from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    endpoint = os.environ.get('AZURE_OPENAI_ENDPOINT')
    deployment = os.environ.get('AZURE_OPENAI_DEPLOYMENT')
    api_version = os.environ.get('AZURE_OPENAI_API_VERSION', '2023-05-15')
    
    # Print config (without showing full API key)
    print(f"API Key: {'*' * 5}{api_key[-4:] if api_key else 'Not set'}")
    print(f"Endpoint: {endpoint}")
    print(f"Deployment: {deployment}")
    print(f"API Version: {api_version}")
    
    if not api_key or not endpoint or not deployment:
        print("Error: Missing required environment variables")
        sys.exit(1)
    
    try:
        # Create Azure OpenAI client
        client = AsyncAzureOpenAI(
            api_key=api_key,  
            api_version=api_version,
            azure_endpoint=endpoint
        )
        
        print("Client created successfully, sending test request...")
        
        # Send a simple request
        response = await client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, are you connected to Azure OpenAI?"}
            ],
            max_tokens=100
        )
        
        print("\nConnection successful! Response:")
        print(f"Model: {response.model}")
        print(f"Response: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        import traceback
        print(f"Error connecting to Azure OpenAI: {e}")
        print("\nDetailed error information:")
        traceback.print_exc()
        
        # Try to check if we can access the endpoint at all
        try:
            import aiohttp
            import ssl
            
            print("\nAttempting basic HTTP connection to the endpoint...")
            
            # Create a context with less strict SSL verification
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Try accessing the base URL to see if it responds
            async with aiohttp.ClientSession() as session:
                url = f"{endpoint}/openai/deployments?api-version={api_version}"
                print(f"Testing URL: {url}")
                headers = {
                    "api-key": api_key,
                    "Content-Type": "application/json"
                }
                async with session.get(
                    url, 
                    ssl=ssl_context,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    print(f"HTTP Status: {response.status}")
                    print(f"Response Headers: {response.headers}")
                    if response.status == 200:
                        content = await response.text()
                        print(f"Response Body: {content[:500]}...")
        except Exception as network_error:
            print(f"Network connectivity error: {network_error}")
            traceback.print_exc()
        
        return False

if __name__ == "__main__":
    asyncio.run(test_azure_openai())