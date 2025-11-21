# API Consumer MCP Server

> A comprehensive MCP server for consuming, testing, and documenting REST APIs with full TDD workflow support

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Tests](https://img.shields.io/badge/Tests-89%20Passing-brightgreen.svg)]()

## Overview

API Consumer is a Model Context Protocol (MCP) server built from the ground up using Test-Driven Development. It provides comprehensive tools for API consumption, testing, and documentation with built-in support for OpenAPI specifications.

**This project demonstrates the complete MCP tool ecosystem in action:**

- AI-assisted architecture via `mcp-consult` ✅
- TDD methodology via `mcp-tdd` (with friction docs) ⚠️
- Workflow orchestration via `mcp-orchestra` ✅
- Problem-solving via `mcp-sequential-thinking` ✅

### 🎯 Features

- ✅ **HTTP Request Builder** (5 tests passing)
- ✅ **OpenAPI 3.x Importer** (11 tests passing)
- ✅ **89 Total Tests Passing**
- 🚧 Test Orchestration (planned)
- 🚧 Mock Server (planned)
- 🚧 Performance Testing (planned)

## Quick Start

```bash
npm install && npm run build && npm test
```

### MCP Configuration

```json
{
  "mcpServers": {
    "api-consumer": {
      "command": "node",
      "args": ["/path/to/mcp-api-consumer/dist/index.js"]
    }
  }
}
```

## Tools

### ✅ create_request

Create HTTP request configurations.

### ✅ execute_request

Execute HTTP requests and return responses.

### ✅ import_openapi

Import OpenAPI 3.x specs (JSON/YAML) from files or URLs.

## Tool Friction Documentation

See [TOOL_FRICTION.md](./TOOL_FRICTION.md) for complete friction analysis.

**Key Finding**: `mcp-tdd` tool has state management issues - use hybrid approach with direct terminal commands.

## Testing

```bash
npm test              # Run all tests (89 passing)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## License

MIT
