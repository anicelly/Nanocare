import { WebSocketServer } from "ws";

const port = Number(process.env.PORT ?? 8092);
const server = new WebSocketServer({ port });

server.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "connected", service: "nanocare-websocket-service" }));

  const interval = setInterval(() => {
    socket.send(
      JSON.stringify({
        type: "hospital:update",
        timestamp: new Date().toISOString(),
        sector: "UTI",
        status: Math.random() > 0.55 ? "critical" : "warning",
        ambulanceProgress: Math.round(Math.random() * 100),
      }),
    );
  }, 2500);

  socket.on("close", () => clearInterval(interval));
});

console.log(`NanoCare websocket service online at ws://localhost:${port}`);
