FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download models during build
RUN mkdir -p /root/.paddlex/official_models && \
    python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='ru', use_textline_orientation=True)"

# Copy the application code
COPY app.py .

# Expose the port
EXPOSE 8000

# Run the application
CMD ["python", "app.py"]
