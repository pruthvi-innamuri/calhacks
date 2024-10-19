from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import PyPDF2
from fillpdf import fillpdfs
from typing import List, Dict
import json
import os
import tempfile
from data_models import GroqInput
from groq_chat_service import GroqChatService
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store temporary file paths
temp_files = []

# Initialize GroqChatService
groq_chat_service = GroqChatService()

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@app.get("/get_fields")
async def get_fields(input_pdf_path: str) -> List[str]:
    reader = PyPDF2.PdfReader(input_pdf_path)
    form_fields = reader.get_fields()
    return list(form_fields.keys())

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Create a temporary file to store the uploaded PDF
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_file.write(await file.read())
        temp_file.close()
        temp_files.append(temp_file.name)
        return {"filepath": temp_file.name}
    except Exception as e:
        return {"error": str(e)}

@app.post("/fill_pdf")
async def fill_pdf(
    file: UploadFile = File(...),
    field_data: str = Form(...)
):
    input_pdf_path = None
    output_pdf_path = None
    try:
        # Create a temporary file to store the uploaded PDF
        input_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        input_file.write(await file.read())
        input_file.close()
        input_pdf_path = input_file.name
        temp_files.append(input_pdf_path)

        # Create a temporary file for the output PDF
        output_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        output_file.close()
        output_pdf_path = output_file.name
        temp_files.append(output_pdf_path)

        # Parse the field_data JSON string
        field_data_dict = json.loads(field_data)

        # Fill the PDF
        fillpdfs.write_fillable_pdf(input_pdf_path, output_pdf_path, field_data_dict, flatten=False)

        # Return the filled PDF as a file response
        return FileResponse(output_pdf_path, media_type="application/pdf", filename="filled_document.pdf")
    except Exception as e:
        return {"error": str(e)}


@app.post("/chat")
async def chat(request: GroqInput):
    return groq_chat_service.respond(request)

@app.on_event("shutdown")
async def cleanup_temp_files():
    for file_path in temp_files:
        try:
            os.unlink(file_path)
        except Exception as e:
            print(f"Error deleting temporary file {file_path}: {e}")
