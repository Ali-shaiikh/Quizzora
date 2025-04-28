from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile
import subprocess
import whisper
import pdfplumber
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
import time
from tqdm import tqdm
import concurrent.futures
import hashlib
import pickle
import re


from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from werkzeug.utils import secure_filename

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


TEMP_DIR = "temp_files"
UPLOAD_FOLDER = "uploads"
DB_PATH = "./chroma_db"
CACHE_DIR = "./summary_cache"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)


whisper_model = whisper.load_model("tiny")  


try:
    
    summarizer = pipeline(
        "summarization", 
        model="facebook/bart-large-cnn",
        device=0 if os.environ.get("USE_GPU", "0") == "1" else -1
    )
    print("Loaded BART model for summarization")
except Exception as e:
    print(f"Failed to load BART: {e}, falling back to T5-small")
    summarizer = pipeline("summarization", model="t5-small")


processing_status = {}

embedding_model = OllamaEmbeddings(model="nomic-embed-text")
vector_store = Chroma(persist_directory=DB_PATH, embedding_function=embedding_model)

if os.path.exists(DB_PATH) and len(vector_store.get()["documents"]) > 0:
    print("✅ ChromaDB already has stored embeddings. Skipping re-processing.")
else:
    print("No existing embeddings found in ChromaDB. New data will be added.")


class YouTubeRequest(BaseModel):
    url: str

class QuizRequest(BaseModel):
    topic: str

class StatusResponse(BaseModel):
    status: str
    progress: float
    details: str
    

def get_file_hash(file_path):
    """Generate a hash of the file content for caching purposes"""
    h = hashlib.md5()
    with open(file_path, 'rb') as file:
        chunk = 0
        while chunk != b'':
            chunk = file.read(1024 * 1024)  # Read 1MB at a time
            h.update(chunk)
    return h.hexdigest()

def check_cache(file_hash, operation="summary"):
    """Check if we have a cached result for this file"""
    cache_path = os.path.join(CACHE_DIR, f"{file_hash}_{operation}.pkl")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"Cache read error: {e}")
    return None

def save_to_cache(file_hash, data, operation="summary"):
    """Save results to cache"""
    cache_path = os.path.join(CACHE_DIR, f"{file_hash}_{operation}.pkl")
    try:
        with open(cache_path, 'wb') as f:
            pickle.dump(data, f)
    except Exception as e:
        print(f"Cache write error: {e}")

# Core processing functions for content extraction
def extract_text_from_pdf(pdf_path, task_id=None):
    """Extract text from PDF with support for progress tracking"""
    try:
        # Only process TOC and select sections for very large PDFs
        is_large_pdf = False
        with pdfplumber.open(pdf_path) as pdf:
            if len(pdf.pages) > 100:
                is_large_pdf = True
                
        if is_large_pdf:
            # For large PDFs, extract TOC and focus on key sections
            return extract_key_sections_from_pdf(pdf_path, task_id)
        
        # Using PyMuPDFLoader for better handling of regular PDFs
        loader = PyMuPDFLoader(pdf_path)
        documents = loader.load()
        
        # Update progress status
        if task_id:
            update_status(task_id, 0.5, "Extracted text from PDF")
            
        text = "\n\n".join([doc.page_content for doc in documents])
        return text.strip()
    except Exception as e:
        print(f"Error using PyMuPDFLoader: {str(e)}. Falling back to pdfplumber.")
        # Fallback to pdfplumber
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                text += page_text + "\n"
                
                # Update progress status every 10 pages
                if task_id and i % 10 == 0:
                    progress = i / total_pages * 0.5  # 50% of the task is PDF extraction
                    update_status(task_id, progress, f"Extracted {i}/{total_pages} pages")
        
        return text.strip()

def extract_key_sections_from_pdf(pdf_path, task_id=None):
    """Extract only important sections from a very large PDF"""
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Large PDF detected with {total_pages} pages. Extracting key sections only.")
        
        # First, extract table of contents (if available)
        toc_text = ""
        intro_text = ""
        main_chapters_text = []
        conclusion_text = ""
        
        # Extract first few pages (likely TOC, intro)
        for i in range(min(20, total_pages)):
            text = pdf.pages[i].extract_text() or ""
            if "table of contents" in text.lower() or "contents" in text.lower():
                toc_text += text + "\n"
            else:
                intro_text += text + "\n"
                
            if task_id:
                update_status(task_id, 0.05, "Extracting TOC and intro")
        
        # Extract important pages based on chapter headings
        chapter_pages = []
        chapter_pattern = re.compile(r'^chapter\s+\d+|^\d+\.\s+|^section\s+\d+', re.IGNORECASE)
        
        # Sample pages throughout the document to find chapter starts
        sample_indices = [i for i in range(0, total_pages, max(1, total_pages // 100))]
        
        for i in sample_indices:
            text = pdf.pages[i].extract_text() or ""
            if chapter_pattern.search(text):
                chapter_pages.append(i)
                
        # Add pages around each chapter
        pages_to_extract = set()
        for page in chapter_pages:
            # Add this page and a few pages after it
            for p in range(page, min(page + 5, total_pages)):
                pages_to_extract.add(p)
        
        # Add ending pages
        for i in range(max(0, total_pages - 15), total_pages):
            pages_to_extract.add(i)
            
        # Extract the selected pages
        pages_to_extract = sorted(list(pages_to_extract))
        for i, page_num in enumerate(pages_to_extract):
            text = pdf.pages[page_num].extract_text() or ""
            if page_num >= total_pages - 15:
                conclusion_text += text + "\n"
            else:
                main_chapters_text.append(text)
                
            if task_id:
                progress = 0.05 + (i / len(pages_to_extract) * 0.45)
                update_status(task_id, progress, f"Extracting key section {i+1}/{len(pages_to_extract)}")
        
        # Combine all extracted content
        combined_text = intro_text + "\n\n" + "\n\n".join(main_chapters_text) + "\n\n" + conclusion_text
        print(f"Extracted {len(combined_text.split())} words from key sections")
        
        return combined_text

def download_youtube_video(youtube_url):
    """Download YouTube video with better error handling"""
    try:
        video_filename = os.path.join(TEMP_DIR, f"downloaded_video_{uuid.uuid4()}.mp4")
        command = f'yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" -o "{video_filename}" {youtube_url}'
        
        # Run yt-dlp with output capturing
        process = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        
        if not os.path.exists(video_filename):
            raise Exception("Video download failed: output file not created")
            
        return video_filename
    except subprocess.CalledProcessError as e:
        print(f"yt-dlp error output: {e.stderr}")
        raise Exception(f"Failed to download video: {e.stderr}")
    except Exception as e:
        print(f"Error downloading video: {str(e)}")
        raise

def extract_audio(video_file):
    """Extract audio from video file with better error handling"""
    try:
        if not os.path.exists(video_file):
            raise Exception(f"Video file not found: {video_file}")
            
        audio_file = os.path.join(TEMP_DIR, f"extracted_audio_{uuid.uuid4()}.wav")
        
        # Run ffmpeg with output capturing
        process = subprocess.run(
            f'ffmpeg -i "{video_file}" -acodec pcm_s16le -ar 44100 "{audio_file}" -y',
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        
        if not os.path.exists(audio_file):
            raise Exception("Audio extraction failed: output file not created")
            
        return audio_file
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error output: {e.stderr}")
        raise Exception(f"FFmpeg error: {e.stderr}")
    except Exception as e:
        print(f"Error extracting audio: {str(e)}")
        raise

def transcribe_audio(audio_file):
    return whisper_model.transcribe(audio_file)["text"]

def update_status(task_id, progress, details):
    """Update the status of a processing task"""
    if task_id in processing_status:
        processing_status[task_id]["progress"] = progress
        processing_status[task_id]["details"] = details
        print(f"Task {task_id}: {progress*100:.1f}% - {details}")

def summarize_chunk(chunk):
    """Summarize a single chunk of text"""
    try:
        if len(chunk) < 100:  # Skip very small chunks
            return ""
        return summarizer(chunk, max_length=150, min_length=30, do_sample=False)[0]['summary_text']
    except Exception as e:
        print(f"Error summarizing chunk: {str(e)}")
        # Return a shortened version of the chunk if summarization fails
        return chunk[:200] + "..."

def process_chunks_parallel(chunks, max_workers=4):
    """Process chunks in parallel for faster summarization"""
    summaries = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as executor:
        # Submit tasks
        future_to_chunk = {executor.submit(summarize_chunk, chunk): i for i, chunk in enumerate(chunks)}
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_chunk):
            chunk_idx = future_to_chunk[future]
            try:
                summary = future.result()
                if summary:
                    summaries.append((chunk_idx, summary))
            except Exception as e:
                print(f"Chunk {chunk_idx} processing error: {str(e)}")
    
    # Sort summaries by original chunk index
    summaries.sort(key=lambda x: x[0])
    return [summary for _, summary in summaries]

def summarize_large_document_optimized(text, task_id=None, chunk_size=2000):
    """
    Optimized hierarchical summarization for large documents.
    Uses parallel processing and smarter chunking.
    """
    start_time = time.time()
    
    if task_id:
        update_status(task_id, 0.5, "Starting document summarization")
    
    # Use RecursiveCharacterTextSplitter for smarter chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, 
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = text_splitter.split_text(text)
    
    # Skip very large documents processing beyond a certain point
    if len(chunks) > 300:
        print(f"Very large document with {len(chunks)} chunks, focusing on key chunks only")
        # Keep intro chunks
        key_chunks = chunks[:10]
        
        # Sample chunks from the middle (every N chunks)
        step = max(1, len(chunks) // 50)
        for i in range(10, len(chunks) - 10, step):
            key_chunks.append(chunks[i])
            
        # Keep conclusion chunks
        key_chunks.extend(chunks[-10:])
        chunks = key_chunks
    
    print(f"Document split into {len(chunks)} chunks for summarization")
    
    if task_id:
        update_status(task_id, 0.6, f"Processing {len(chunks)} chunks")
    
    # First level: Summarize chunks in parallel
    use_parallel = len(chunks) > 10  # Only use parallel for larger documents
    
    if use_parallel:
        chunk_summaries = process_chunks_parallel(chunks)
    else:
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            chunk_summary = summarize_chunk(chunk)
            if chunk_summary:
                chunk_summaries.append(chunk_summary)
            
            if task_id and i % 5 == 0:
                progress = 0.6 + (i / len(chunks) * 0.3)
                update_status(task_id, progress, f"Summarized {i}/{len(chunks)} chunks")
    
    # If we have only a few summaries, just combine them
    if len(chunk_summaries) <= 5:
        final_summary = " ".join(chunk_summaries)
        if task_id:
            update_status(task_id, 1.0, "Summarization completed")
        print(f"Summarization completed in {time.time() - start_time:.2f} seconds")
        return final_summary
    
    # Second level: Combine and re-summarize
    if task_id:
        update_status(task_id, 0.9, "Creating final summary")
        
    # Combine the summaries
    combined_text = " ".join(chunk_summaries)
    
    # Re-chunk and summarize at second level if needed
    if len(combined_text.split()) > 1000:
        # Split into larger chunks for second level
        second_chunks = text_splitter.split_text(combined_text)
        second_summaries = []
        
        for chunk in second_chunks:
            summary = summarize_chunk(chunk)
            if summary:
                second_summaries.append(summary)
                
        final_summary = " ".join(second_summaries)
    else:
        final_summary = combined_text
    
    if task_id:
        update_status(task_id, 1.0, "Summarization completed")
        
    print(f"Summarization completed in {time.time() - start_time:.2f} seconds")
    print(f"Final summary word count: {len(final_summary.split())}")
    return final_summary

def store_in_chroma(text, source="unknown"):
    # Split the text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=100)
    chunks = text_splitter.split_text(text)
    
    # Store in ChromaDB
    metadatas = [{"source": source} for _ in chunks]
    vector_store.add_texts(texts=chunks, metadatas=metadatas)
    vector_store.persist()
    print(f"Stored {len(chunks)} chunks in ChromaDB from source: {source}")
    
def generate_quiz(topic):
    # Search for relevant content in ChromaDB
    results = vector_store.similarity_search_with_score(topic, k=5)
    filtered_results = [res[0] for res in results if res[1] >= 0.5]
    
    if not filtered_results:
        return {"error": "No relevant content found for quiz"}
    
    relevant_text = "\n\n".join([res.page_content for res in filtered_results])
    
    llm = OllamaLLM(model="llama3.2:3b")
    prompt = f"""
    Based on the following content, generate a **quiz** related to the topic "{topic}".
    
    ### **Quiz Format:**  
    #### **Section 1: Multiple-Choice Questions (MCQs) (2 marks each)**
    - Generate **5 MCQs** related to {topic}.
    - Each question should have **4 options** labeled **a, b, c, d**.
    - Indicate the **correct answer** clearly.

    #### **Section 2: Descriptive Questions**
    - **Q6 (10 marks):** Generate a **long-answer question** (with a detailed answer).  
    - **Q7 (5 marks):** Generate a **medium-length question** (with an answer).
    
    Content: {relevant_text}
    
    Please format the output as JSON with the following structure:
    {{
        "mcq": [
            {{
                "question": "Question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0  // index of correct answer (0 for A, 1 for B, etc.)
            }}
            // more questions...
        ],
        "short": [
            {{
                "question": "Short answer question",
                "sampleAnswer": "Sample answer text"
            }}
            // more questions...
        ]
    }}
    """
    
    try:
        response = llm.invoke(prompt)
        
        # Parse the response to extract quiz
        import json
        import re
        
        # Find JSON content (between curly braces)
        json_pattern = r'\{[\s\S]*\}'
        json_match = re.search(json_pattern, response)
        
        if json_match:
            try:
                quiz_data = json.loads(json_match.group(0))
                return quiz_data
            except json.JSONDecodeError:
                # If JSON parsing fails, return raw response
                return {"raw_response": response}
        else:
            return {"raw_response": response}
            
    except Exception as e:
        return {"error": f"Failed to generate quiz: {str(e)}"}

def process_file_background(file_path, file_name, task_id):
    """Process file in background"""
    try:
        # Determine file type and process accordingly
        transcript = ""
        print(f"Background processing file: {file_name}")
        update_status(task_id, 0.0, "Starting file processing")
        
        # Check cache first
        file_hash = get_file_hash(file_path)
        cached_result = check_cache(file_hash)
        if cached_result:
            print("Found cached summary, using that")
            update_status(task_id, 1.0, "Retrieved from cache")
            processing_status[task_id]["summary"] = cached_result
            processing_status[task_id]["completed"] = True
            return
        
        if file_name.endswith(".pdf"):
            print("Detected PDF file, extracting text...")
            update_status(task_id, 0.1, "Extracting text from PDF")
            transcript = extract_text_from_pdf(file_path, task_id)
            print(f"Extracted {len(transcript.split())} words from PDF")
        elif file_name.endswith((".mp3", ".wav", ".m4a")):
            print("Detected audio file, transcribing...")
            update_status(task_id, 0.1, "Transcribing audio")
            transcript = transcribe_audio(file_path)
        elif file_name.endswith((".mp4", ".mkv", ".avi")):
            print("Detected video file, extracting audio and transcribing...")
            update_status(task_id, 0.1, "Extracting audio")
            audio_file = extract_audio(file_path)
            update_status(task_id, 0.3, "Transcribing audio")
            transcript = transcribe_audio(audio_file)
            os.remove(audio_file)  # Clean up extracted audio
        else:
            update_status(task_id, 1.0, "Error: Unsupported file format")
            processing_status[task_id]["error"] = "Unsupported file format"
            processing_status[task_id]["completed"] = True
            return
        
        # Generate summary if we have content
        if transcript:
            print(f"Starting to process {len(transcript.split())} words for summarization")
            
            # Store in ChromaDB for quiz generation (in background)
            store_in_chroma(transcript, source=file_name)
            
            # Generate optimized summary for large documents
            print("Generating summary...")
            summary = summarize_large_document_optimized(transcript, task_id)
            print(f"Generated summary of {len(summary.split())} words")
            
            # Cache the result
            save_to_cache(file_hash, summary)
            
            # Store result and mark as complete
            processing_status[task_id]["summary"] = summary
            processing_status[task_id]["completed"] = True
            update_status(task_id, 1.0, "Processing complete")
        else:
            processing_status[task_id]["error"] = "Failed to extract content from file"
            processing_status[task_id]["completed"] = True
            update_status(task_id, 1.0, "Error: Failed to extract content")
    
    except Exception as e:
        import traceback
        print(f"Exception during processing: {str(e)}")
        print(traceback.format_exc())
        processing_status[task_id]["error"] = f"Processing error: {str(e)}"
        processing_status[task_id]["completed"] = True
        update_status(task_id, 1.0, f"Error: {str(e)}")
    finally:
        # Clean up the uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

# API endpoints
@app.post("/api/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Save the uploaded file to temp directory
    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Generate a task ID
    task_id = str(uuid.uuid4())
    
    # Check file hash for cache
    file_hash = get_file_hash(file_path)
    cached_result = check_cache(file_hash)
    
    if cached_result:
        # If we have a cached result, return it immediately
        return {"summary": cached_result, "fromCache": True}
    else:
        # Initialize status tracker
        processing_status[task_id] = {
            "status": "processing",
            "progress": 0.0,
            "details": "Initializing",
            "completed": False
        }
        
        # Start background processing
        background_tasks.add_task(
            process_file_background, 
            file_path, 
            file.filename, 
            task_id
        )
        
        # Return task ID for status checking
        return {"taskId": task_id, "status": "processing"}

@app.get("/api/status/{task_id}")
async def get_status(task_id: str):
    """Check the status of a processing task"""
    if task_id not in processing_status:
        return JSONResponse(
            content={"error": "Task not found"}, 
            status_code=404
        )
    
    status_data = processing_status[task_id]
    
    # If processing is complete, return the summary or error
    if status_data.get("completed", False):
        if "error" in status_data:
            return {"status": "error", "error": status_data["error"]}
        else:
            return {"status": "completed", "summary": status_data["summary"]}
    
    # Otherwise return progress information
    return {
        "status": "processing",
        "progress": status_data["progress"],
        "details": status_data["details"]
    }

@app.post("/api/youtube")
async def process_youtube(background_tasks: BackgroundTasks, request: YouTubeRequest):
    try:
        # Generate a task ID
        task_id = str(uuid.uuid4())
        
        # Initialize status tracker
        processing_status[task_id] = {
            "status": "processing",
            "progress": 0.0,
            "details": "Initializing YouTube download",
            "completed": False
        }
        
        # Start processing in background
        background_tasks.add_task(
            process_youtube_background,
            request.url,
            task_id
        )
        
        # Return task ID for status checking
        return {"taskId": task_id, "status": "processing"}
    except Exception as e:
        import traceback
        print(f"Exception during YouTube processing: {str(e)}")
        print(traceback.format_exc())
        return {"error": f"Error processing YouTube video: {str(e)}"}

def process_youtube_background(url, task_id):
    """Process YouTube video in background"""
    try:
        # Download YouTube video
        print(f"Downloading YouTube video: {url}")
        update_status(task_id, 0.1, "Downloading YouTube video")
        video_path = download_youtube_video(url)
        
        # Extract audio and transcribe
        print("Extracting audio from video...")
        update_status(task_id, 0.3, "Extracting audio")
        audio_path = extract_audio(video_path)
        print("Transcribing audio...")
        update_status(task_id, 0.5, "Transcribing audio")
        transcript = transcribe_audio(audio_path)
        
        # Store in ChromaDB for quiz generation
        print("Storing transcript in ChromaDB...")
        store_in_chroma(transcript, source=f"YouTube: {url}")
        
        # Generate summary
        print("Generating summary...")
        summary = summarize_large_document_optimized(transcript, task_id)
        
        # Store result and mark as complete
        processing_status[task_id]["summary"] = summary
        processing_status[task_id]["completed"] = True
        update_status(task_id, 1.0, "Processing complete")
        
        # Clean up
        os.remove(video_path)
        os.remove(audio_path)
        
    except Exception as e:
        import traceback
        print(f"Exception during YouTube processing: {str(e)}")
        print(traceback.format_exc())
        processing_status[task_id]["error"] = f"Error processing YouTube video: {str(e)}"
        processing_status[task_id]["completed"] = True
        update_status(task_id, 1.0, f"Error: {str(e)}")

@app.post("/api/generate_quiz")
async def generate_quiz_endpoint(topic: str = Form(...)):
    try:
        print(f"Generating quiz for topic: {topic}")
        quiz_data = generate_quiz(topic)
        print(f"Generated quiz data: {quiz_data}")
        
        # If there's an error or raw response, return as is
        if "error" in quiz_data or "raw_response" in quiz_data:
            print(f"Returning error or raw response: {quiz_data}")
            return JSONResponse(content=quiz_data, status_code=200)
            
        # Transform the data to match frontend's expected format
        transformed_data = {
            "quiz": quiz_data.get("mcq", []),  # Multiple choice questions
            "shortAnswers": quiz_data.get("short", []),  # Short answer questions
            "source": f"Topic: {topic}"  # Add source information
        }
        
        print(f"Transformed quiz data: {transformed_data}")
        return JSONResponse(content=transformed_data, status_code=200)
    except Exception as e:
        import traceback
        print(f"Exception during quiz generation: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            content={"error": "Failed to generate quiz", "details": str(e)}, 
            status_code=500
        )

# Run the app
if __name__ == "__main__":
    import uvicorn
    print("Starting Quizzora backend server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)