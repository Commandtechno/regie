FROM python:3.13-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies from lockfile
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy source
COPY . .

# documents/ is runtime-generated (gitignored); pre-create it
RUN mkdir -p documents

EXPOSE 5000
ENV PYTHONUNBUFFERED=1
CMD ["uv", "run", "python", "main.py"]
