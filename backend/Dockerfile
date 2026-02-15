FROM python:3.12-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PREFER_IPV4=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libjpeg-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies
# We use the full python image which includes build-essential and other tools
# This helps us skip the failing 'apt-get update' if DNS is an issue
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements.txt

# Install heavy dependencies (separate layer for better caching if it fails)
COPY requirements-heavy.txt .
RUN pip install --no-cache-dir --default-timeout=2000 --retries 20 -r requirements-heavy.txt

# Copy project files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8888

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8888"]
