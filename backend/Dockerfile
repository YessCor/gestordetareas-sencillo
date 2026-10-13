FROM python:3.12-slim

WORKDIR /app

# Copiar dependencias primero para aprovechar la caché de capas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]
