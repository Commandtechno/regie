# @cu-classes/backend

Backend API server for the CU Boulder course scheduler. Serves course data from MongoDB Atlas with Atlas Search for fast text search, plus a RateMyProfessor proxy.

## Setup

1. **Install dependencies** from the monorepo root:
   ```bash
   yarn install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in your MongoDB Atlas credentials:
   ```bash
   cp .env.example .env
   ```

3. **Create the Atlas Search index** on your MongoDB collection. In the Atlas UI, go to **Search Indexes** and create an index named `default` with this definition:
   ```json
   {
     "mappings": {
       "dynamic": false,
       "fields": {
         "code": [
           { "type": "string", "analyzer": "lucene.standard" },
           { "type": "autocomplete", "tokenization": "edgeGram", "minGrams": 2, "maxGrams": 15 }
         ],
         "title": [
           { "type": "string", "analyzer": "lucene.standard" },
           { "type": "autocomplete", "tokenization": "edgeGram", "minGrams": 2, "maxGrams": 15 }
         ],
         "instr": [
           { "type": "string", "analyzer": "lucene.standard" }
         ],
         "schd": [
           { "type": "stringFacet" },
           { "type": "string" }
         ],
         "acad_career": [
           { "type": "stringFacet" },
           { "type": "string" }
         ],
         "stat": [
           { "type": "stringFacet" },
           { "type": "string" }
         ]
       }
     }
   }
   ```

4. **Run the dev server**:
   ```bash
   yarn workspace @cu-classes/backend dev
   ```

5. **Build for production**:
   ```bash
   yarn workspace @cu-classes/backend build
   yarn workspace @cu-classes/backend start
   ```

## API Endpoints

### `GET /health`

Health check.

```bash
curl http://localhost:3001/health
```

```json
{ "status": "ok", "courses": 9290 }
```

### `GET /api/courses`

Search, filter, and paginate courses.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Text search (code, title, instructor) via Atlas Search |
| `department` | string | Department code filter, e.g. `CSCI` |
| `level` | string | Course level: `1000`, `2000`, `3000`, `4000`, `5000` |
| `schd` | string | Schedule type: `LEC`, `LAB`, `REC`, etc. |
| `career` | string | Academic career: `UGRD`, `GRAD`, `LAW` |
| `status` | string | Status: `A` (available) or `F` (full) |
| `days` | string | Comma-separated day codes: `0,2` for Mon/Wed |
| `startAfter` | string | Min start time: `900` |
| `endBefore` | string | Max end time: `1700` |
| `page` | number | Page number (default 1) |
| `limit` | number | Per page (default 25, max 100) |

**Examples:**

```bash
# Search for "data structures"
curl "http://localhost:3001/api/courses?q=data+structures"

# CSCI department, undergraduate, lectures only
curl "http://localhost:3001/api/courses?department=CSCI&career=UGRD&schd=LEC"

# Monday/Wednesday classes starting after 9am
curl "http://localhost:3001/api/courses?days=0,2&startAfter=900"

# Page 2 with 50 results per page
curl "http://localhost:3001/api/courses?page=2&limit=50"
```

**Response:**

```json
{
  "results": [
    {
      "key": "1",
      "code": "CSCI 2270",
      "title": "Computer Science 2: Data Structures",
      "crn": "12345",
      "meetingTimes": [
        { "meet_day": "0", "start_time": "800", "end_time": "915" },
        { "meet_day": "2", "start_time": "800", "end_time": "915" }
      ],
      "department": "CSCI",
      "courseNumber": "2270",
      "credits": "4",
      "..."
    }
  ],
  "total": 9290,
  "page": 1,
  "limit": 25,
  "totalPages": 372
}
```

### `GET /api/courses/:crn`

Get a single course by CRN.

```bash
curl http://localhost:3001/api/courses/21695
```

Returns the full parsed course object, or `404` if not found.

### `GET /api/departments`

List all departments with course counts.

```bash
curl http://localhost:3001/api/departments
```

```json
{
  "departments": [
    { "code": "ACCT", "count": 24 },
    { "code": "AERO", "count": 45 },
    { "code": "CSCI", "count": 120 }
  ]
}
```

### `GET /api/professors/rating`

Proxy to RateMyProfessors. Results are cached in-memory for 10 minutes.

```bash
curl "http://localhost:3001/api/professors/rating?name=J.+Contreras"
```

```json
{
  "firstName": "Juan",
  "lastName": "Contreras",
  "avgRating": 4.2,
  "avgDifficulty": 3.1,
  "numRatings": 15,
  "wouldTakeAgainPercent": 85,
  "department": "Accounting",
  "link": "https://www.ratemyprofessors.com/professor/12345"
}
```

Returns `404` with `null` body if the professor is not found.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | — |
| `MONGODB_DB` | Database name | `classes` |
| `MONGODB_COLLECTION` | Collection name | `courses` |
| `PORT` | Server port | `3001` |
