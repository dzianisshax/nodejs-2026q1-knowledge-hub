# Knowledge Hub

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

## Downloading

```
git clone {repository URL}
```

## Installing NPM modules

```
npm install
```

## Running application

```
npm start
```

After starting the app on port (4000 as default) you can open
in your browser OpenAPI documentation by typing http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

To run all test with authorization

```
npm run test:auth
```

To run only specific test suite with authorization

```
npm run test:auth -- <path to suite>
```

To run refresh token tests

```
npm run test:refresh
```

To run RBAC (role-based access control) tests

```
npm run test:rbac
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging

---

## Getting a Gemini API Key

1. Open [https://aistudio.google.com](https://aistudio.google.com) in your browser
2. Sign in with your Google account
3. Click **"Get API key"** in the left sidebar
4. Click **"Create API key"**
5. Select an existing Google Cloud project or click **"Create a new project"**
6. Click **"Create API key in existing project"**
7. Copy the generated key — it starts with `AIzaSy...`
8. Paste it into your `.env` file in the `GEMINI_API_KEY` line

---

## Gemini Model

This project uses **`gemini-2.0-flash`** by default.

- Fast response times optimized for high-frequency tasks
- Supports text generation, translation, summarization, and analysis
- Free tier: 15 requests per minute, 1 500 requests per day, 1 million tokens per minute
- Configurable via the `GEMINI_MODEL` environment variable

---

## Testing AI Endpoints

### 1. Sign up and get a token

```bash
# Sign up
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{ "login": "testuser", "password": "testpass123" }'

# Log in and copy the accessToken from the response
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "login": "testuser", "password": "testpass123" }'
```

Set the token for subsequent requests:

```bash
TOKEN=
```

### 2. Get an article ID

```bash
curl http://localhost:4000/article \
  -H "Authorization: Bearer $TOKEN"
```

Copy one of the `id` values from the response.

```bash
ARTICLE_ID=
```

### 3. Summarize an article

```bash
curl -X POST http://localhost:4000/ai/articles/$ARTICLE_ID/summarize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "maxLength": "short" }'
```

Expected response:

```json
{
  "articleId": "...",
  "summary": "...",
  "originalLength": 312,
  "summaryLength": 87
}
```

### 4. Translate an article

```bash
curl -X POST http://localhost:4000/ai/articles/$ARTICLE_ID/translate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "targetLanguage": "Spanish" }'
```

Expected response:

```json
{
  "articleId": "...",
  "translatedText": "...",
  "detectedLanguage": "en"
}
```

### 5. Analyze an article

```bash
curl -X POST http://localhost:4000/ai/articles/$ARTICLE_ID/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "task": "review" }'
```

Expected response:

```json
{
  "articleId": "...",
  "analysis": "...",
  "suggestions": ["...", "..."],
  "severity": "info"
}
```

### 6. Generic prompt with conversation context

```bash
# Turn 1
curl -X POST http://localhost:4000/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "What is REST?", "sessionId": "my-session-1" }'

# Turn 2 — Gemini remembers the previous exchange
curl -X POST http://localhost:4000/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "Give me a practical example.", "sessionId": "my-session-1" }'
```

### 7. Check usage and cache stats

```bash
curl http://localhost:4000/ai/usage \
  -H "Authorization: Bearer $TOKEN"
```

---

## Known Limitations

### Free tier quotas (Gemini API)

| Limit               | Value     |
| ------------------- | --------- |
| Requests per minute | 15 RPM    |
| Requests per day    | 1 500     |
| Tokens per minute   | 1 000 000 |

Exceeding these limits returns HTTP `429` from Google. The app retries automatically up to 3 times with exponential backoff before returning `503` to the client.

### Latency

- Gemini responses typically take **500ms–3000ms** depending on content length and model load
- The app enforces a **30-second timeout** per request
- Cached responses (summarize, translate) are returned in **< 5ms**

### Regional availability

- Google AI Studio and the Gemini API are **not available in all countries**
- EU users may encounter "location not supported" errors due to data residency regulations
- Workarounds: use a VPN, or switch to the Vertex AI API (requires a GCP project with billing enabled)

### In-memory state

- **Cache**, **rate limiter**, **usage stats**, and **conversation sessions** are all stored in memory
- All state is **lost on server restart**
- Running **multiple instances** of the app will result in inconsistent state across instances
- For production multi-instance deployments, replace with Redis-backed implementations

### API key security

- The `GEMINI_API_KEY` is never logged or included in error responses
- Do not commit your `.env` file — it is listed in `.gitignore`
- Rotate your key immediately at [https://aistudio.google.com](https://aistudio.google.com) if it is accidentally exposed

## RAG (Retrieval-Augmented Generation)

### Models used

| Purpose         | Model                                 |
| --------------- | ------------------------------------- |
| Text generation | `gemini-2.5-flash`                    |
| Embeddings      | `text-embedding-004` (768 dimensions) |

### Vector DB

**Qdrant** runs as a Docker service (`vectordb`) on port `6333`.
Data is persisted in the `qdrant-data` named volume.
Qdrant UI is available at [http://localhost:6333/dashboard](http://localhost:6333/dashboard).

### Startup flow

```bash
# 1. Copy and fill env
cp .env.example .env
# Set GEMINI_API_KEY, DATABASE_URL, and RAG_* vars

# 2. Start all services
docker compose up --build

# 3. Get a token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

TOKEN=<paste accessToken>

# 4. Build the vector index (index published articles)
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onlyPublished": true}'

# 5. Semantic search
curl -X POST http://localhost:4000/ai/rag/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "how to use Prisma with NestJS", "limit": 3}'

# 6. Chat with your knowledge base
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What ORM does this project use and why?", "conversationId": "session-1"}'

# 7. Continue the conversation
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are its advantages?", "conversationId": "session-1"}'
```

### Known RAG limitations

- **Indexing time** — embedding each chunk calls the Gemini API sequentially; indexing 100 articles may take 2–5 minutes on the free tier
- **Free tier embedding quota** — `text-embedding-004` shares the same 1 500 req/day limit as generation models
- **Vector dimensions** — fixed at 768 (output of `text-embedding-004`); changing the model requires dropping and recreating the Qdrant collection
- **In-memory conversation history** — RAG conversations reset on server restart; use `conversationId` to track sessions client-side
- **Chunk size tuning** — default 800/200 (size/overlap) works well for articles; very short articles may produce a single chunk
- **Regional availability** — same as Gemini API; EU restrictions apply to embedding calls as well
