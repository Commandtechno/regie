# @cu-classes/mcp

MCP (Model Context Protocol) server for the CU Boulder course scheduler. Exposes tools for AI assistants to search courses, get course details, list departments, and look up professor ratings.

## Setup

```bash
# Install dependencies
yarn install

# Build
yarn workspace @cu-classes/mcp build

# Run with tsx (development)
yarn workspace @cu-classes/mcp dev

# Run compiled (production)
yarn workspace @cu-classes/mcp start
```

## Environment Variables

| Variable      | Description                      | Default                  |
|---------------|----------------------------------|--------------------------|
| `BACKEND_URL` | URL of the running backend API   | `http://localhost:3001`  |

The backend (`@cu-classes/backend`) must be running for the MCP server to work.

## Available Tools

### `search_courses`

Search and filter the CU Boulder course catalog. Returns paginated results.

```json
{
  "query": "data structures",
  "department": "CSCI",
  "level": "2000",
  "career": "UGRD",
  "status": "A",
  "limit": 10
}
```

Parameters: `query`, `department`, `level`, `schedule_type`, `career` (UGRD/GRAD/LAW), `status` (A/F), `days`, `start_after`, `end_before`, `page`, `limit`.

### `get_course`

Get full details for a specific course section by CRN.

```json
{
  "crn": "12345"
}
```

### `get_professor_rating`

Look up a professor's RateMyProfessors rating at CU Boulder.

```json
{
  "name": "John Smith"
}
```

### `list_departments`

List all academic departments with their course counts. No parameters required.

```json
{}
```

## Claude Desktop Configuration

Add the following to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "cu-boulder-courses": {
      "command": "node",
      "args": ["path/to/packages/mcp/dist/index.js"],
      "env": {
        "BACKEND_URL": "http://localhost:3001"
      }
    }
  }
}
```

Replace `path/to/packages/mcp/dist/index.js` with the absolute path to the compiled entry point.
