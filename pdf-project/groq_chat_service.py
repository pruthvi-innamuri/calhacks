from groq import Groq
from keys import GROQ_API_KEY
from typing import AsyncGenerator
import asyncio
from data_models import GroqInput
from fastapi.responses import StreamingResponse, JSONResponse

class GroqChatService:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama3-8b-8192"

    async def get_groq_response(self, request: GroqInput) -> AsyncGenerator[str, None]:
        try:
            messages = [
                {"role": "system", "content": f"Context:\n{request.context}"},
                {"role": "user", "content": request.query}
            ]

            stream = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0.5,
                max_tokens=1024,
                top_p=1,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield f"Error: {str(e)}"

    async def stream_response(self, request: GroqInput):
        async for chunk in self.get_groq_response(request):
            yield chunk

    def respond(self, request: GroqInput) -> StreamingResponse:
        return StreamingResponse(self.stream_response(request), media_type="text/plain")
