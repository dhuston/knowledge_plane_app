import openai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        # Check if we're in development mode with disabled OpenAI
        if getattr(settings, "DISABLE_OPENAI", False) or not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set or OpenAI is disabled. Using mock LLM client.")
            self.client = None
            self.mock_mode = True
        else:
            # Consider using async client if FastAPI routes are async
            self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.mock_mode = False

    async def generate_summary(
        self,
        prompt: str,
        model: str = "gpt-3.5-turbo",
        max_tokens: int = 150,
        temperature: float = 0.7,
    ) -> str:
        """Generates a summary using the specified OpenAI model."""
        # Return mock response if in development mode
        if self.mock_mode:
            logger.info(f"Mock LLM generating summary for: {prompt[:30]}...")
            return f"This is a mock LLM summary for development purposes. Your prompt was about: {prompt[:50]}..."
            
        try:
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
            # Handle API errors gracefully, maybe return a default message
            return "(Summary generation failed due to API error)"

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
    _client: openai.AsyncOpenAI | None = None
    _mock_mode: bool = False

    @classmethod
    def get_client(cls) -> openai.AsyncOpenAI:
        # Check if we should use a mock client
        if getattr(settings, "DISABLE_OPENAI", False) or not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set or OpenAI is disabled. Using mock mode.")
            cls._mock_mode = True
            return None
        
        # Initialize real client if needed
        if cls._client is None:
            cls._client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("AsyncOpenAI client initialized.")
            cls._mock_mode = False
            
        return cls._client

    async def generate_response(
        self,
        messages: list[dict[str, str]],
        model: str = "gpt-3.5-turbo",
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
                return f"This is a mock LLM response for development purposes. Your messages were about: {prompt[:50]}..."
                
            # Get real client
            client = self.get_client()
            
            # Make API call
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
            return "(LLM generation failed due to API error)"

    async def generate_summary(
        self,
        prompt: str,
        model: str = "gpt-3.5-turbo",
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