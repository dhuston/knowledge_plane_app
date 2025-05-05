"""
AI Proxy API endpoint that forwards requests to OpenAI/Azure OpenAI
This avoids exposing API keys in the frontend and handles CORS issues
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Body
from app.core.config import settings
from app.services.llm_service import llm_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/summarize-insights")
async def summarize_insights(
    insights: List[Dict[str, Any]] = Body(...),
    user_preferences: Dict[str, Any] = Body(None)
):
    """
    Generate a summary of insights using OpenAI
    
    Args:
        insights: List of insight objects
        user_preferences: Optional user preferences for personalization
    
    Returns:
        A markdown-formatted summary of the insights
    """
    try:
        logger.info(f"Generating insight summary for {len(insights)} insights")
        logger.info(f"Azure OpenAI enabled: {settings.OPENAI_IS_AZURE}")
        logger.info(f"Azure endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
        logger.info(f"Azure deployment: {settings.AZURE_OPENAI_DEPLOYMENT}")
        
        # Input validation
        if not insights:
            logger.warning("No insights provided for summary generation")
            return {"summary": "No insights available to summarize."}
        
        # Build the prompt
        preferences_str = ""
        username = "the user"
        role = "team member"
        organization = "the organization"
        
        if user_preferences:
            if isinstance(user_preferences, dict):
                username = user_preferences.get('userName', 'the user')
                role = user_preferences.get('role', 'team member')
                organization = user_preferences.get('organization', 'the organization')
                preferences_str = f"Consider user preferences: {user_preferences}"
            else:
                logger.warning(f"Invalid user_preferences format: {type(user_preferences)}")
        
        # Format the prompt more safely
        prompt = f"""
        Generate a daily digest for {username}, 
        who is a {role} at {organization}.
        
        Summarize the latest organizational updates, including strategic changes and achievements based on these insights.
        Provide a list of prioritized tasks and individual goals aligned with team objectives for today.
        Include learning recommendations targeting relevant skills.
        Highlight social and collaborative aspects, identifying colleagues working on similar projects.
        Wrap up with personalized productivity tips and motivational insights for enhanced engagement.
        
        {preferences_str}
        
        Insights:
        {insights}
        
        Format the summary in markdown with:
        1. A brief introduction
        2. The main digest content in a few concise paragraphs
        3. Bullet points for priorities and recommendations
        4. A brief motivational conclusion
        
        DO NOT include:
        - "Daily Summary" heading
        - "Daily Digest for [name]" heading
        - Any redundant greetings like "Hello [name]," or "Good [time of day], [name]"
        
        Present the summary in engaging but concise prose. Keep it under 250 words total.
        """
        
        # Generate summary using the LLM service
        try:
            logger.info(f"Calling LLM service to generate summary using model: {settings.AZURE_OPENAI_DEPLOYMENT or 'gpt-4.1-mini'}")
            
            # Call the LLM service with shorter prompt first as a test
            test_prompt = "Generate a quick hello world response to test the connection."
            test_summary = await llm_service.generate_summary(
                prompt=test_prompt,
                model=settings.AZURE_OPENAI_DEPLOYMENT or "gpt-4.1-mini",
                max_tokens=20,
                temperature=0.7
            )
            logger.info(f"Test summary successful: {test_summary}")
            
            # Now call with the actual full prompt
            summary = await llm_service.generate_summary(
                prompt=prompt,
                model=settings.AZURE_OPENAI_DEPLOYMENT or "gpt-4.1-mini",
                max_tokens=500,
                temperature=0.7
            )
            
            # Validate response
            if not summary or not isinstance(summary, str):
                logger.error(f"LLM service returned invalid summary: {type(summary)}, value: {summary}")
                summary = "Unable to generate insights summary at this time."
            else:
                logger.info(f"Successfully generated insight summary: {summary[:100]}...")
            
            return {"summary": summary}
            
        except Exception as llm_error:
            logger.error(f"LLM service error: {llm_error}", exc_info=True)
            # Return a more detailed error message
            error_message = f"Unable to generate insights summary: {str(llm_error)}"
            logger.info(f"Returning error response: {error_message}")
            return {"summary": error_message, "error": True}
        
    except Exception as e:
        logger.error(f"Error generating insight summary: {e}", exc_info=True)
        # Return a valid JSON response even in case of error
        return {"summary": f"Unable to generate insights summary. Error: {str(e)}", "error": True}


@router.post("/enhance-insight")
async def enhance_insight(
    insight: Dict[str, Any] = Body(...),
):
    """
    Enhance an existing insight with more context and details
    
    Args:
        insight: The insight object to enhance
    
    Returns:
        An enhanced version of the insight
    """
    try:
        # Input validation
        if not insight or not isinstance(insight, dict):
            logger.warning(f"Invalid insight format: {type(insight)}")
            return {"error": "Invalid insight format", "original_insight": insight}
        
        insight_id = insight.get('id', 'unknown')
        logger.info(f"Enhancing insight: {insight_id}")
        
        # Build the prompt
        prompt = f"""
        Enhance and improve the following insight from an organizational intelligence platform.
        Make the title more specific and actionable, enhance the description with more context,
        and suggest more specific actions the user could take.
        
        Current insight:
        {insight}
        
        Return the enhanced insight in a structured JSON format that matches the original structure.
        Do not change the id, category, or source fields. Only improve the title, description, 
        relevanceScore (if justified), relatedEntities (add more context), and suggestedActions (make more specific).
        """
        
        try:
            # Generate enhanced insight using the LLM service
            enhanced_insight_text = await llm_service.generate_summary(
                prompt=prompt,
                model=settings.AZURE_OPENAI_DEPLOYMENT or "gpt-4.1-mini",
                max_tokens=500,
                temperature=0.5
            )
            
            if not enhanced_insight_text or not isinstance(enhanced_insight_text, str):
                logger.error(f"LLM service returned invalid response: {enhanced_insight_text}")
                return insight  # Return the original insight as fallback
            
            # Parse the json from the response
            import json
            try:
                # Try to extract JSON if the response is wrapped in markdown code blocks
                if "```json" in enhanced_insight_text:
                    json_text = enhanced_insight_text.split("```json")[1].split("```")[0].strip()
                    enhanced_insight = json.loads(json_text)
                else:
                    # Otherwise try to parse the whole response as JSON
                    enhanced_insight = json.loads(enhanced_insight_text)
                    
                # Keep the original ID and source
                enhanced_insight["id"] = insight.get("id")
                enhanced_insight["source"] = insight.get("source")
                
                logger.info("Successfully enhanced insight")
                return enhanced_insight
                
            except json.JSONDecodeError:
                logger.error(f"Failed to parse enhanced insight as JSON: {enhanced_insight_text}")
                return insight  # Return the original insight as fallback
        
        except Exception as llm_error:
            logger.error(f"LLM service error: {llm_error}", exc_info=True)
            return insight  # Return the original insight as fallback
        
    except Exception as e:
        logger.error(f"Error enhancing insight: {e}", exc_info=True)
        return insight  # Return the original insight as fallback


@router.post("/generate-insights")
async def generate_insights(
    activities: List[Dict[str, Any]] = Body(...),
    context_data: Dict[str, Any] = Body(None),
):
    """
    Generate insights based on user activities
    
    Args:
        activities: List of user activities
        context_data: Optional context data about the user
    
    Returns:
        A list of insights generated from the activities
    """
    try:
        # Input validation
        if not activities or not isinstance(activities, list):
            logger.warning(f"Invalid activities format: {type(activities)}")
            return {"insights": []}
        
        logger.info(f"Generating insights for {len(activities)} activities")
        
        # Build the prompt safely
        context_str = ""
        if context_data and isinstance(context_data, dict):
            context_str = f"Additional user context: {context_data}"
            
        # Limit activities to avoid token limits
        activities_sample = activities[:min(50, len(activities))]
            
        prompt = f"""
        As an AI-powered analysis system for an organizational intelligence platform, 
        generate insights based on the following user activity data. 
        Focus on collaboration patterns, productivity trends, knowledge gaps, and project risks.
        
        {context_str}
        
        The activities data is as follows:
        {activities_sample}
        
        For each insight, provide:
        1. A concise, actionable title
        2. A detailed description with specific observations
        3. The category (COLLABORATION, PRODUCTIVITY, KNOWLEDGE, PROJECT, or COMMUNICATION)
        4. A relevance score between 0-1 (higher = more relevant)
        5. Any related entities (people, teams, projects) with their relationship
        6. Suggested actions the user could take
        
        Return the insights in a structured JSON format that follows this pattern:
        {{
          "insights": [
            {{
              "title": "string",
              "description": "string",
              "category": "collaboration | productivity | knowledge | project | communication",
              "relevanceScore": 0.95,
              "source": {{
                "type": "string",
                "id": "string"
              }},
              "relatedEntities": [
                {{
                  "id": "string",
                  "type": "string",
                  "name": "string",
                  "connection": "string"
                }}
              ],
              "suggestedActions": [
                {{
                  "label": "string",
                  "type": "schedule | message | task | view | other"
                }}
              ]
            }}
          ]
        }}
        
        Generate 3-5 high-quality insights. Focus on non-obvious patterns that would be valuable to the user.
        """
        
        try:
            # Generate insights using the LLM service
            insights_text = await llm_service.generate_summary(
                prompt=prompt,
                model=settings.AZURE_OPENAI_DEPLOYMENT or "gpt-4.1-mini",
                max_tokens=1500,
                temperature=0.7
            )
            
            if not insights_text or not isinstance(insights_text, str):
                logger.error(f"LLM service returned invalid response: {insights_text}")
                return {"insights": []}
            
            # Parse the json from the response
            import json
            try:
                # Try to extract JSON if the response is wrapped in markdown code blocks
                if "```json" in insights_text:
                    json_text = insights_text.split("```json")[1].split("```")[0].strip()
                    insights_data = json.loads(json_text)
                else:
                    # Otherwise try to parse the whole response as JSON
                    insights_data = json.loads(insights_text)
                
                # Extract the insights array
                insights = insights_data.get("insights", [])
                if not isinstance(insights, list):
                    insights = [insights_data] if isinstance(insights_data, dict) else []
                
                # Add IDs if not present
                import time
                for i, insight in enumerate(insights):
                    if not insight.get("id"):
                        insight["id"] = f"openai-insight-{int(time.time())}-{i}"
                    if not insight.get("createdAt"):
                        insight["createdAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                logger.info(f"Successfully generated {len(insights)} insights")
                return {"insights": insights}
                
            except json.JSONDecodeError:
                logger.error(f"Failed to parse insights as JSON: {insights_text}")
                return {"insights": []}
                
        except Exception as llm_error:
            logger.error(f"LLM service error: {llm_error}", exc_info=True)
            return {"insights": []}
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}", exc_info=True)
        return {"insights": []}


@router.post("/custom-prompt")
async def custom_prompt(
    prompt: str = Body(..., embed=True),
):
    """
    Process a custom prompt with the OpenAI API
    
    Args:
        prompt: The custom prompt to process
    
    Returns:
        The OpenAI response
    """
    try:
        # Add diagnostic logging
        logger.info(f"Custom prompt request received")
        logger.info(f"Azure OpenAI enabled: {settings.OPENAI_IS_AZURE}")
        logger.info(f"Azure endpoint: {settings.AZURE_OPENAI_ENDPOINT}")
        logger.info(f"Azure deployment: {settings.AZURE_OPENAI_DEPLOYMENT}")
        
        # Input validation
        if not prompt or not isinstance(prompt, str):
            logger.warning(f"Invalid prompt format: {type(prompt)}")
            return {"response": "Invalid prompt format. Please provide a text prompt."}
        
        # Trim very long prompts
        if len(prompt) > 10000:
            logger.warning(f"Prompt too long ({len(prompt)} chars), trimming to 10000 chars")
            prompt = prompt[:10000] + "... (truncated)"
        
        logger.info(f"Processing custom prompt: {prompt[:50]}...")
        
        try:
            # Generate response using the LLM service
            logger.info("Calling LLM service to generate response")
            
            response = await llm_service.generate_summary(
                prompt=prompt,
                model=settings.AZURE_OPENAI_DEPLOYMENT or "gpt-4.1-mini",
                max_tokens=500,
                temperature=0.85
            )
            
            if not response or not isinstance(response, str):
                logger.error(f"LLM service returned invalid response type: {type(response)}")
                return {"response": "Unable to process your request at this time."}
            
            logger.info(f"Successfully processed custom prompt, response length: {len(response)}")
            logger.info(f"Response preview: {response[:100]}...")
            
            # Return the response
            return {"response": response}
            
        except Exception as llm_error:
            logger.error(f"LLM service error: {llm_error}", exc_info=True)
            error_message = str(llm_error)
            logger.info(f"Returning error response: {error_message}")
            return {"response": f"Unable to process your request due to a service error: {error_message}", "error": True}
        
    except Exception as e:
        logger.error(f"Error processing custom prompt: {e}", exc_info=True)
        return {"response": f"Error processing your request: {str(e)}", "error": True}