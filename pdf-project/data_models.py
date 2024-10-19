import pydantic
from typing import List
class Message(pydantic.BaseModel):
    role: str
    content: str

class GroqInput(pydantic.BaseModel):
    context: str
    query: str