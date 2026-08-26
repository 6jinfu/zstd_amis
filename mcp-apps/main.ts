import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import type { Request, Response } from "express";
import { createServer } from "./server.js";

async function startStdio(): Promise<void> {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
}

async function startHttp(): Promise<void> {
  const port = Number.parseInt(process.env.PORT || "3001", 10);
  const host = process.env.MCP_HOST || "127.0.0.1";
  const app = createMcpExpressApp({ host });
  app.use(cors());
  app.all("/mcp", async (req: Request, res: Response) => {
    const server = await createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
    }
  });
  const httpServer = app.listen(port, host, () => console.log(`MCP Apps server: http://${host}:${port}/mcp`));
  httpServer.ref();
  const keepAlive = setInterval(() => undefined, 60_000);
  await new Promise<void>((resolve) => {
    const shutdown = () => {
      clearInterval(keepAlive);
      httpServer.close(() => resolve());
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}

if (process.argv.includes("--stdio")) {
  await startStdio();
} else {
  await startHttp();
}
