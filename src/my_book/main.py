import litellm
litellm.cache=None

import asyncio
import json
from typing import List
from pydantic import BaseModel
from crewai.flow.flow import Flow, listen, start

from my_book.crews.outline_book_crew.outline_crew import OutlineCrew
from my_book.crews.write_book_crew.write_book_chapter_crew import WriteBookChapterCrew
from my_book.types import Chapter, ChapterOutline


class BookState(BaseModel):
    id: str = "1"
    title: str = "The Current State of AI in May 2025"
    book: List[Chapter] = []
    book_outline: List[ChapterOutline] = []
    topic: str = (
        "Exploring the latest trends in AI across different industries as of May 2025"
    )
    goal: str = """
        The goal of this book is to provide a comprehensive overview of the current
        state of artificial intelligence in May 2025. It will delve into the latest
        trends impacting various industries, analyze significant advancements, and
        discuss potential future developments. The book aims to inform readers about
        cutting-edge AI technologies and prepare them for upcoming innovations in the field.
    """


class BookFlow(Flow[BookState]):

    @start()
    def generate_book_outline(self):
        print("Kickoff the Book Outline Crew")
        output = (
            OutlineCrew()
            .crew()
            .kickoff(inputs={"topic": self.state.topic, "goal": self.state.goal})
        )

        # Parse the outline from the crew output
        chapters = self._parse_outline(output.raw)
        print("Chapters:", chapters)

        self.state.book_outline = chapters
        return chapters

    def _parse_outline(self, raw_output: str) -> List[ChapterOutline]:
        try:
            data = json.loads(raw_output)
            # Handle {"chapters": [...]} wrapper
            if isinstance(data, dict) and "chapters" in data:
                return [ChapterOutline(**ch) for ch in data["chapters"]]
            # Handle plain list
            if isinstance(data, list):
                return [ChapterOutline(**ch) for ch in data]
        except Exception as e:
            print(f"Parse error: {e}")
        print("Warning: Could not parse outline as JSON. Raw output:")
        print(raw_output)
        return [ChapterOutline(title="Chapter 1", description=raw_output[:500])]
    @listen(generate_book_outline)
    async def write_chapters(self):
        print("Writing Book Chapters")

        chapters = []
        for chapter_outline in self.state.book_outline:
            print(f"Writing Chapter: {chapter_outline.title}")
            print(f"Description: {chapter_outline.description}")
            
            output = await WriteBookChapterCrew().crew().kickoff_async(
                inputs={
                    "goal": self.state.goal,
                    "topic": self.state.topic,
                    "chapter_title": chapter_outline.title,
                    "chapter_description": chapter_outline.description,
                    "book_outline": json.dumps(
                        [co.model_dump() for co in self.state.book_outline]
                    ),
                }
            )
            chapter = Chapter(title=chapter_outline.title, content=output.raw)
            chapters.append(chapter)
            print(f"Finished: {chapter_outline.title}")

        self.state.book = chapters
    @listen(write_chapters)
    def save_book(self):
        print("Saving Book")
        book_path = "output/book.md"
        import os
        os.makedirs("output", exist_ok=True)

        with open(book_path, "w") as f:
            f.write(f"# {self.state.title}\n\n")
            for chapter in self.state.book:
                f.write(f"## {chapter.title}\n\n")
                f.write(chapter.content)
                f.write("\n\n")

        print(f"Book saved to {book_path}")


def kickoff():
    flow = BookFlow()
    flow.kickoff()


if __name__ == "__main__":
    kickoff()