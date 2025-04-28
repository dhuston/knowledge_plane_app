from pydantic import BaseModel

class BriefingResponse(BaseModel):
    summary: str 