FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV SROL_ASSET_PREFIX=survival_assets

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:5000/health')" || exit 1

# Run the application with gunicorn in production
CMD ["python", "app.py"]

# For production, use:
# CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:APP"]
