.\venv\Scripts\activate 

pip install paddleocr 

pip install paddlepaddle 

\ocr> paddleocr ocr -i ttn1.png --lang ru

docker-compose build --no-cache
docker-compose up


docker-compose down
docker-compose build
docker-compose up -d

docker-compose logs -f

ocr-service  | INFO:     Application startup complete.
ocr-service  | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)




















from fastapi import FastAPI, UploadFile, File, HTTPException
from paddleocr import PaddleOCR
import uvicorn
import io
from PIL import Image
import logging
import sys
import os
from contextlib import asynccontextmanager

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Initialize PaddleOCR globally
ocr = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize on startup
    global ocr
    logger.info("Starting application...")
    logger.info("Initializing PaddleOCR...")
    ocr = PaddleOCR(lang='ru', use_textline_orientation=True)
    logger.info("PaddleOCR initialized successfully")
    yield
    # Clean up on shutdown
    logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}

@app.post("/ocr")
async def process_image(file: UploadFile = File(...)):
    try:
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        # Read the uploaded image
        image_data = await file.read()
        logger.info(f"Read {len(image_data)} bytes")
        
        # Save image temporarily for debugging
        temp_path = "/app/temp_image.png"
        with open(temp_path, "wb") as f:
            f.write(image_data)
        logger.info(f"Saved temporary image to {temp_path}")
        
        # Open and verify the image
        try:
            image = Image.open(io.BytesIO(image_data))
            logger.info(f"Image opened successfully: format={image.format}, size={image.size}, mode={image.mode}")
        except Exception as e:
            logger.error(f"Failed to open image: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        # Run OCR directly on saved file
        try:
            logger.info("Starting OCR processing...")
            result = ocr.predict(temp_path)
            logger.info(f"Raw OCR result type: {type(result)}")
            logger.info(f"Raw OCR result: {result}")
        except Exception as e:
            logger.error(f"OCR failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
        
        # Process results with more careful handling
        text_results = []
        try:
            if result and isinstance(result, list):
                for item in result:
                    logger.info(f"Processing item: {item}")
                    if isinstance(item, list):
                        for detection in item:
                            if isinstance(detection, tuple) and len(detection) == 2:
                                box, (text, confidence) = detection
                                text_results.append({
                                    'text': text,
                                    'confidence': float(confidence),
                                    'box': box
                                })
                            else:
                                logger.warning(f"Unexpected detection format: {detection}")
                    else:
                        logger.warning(f"Unexpected item format: {item}")
        except Exception as e:
            logger.error(f"Error processing results: {str(e)}")
            logger.error(f"Result that caused error: {result}")
            # Continue with what we have instead of failing
        
        logger.info(f"Returning {len(text_results)} results")
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return {"results": text_results}
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
