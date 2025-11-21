#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { APIConsumerServer } from './server.js';
import { createRequest, executeRequest } from './tools/http-request.js';
import { OpenAPIImporter } from './tools/openapi-importer.js';

/**
 * Main entry point for the API Consumer MCP server
 */
async function main() {
  const apiConsumer = new APIConsumerServer();
  const openApiImporter = new OpenAPIImporter();

  const server = new Server(
    {
      name: apiConsumer.name,
      version: apiConsumer.version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = apiConsumer.listTools();
    return { tools };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'create_request': {
          const config = args as any;
          const requestConfig = createRequest(config);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(requestConfig, null, 2),
              },
            ],
          };
        }

        case 'execute_request': {
          const { request: requestConfig } = args as any;
          if (!requestConfig) {
            throw new Error('Missing required argument: request');
          }
          const response = await executeRequest(requestConfig);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }

        case 'import_openapi': {
          const { source, sourceType } = args as any;
          if (!source) {
            throw new Error('Missing required argument: source');
          }

          let spec;
          if (sourceType === 'url') {
            spec = await openApiImporter.importFromUrl(source);
          } else {
            spec = await openApiImporter.importFromFile(source);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(spec, null, 2),
              },
            ],
          };
        }

        case 'generate_test_suite':
        case 'execute_test_workflow':
        case 'validate_response':
        case 'create_mock_server':
        case 'analyze_performance': {
          return {
            content: [
              {
                type: 'text',
                text: `Tool '${name}' implementation pending. Arguments received: ${JSON.stringify(args, null, 2)}`,
              },
            ],
          };
        }

        default: {
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: '${name}'`,
              },
            ],
            isError: true,
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool '${name}': ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('API Consumer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
