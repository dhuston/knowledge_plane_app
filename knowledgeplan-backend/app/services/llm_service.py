import openai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
        # Consider using async client if FastAPI routes are async
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_summary(
        self,
        prompt: str,
        model: str = "gpt-3.5-turbo",
        max_tokens: int = 150,
        temperature: float = 0.7,
    ) -> str:
        """Generates a summary using the specified OpenAI model."""
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
                print(f"Warning: Unexpected OpenAI response structure: {response}")
                return "(Summary generation failed: Unexpected response)"
        except Exception as e:
            print(f"Error during OpenAI API call: {e}")
            # Handle API errors gracefully, maybe return a default message
            return "(Summary generation failed due to API error)"

# Instantiate the client once
llm_client = LLMClient()

class LLMService:
    _client: openai.AsyncOpenAI | None = None

    @classmethod
    def get_client(cls) -> openai.AsyncOpenAI:
        if cls._client is None:
            if not settings.OPENAI_API_KEY:
                logger.error("OPENAI_API_KEY not configured.")
                raise ValueError("OpenAI API key is not configured.")
            cls._client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("AsyncOpenAI client initialized.")
        return cls._client

    async def generate_response(
        self,
        messages: list[dict[str, str]],
        model: str = "gpt-3.5-turbo",
        max_tokens: int = 150,
        temperature: float = 0.7,
    ) -> str:
        """Generates a response using the specified OpenAI model."""
        client = self.get_client()
        try:
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