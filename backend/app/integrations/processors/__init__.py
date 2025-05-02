"""
Integration processor subpackage.

This package contains all the processors for handling different types of 
external data in the integration framework.
"""

from .calendar_processor import CalendarEventProcessor
from .research_paper_processor import ResearchPaperProcessor

__all__ = ["CalendarEventProcessor", "ResearchPaperProcessor"]