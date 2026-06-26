from crewai import Agent, Task, Crew, LLM
from crewai_tools import SerperDevTool
from crewai.project import CrewBase, agent, task, crew
from dotenv import load_dotenv
import os
from my_book.types import OutlineOutput

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

@CrewBase
class OutlineCrew:
    """Book Outline Crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    llm = LLM(
        model="groq/llama-3.1-8b-instant",
        temperature=0,
        api_key=GROQ_API_KEY
    )

    @agent
    def researcher(self) -> Agent:
        search_tool = SerperDevTool()
        return Agent(
            config=self.agents_config["researcher"],
            tools=[search_tool],
            llm=self.llm,
            verbose=True,
        )

    @agent
    def outliner(self) -> Agent:
        return Agent(
            config=self.agents_config["outliner"],
            llm=self.llm,
            verbose=True,
        )

    @task
    def research_topic(self) -> Task:
        return Task(
            config=self.tasks_config["research_topic"],
        )

    @task
    def generate_outline(self) -> Task:
        return Task(
            config=self.tasks_config["generate_outline"],
            output_pydantic=OutlineOutput,
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True,
        )