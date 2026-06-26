from pydantic import BaseModel
from typing import List

class ChapterOutline(BaseModel):
    title: str
    description: str

class Chapter(BaseModel):
    title: str
    content: str

class OutlineOutput(BaseModel):
    chapters: List[ChapterOutline]