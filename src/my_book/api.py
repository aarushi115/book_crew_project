from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from my_book.main import BookFlow  # Assumes your Flow class is in main.py
import uvicorn

app = FastAPI(title="Book Crew AI API", version="1.0")

# Define what the incoming requests must look like
class BookRequest(BaseModel):
    topic: str
    goal: str

@app.post("/generate-book")
async def generate_book(request: BookRequest):
    try:
        # Initialize your existing flow with user inputs
        flow = BookFlow()
        flow.state.topic = request.topic
        flow.state.goal = request.goal
        
        # Execute the flow asynchronously
        result = await flow.kickoff_async()
        
        # Return the generated chapters stored in your state
        return {
            "status": "success",
            "book": [
                {"title": ch.title, "content": ch.content} 
                for ch in flow.state.book
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def start():
    """Helper to run the server via uv command"""
    uvicorn.run("my_book.api:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    start()