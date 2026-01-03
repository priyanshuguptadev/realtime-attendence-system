import express from "express";
import { WebSocketServer } from "ws";

import * as wsHandlers from "./controllers/ws.controller.js";
import { connectToDB } from "./db.js";
import authRouter from "./routes/auth.route.js";
import classRouter from "./routes/class.route.js";
import studentRouter from "./routes/student.route.js";
import attendenceRouter from "./routes/attendence.route.js";
import type { NewWebSocket } from "./utils/types.js";

import "dotenv/config";

const app = express();

app.use(express.json());
connectToDB();

app.use("/auth", authRouter);
app.use("/class", classRouter);
app.use("/students", studentRouter);
app.use("/attendance", attendenceRouter);

app.get("/", (req, res) =>
  res.status(200).json({
    success: true,
    data: {
      message: "Server is running!",
    },
  })
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});
const server = app.listen(3000, () => console.log("Listening at port 3000!"));

const wss = new WebSocketServer({ server });

wss.on("connection", async (ws: NewWebSocket, req) => {
  try {
    const token = wsHandlers.getWsToken(ws, req);
    ws.user = wsHandlers.decodeToken(ws, token!)!;
    ws.on("message", async (msg) => {
      if (!ws.user) return ws.close();
      const jsonPayload = wsHandlers.parseJson(ws, msg);
      if (!jsonPayload) return ws.close();
      switch (ws.user.role) {
        case "teacher":
          switch (jsonPayload.event) {
            case "ATTENDANCE_MARKED":
              wsHandlers.handleAttendenceMarked(wss, ws, jsonPayload);
              break;
            case "TODAY_SUMMARY":
              wsHandlers.handleTodaySummary(ws, wss);
              break;
            case "DONE":
              wsHandlers.handleAttendenceComplete(ws, wss);
              break;
            case "MY_ATTENDANCE":
              ws.send(
                JSON.stringify({
                  event: "ERROR",
                  data: {
                    message: "Forbidden, student event only",
                  },
                })
              );
              break;
            default:
              ws.send(
                JSON.stringify({
                  event: "ERROR",
                  data: {
                    message: "Unknown event",
                  },
                })
              );
              break;
          }

          break;
        case "student":
          switch (jsonPayload.event) {
            case "MY_ATTENDANCE":
              wsHandlers.handleStudAttendence(ws, jsonPayload);
              break;
            default:
              ws.send(
                JSON.stringify({
                  event: "ERROR",
                  data: {
                    message: "Forbidden, teacher event only",
                  },
                })
              );
              break;
          }

          break;
        default:
          ws.send(
            JSON.stringify({
              event: "ERROR",
              data: {
                message: "Your need to be either student or teacher.",
              },
            })
          );
          break;
      }
    });
  } catch (error) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Something went wrong! Please try again.",
        },
      })
    );
    return ws.close();
  }
});
