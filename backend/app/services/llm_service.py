import openai
from openai import AsyncAzureOpenAI, AsyncOpenAI
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        # Check if we're in development mode with disabled OpenAI
        if getattr(settings, "DISABLE_OPENAI", False) or not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set or OpenAI is disabled. Using mock LLM client.")
            logger.info(f"OPENAI_API_KEY from settings (in LLMClient): {'Set (value hidden)' if settings.OPENAI_API_KEY else 'Not Set'}")
            logger.info(f"DISABLE_OPENAI from settings (in LLMClient): {settings.DISABLE_OPENAI}")
            self.client = None
            self.mock_mode = True
            return
            
        # Check if we're using Azure OpenAI
        is_azure = getattr(settings, "OPENAI_IS_AZURE", False)
        azure_endpoint = getattr(settings, "AZURE_OPENAI_ENDPOINT", None)
        azure_deployment = getattr(settings, "AZURE_OPENAI_DEPLOYMENT", None)
        api_version = getattr(settings, "AZURE_OPENAI_API_VERSION", "2023-05-15")

        if is_azure and azure_endpoint and settings.OPENAI_API_KEY:
            # Initialize Azure OpenAI client
            logger.info(f"Initializing Azure OpenAI client with endpoint: {azure_endpoint}")
            self.client = AsyncAzureOpenAI(
                api_key=settings.OPENAI_API_KEY,
                api_version=api_version,
                azure_endpoint=azure_endpoint
            )
            self.model = azure_deployment or "gpt-4"
            self.is_azure = True
            logger.info(f"Using Azure OpenAI deployment: {self.model}")
            self.mock_mode = False
        elif settings.OPENAI_API_KEY:
            # Initialize standard OpenAI client
            logger.info("Initializing standard OpenAI client")
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = getattr(settings, "OPENAI_MODEL", "gpt-3.5-turbo")
            self.is_azure = False
            self.mock_mode = False
        else:
            logger.warning("No valid OpenAI configuration found. Using mock LLM client.")
            self.client = None
            self.mock_mode = True

    async def generate_summary(
        self,
        prompt: str,
        model: str = None,
        max_tokens: int = 150,
        temperature: float = 0.7,
    ) -> str:
        """Generates a summary using the specified OpenAI model."""
        # Return mock response if in development mode
        if self.mock_mode:
            logger.info(f"Mock LLM generating summary for: {prompt[:30]}...")
            return f"This is a mock LLM summary for development purposes. Your prompt was about: {prompt[:50]}..."
            
        try:
            if not model:
                model = self.model
                
            logger.info(f"Generating summary using model: {model}")
            logger.info(f"Azure OpenAI? {self.is_azure}")
            logger.info(f"API Key available: {'Yes' if settings.OPENAI_API_KEY else 'No'}")
            logger.info(f"API key length: {len(settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else 0}")
            logger.info(f"Endpoint: {self.client.base_url if hasattr(self.client, 'base_url') else 'Unknown'}")
            
            # Add additional diagnostic information
            try:
                import json
                import httpx
                
                # First, test a basic connection to the Azure endpoint
                logger.info("Testing connection to Azure endpoint...")
                
                if self.is_azure:
                    # For Azure, construct a test URL
                    azure_endpoint = settings.AZURE_OPENAI_ENDPOINT
                    api_version = getattr(settings, "AZURE_OPENAI_API_VERSION", "2023-05-15")
                    test_url = f"{azure_endpoint}/openai/deployments?api-version={api_version}"
                    headers = {"api-key": settings.OPENAI_API_KEY}
                    
                    # Make a simple GET request to verify connectivity
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        try:
                            logger.info(f"Testing connection to: {test_url}")
                            response = await client.get(test_url, headers=headers)
                            logger.info(f"Connection test status: {response.status_code}")
                            logger.info(f"Connection test headers: {response.headers}")
                            if response.status_code == 200:
                                logger.info(f"Connection test body preview: {response.text[:200]}")
                        except Exception as conn_error:
                            logger.error(f"Connection test error: {conn_error}")
            
            except Exception as diag_error:
                logger.error(f"Diagnostic error: {diag_error}")
                
            # Proceed with the actual OpenAI API call
            response = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
                n=1,
                stop=None,
            )
            
            # Ensure response structure is as expected and content exists
            if response.choices and response.choices[0].message and response.choices[0].message.content:
                return response.choices[0].message.content.strip()
            else:
                logger.warning(f"Warning: Unexpected OpenAI response structure: {response}")
                return "(Summary generation failed: Unexpected response)"
        except Exception as e:
            logger.error(f"Error during OpenAI API call: {e}")
            logger.exception("Detailed error traceback:")
            # Handle API errors gracefully, maybe return a default message
            return f"(Summary generation failed due to API error: {str(e)})"

# Instantiate the client once
try:
    llm_client = LLMClient()
except Exception as e:
    logger.error(f"Failed to initialize LLMClient: {e}")
    # Create a mock client as fallback
    class MockLLMClient:
        async def generate_summary(self, prompt: str, **kwargs) -> str:
            return f"MOCK RESPONSE: {prompt[:30]}..."
    
    llm_client = MockLLMClient()

class LLMService:
    _client: AsyncOpenAI | AsyncAzureOpenAI | None = None
    _mock_mode: bool = False
    _model: str = "gpt-3.5-turbo"
    _is_azure: bool = False

    @classmethod
    def get_client(cls):
        # Check if we should use a mock client
        if getattr(settings, "DISABLE_OPENAI", False) or not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set or OpenAI is disabled. Using mock mode.")
            logger.info(f"OPENAI_API_KEY from settings (in LLMService.get_client): {'Set (value hidden)' if settings.OPENAI_API_KEY else 'Not Set'}")
            logger.info(f"DISABLE_OPENAI from settings (in LLMService.get_client): {settings.DISABLE_OPENAI}")
            cls._mock_mode = True
            return None
            
        # Check if we're using Azure OpenAI
        is_azure = getattr(settings, "OPENAI_IS_AZURE", False)
        azure_endpoint = getattr(settings, "AZURE_OPENAI_ENDPOINT", None)
        azure_deployment = getattr(settings, "AZURE_OPENAI_DEPLOYMENT", None)
        api_version = getattr(settings, "AZURE_OPENAI_API_VERSION", "2023-05-15")

        # Initialize real client if needed
        if cls._client is None:
            if is_azure and azure_endpoint and settings.OPENAI_API_KEY:
                # Initialize Azure OpenAI client
                logger.info(f"Initializing Azure OpenAI client with endpoint: {azure_endpoint}")
                cls._client = AsyncAzureOpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    api_version=api_version,
                    azure_endpoint=azure_endpoint
                )
                cls._model = azure_deployment or "gpt-4"
                cls._is_azure = True
                logger.info(f"Using Azure OpenAI deployment: {cls._model}")
                cls._mock_mode = False
            elif settings.OPENAI_API_KEY:
                # Initialize standard OpenAI client
                logger.info("AsyncOpenAI client initializing with API key from settings")
                cls._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                cls._model = getattr(settings, "OPENAI_MODEL", "gpt-3.5-turbo")
                cls._is_azure = False
                cls._mock_mode = False
                logger.info("AsyncOpenAI client initialized successfully")
            
        return cls._client

    async def generate_response(
        self,
        messages: list[dict[str, str]],
        model: str = None,
        max_tokens: int = 150,
        temperature: float = 0.7,
    ) -> str:
        """Generates a response using the specified OpenAI model."""
        try:
            # Check if we're in mock mode
            if getattr(settings, "DISABLE_OPENAI", False) or not settings.OPENAI_API_KEY:
                # Create mock response based on the content of the messages
                prompt = " ".join([msg.get("content", "") for msg in messages])
                logger.info(f"Mock LLM generating response for: {prompt[:30]}...")
                logger.info(f"OPENAI_API_KEY from settings (in generate_response): {'Set (value hidden)' if settings.OPENAI_API_KEY else 'Not Set'}")
                logger.info(f"DISABLE_OPENAI from settings (in generate_response): {settings.DISABLE_OPENAI}")
                return f"This is a mock LLM response for development purposes. Your messages were about: {prompt[:50]}..."
                
            # Get real client
            logger.info("Getting real OpenAI client")
            client = self.get_client()
            
            if not model:
                model = self._model
                
            # Make API call
            logger.info(f"Making {'Azure' if self._is_azure else 'Standard'} OpenAI API call with model: {model}")
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                n=1,
                stop=None,
            )
            if response.choices and response.choices[0].message and response.choices[0].message.content:
                return response.choices[0].message.content.strip()
            else:
                logger.warning(f"Unexpected OpenAI response structure: {response}")
                return "(LLM generation failed: Unexpected response)"
                
        except Exception as e:
            logger.error(f"Error during OpenAI API call: {e}", exc_info=True)
            return f"(LLM generation failed due to API error: {str(e)})"

    async def generate_summary(
        self,
        prompt: str,
        model: str = None,
        max_tokens: int = 150,
        temperature: float = 0.7,
    ) -> str:
        """Generates a summary by wrapping the prompt in a user message."""
        # Simply wrap the raw prompt into the message format generate_response expects
        messages = [{"role": "user", "content": prompt}]
        return await self.generate_response(
            messages=messages,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature
        )

# Create a singleton instance
llm_service = LLMService() 