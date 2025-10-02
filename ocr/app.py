from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
import uvicorn
import os
import logging
import sys
import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Dict, Optional
from functools import partial
from asyncio import Queue, get_event_loop
from concurrent.futures import ThreadPoolExecutor

# Set up detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Initialize PaddleOCR globally
ocr = None

# Create processing queue and results storage
process_queue = Queue()  # Use asyncio.Queue() instead of creating it early
results_storage: Dict[str, Optional[Dict]] = {}
MAX_QUEUE_SIZE = 10  # Limit queue size
worker_task = None
executor = ThreadPoolExecutor(max_workers=1)  # For OCR processing

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ocr, worker_task, process_queue
    logger.info("=" * 60)
    logger.info("APPLICATION STARTUP")
    logger.info("=" * 60)
    
    # Initialize OCR
    logger.info("Initializing PaddleOCR with Russian language support...")
    ocr = PaddleOCR(lang='ru', use_textline_orientation=True)
    logger.info("PaddleOCR initialized successfully!")
    
    # Initialize queue and worker
    loop = get_event_loop()
    process_queue = Queue()
    worker_task = loop.create_task(process_queue_worker())
    
    logger.info("Queue worker started")
    logger.info("Ready to process images")
    logger.info("=" * 60)
    
    try:
        yield
    finally:
        # Cleanup
        if worker_task:
            worker_task.cancel()
            try:
                await worker_task
            except:
                pass
        executor.shutdown(wait=False)
        logger.info("Application shutting down...")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def process_queue_worker():
    while True:
        try:
            # Get task from queue with timeout
            try:
                task_id, temp_path = await asyncio.wait_for(process_queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue

            logger.info(f"Processing task {task_id}")

            try:
                # Process image in thread executor
                loop = get_event_loop()
                result = await loop.run_in_executor(executor, ocr.predict, temp_path)
                
                # Extract text
                full_text = ""
                if isinstance(result, list) and len(result) > 0:
                    item = result[0]
                    if isinstance(item, dict) and 'rec_texts' in item:
                        texts = item['rec_texts']
                        full_text = "\n".join(texts)

                # Store result
                results_storage[task_id] = {"status": "completed", "text": full_text}
                
                # Cleanup
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    
            except Exception as e:
                logger.error(f"Error processing task {task_id}: {str(e)}")
                results_storage[task_id] = {"status": "error", "error": str(e)}
            
            finally:
                # Mark task as done
                process_queue.task_done()
                
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Queue worker error: {str(e)}")
            await asyncio.sleep(1)  # Prevent tight loop on error

async def handle_file_upload(file: UploadFile, temp_path: str, task_id: str):
    """Handle file upload in background"""
    try:
        # Read and save file
        file_data = await file.read()
        with open(temp_path, "wb") as f:
            f.write(file_data)
        
        # Add to processing queue
        await process_queue.put((task_id, temp_path))
        logger.info(f"Task {task_id} added to queue")
        
    except Exception as e:
        logger.error(f"Error handling file for task {task_id}: {str(e)}")
        results_storage[task_id] = {"status": "error", "error": str(e)}
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/health")
async def health_check():
    queue_size = process_queue.qsize()
    return {
        "status": "ok",
        "queue_size": queue_size,
        "max_queue_size": MAX_QUEUE_SIZE
    }

@app.post("/")
async def process_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        # Check queue size first - fast operation
        if process_queue.qsize() >= MAX_QUEUE_SIZE:
            raise HTTPException(
                status_code=429,
                detail="Queue is full. Please try again later."
            )

        # Generate task ID immediately
        task_id = str(uuid.uuid4())
        
        # Add to results storage immediately
        results_storage[task_id] = {"status": "pending"}
        
        # Schedule file handling as background task
        temp_path = f"/app/temp_{task_id}.png"
        background_tasks.add_task(handle_file_upload, file, temp_path, task_id)
        
        logger.info(f"Task {task_id} created")
        
        return {
            "task_id": task_id,
            "status": "pending",
            "queue_position": process_queue.qsize()
        }
        
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/{task_id}")
async def get_result(task_id: str):
    if task_id not in results_storage:
        raise HTTPException(status_code=404, detail="Task not found")
    
    result = results_storage[task_id]
    
    # Only schedule cleanup if the task is complete
    if result["status"] in ["completed", "error"]:
        # Use create_task to run cleanup in background without awaiting
        asyncio.create_task(cleanup_result(task_id))
    
    # Add queue position if task is still pending
    if result["status"] == "pending":
        # Get current queue position
        queue_items = list(process_queue._queue)  # Get queue items
        try:
            position = next(i for i, (tid, _) in enumerate(queue_items) if tid == task_id) + 1
            result["queue_position"] = position
        except StopIteration:
            result["queue_position"] = 0  # File is being saved but not yet in queue
    
    return result

async def cleanup_result(task_id: str, delay: int = 300):
    """Clean up completed results after delay seconds"""
    await asyncio.sleep(delay)
    results_storage.pop(task_id, None)

if __name__ == "__main__":
    logger.info("Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")