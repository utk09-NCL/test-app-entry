import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { createHandler } from "graphql-http/lib/use/express";

const app = express();
const httpServer = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Create GraphQL schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// HTTP GraphQL endpoint (queries & mutations)
app.use(
  "/graphql",
  createHandler({
    schema,
  })
);

// Lightweight GraphiQL HTML (manual) served at /graphiql
app.get("/graphiql", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "graphiql.html"));
});

// WebSocket server for subscriptions (same /graphql path shared for WS upgrades)
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });

useServer(
  {
    schema,
    onConnect: () => console.log("[WebSocket] Client connected"),
    onDisconnect: () => console.log("[WebSocket] Client disconnected"),
  },
  wsServer
);

const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 GraphQL HTTP ready at http://localhost:${PORT}/graphql`);
  console.log(`🧪 GraphiQL IDE at     http://localhost:${PORT}/graphiql`);
  console.log(`🔌 Subscriptions WS at ws://localhost:${PORT}/graphql`);
});
