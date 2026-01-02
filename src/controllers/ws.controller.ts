import WebSocket from "ws";
import jwt from "jsonwebtoken";
import type { WebSocketServer } from "ws";
import { Class } from "../models/class.model.js";
import { Attendence } from "../models/attendence.model.js";
import { Types } from "mongoose";
import type { NewWebSocket } from "../utils/types.js";
interface JwtPayload {
  id: string;
  role: string;
}

interface Session {
  classId: string;
  teacherId: string;
  startedAt: string;
  attendence: Record<string, "Present" | "Absent">;
}

export let activeSession: Partial<Session> = {};

export const getWsToken = (ws: WebSocket, req: any) => {
  const url = new URL(req.url, "ws://localhost");
  const token = url.searchParams.get("token");
  if (!token) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Unauthorized or invalid token",
        },
      })
    );
    ws.close();
    return null;
  }
  return token;
};

export const decodeToken = (ws: WebSocket, token: string) => {
  try {
    const { id, role } = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as JwtPayload;
    return { userId: id, role };
  } catch (error) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Unauthorized or invalid token",
        },
      })
    );
    ws.close();
  }
};

export const handleAttendenceMarked = (
  wss: WebSocketServer,
  ws: NewWebSocket,
  payload: any
) => {
  if (ws.user?.userId !== activeSession.teacherId) {
    activeSession = {};
    return ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "No active attendance session",
        },
      })
    );
  }
  const { studentId, status } = payload.data;
  activeSession.attendence![studentId] = status;
  wss.clients.forEach(
    (client) =>
      client.readyState === WebSocket.OPEN &&
      client.send(JSON.stringify(payload))
  );
};

export const handleTodaySummary = async (
  ws: NewWebSocket,
  wss: WebSocketServer
) => {
  try {
    if (ws.user?.userId !== activeSession.teacherId) {
      activeSession = {};
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: "No active attendance session",
          },
        })
      );
    }
    const vals = Object.values(activeSession.attendence || {});
    const present = vals.filter((s) => s === "Present").length;
    const absent = vals.filter((s) => s === "Absent").length;
    const total = vals.length;

    const delivery = {
      event: "TODAY_SUMMARY",
      data: {
        present,
        absent,
        total,
      },
    };
    wss.clients.forEach((client) => client.send(JSON.stringify(delivery)));
  } catch (error) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Something went wrong! Please try again.",
        },
      })
    );
    ws.close();
  }
};

export const handleStudAttendence = async (ws: NewWebSocket, payload: any) => {
  if (Object.keys(activeSession).length === 0 || !activeSession.attendence) {
    return ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "No active attendance session",
        },
      })
    );
  }
  if (!ws.user) {
    return ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Unauthenticated Request!",
        },
      })
    );
  }
  const classDoc = await Class.findById(activeSession.classId);
  if (
    !classDoc ||
    !classDoc.studentIds.some((val) => val.toString() === ws.user?.userId)
  ) {
    return ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "No active attendance session",
        },
      })
    );
  }
  const status = activeSession.attendence[ws.user.userId];
  if (!status) {
    return ws.send(
      JSON.stringify({
        event: "MY_ATTENDANCE",
        data: {
          status: "not yet updated",
        },
      })
    );
  }
  ws.send(
    JSON.stringify({
      event: "MY_ATTENDANCE",
      data: {
        status: status,
      },
    })
  );
};

export const handleAttendenceComplete = async (
  ws: NewWebSocket,
  wss: WebSocketServer
) => {
  try {
    if (ws.user?.userId !== activeSession.teacherId) {
      activeSession = {};
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: "No active attendance session",
          },
        })
      );
    }

    const dbClass = await Class.findById(activeSession.classId);
    if (!dbClass) {
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: "Class not found",
          },
        })
      );
    }
    dbClass.studentIds.forEach((student) => {
      const studId = student.toString();
      if (!activeSession.attendence![studId]) {
        activeSession.attendence![studId] = "Absent";
      }
    });
    const records = Object.entries(activeSession.attendence!).map(
      ([studentId, status]) => ({
        classId: new Types.ObjectId(activeSession.classId),
        studentId,
        status,
      })
    );
    await Attendence.insertMany(records);
    const vals = Object.values(activeSession.attendence!);
    const present = vals.filter((s) => s === "Present").length;
    const absent = vals.filter((s) => s === "Absent").length;
    const total = vals.length;

    activeSession = {};

    const delivery = {
      event: "DONE",
      data: {
        message: "Attendance persisted",
        present,
        absent,
        total,
      },
    };
    wss.clients.forEach((client) => client.send(JSON.stringify(delivery)));
  } catch (error) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Something went wrong! Please try again.",
        },
      })
    );
    ws.close();
  }
};
export const parseJson = (ws: WebSocket, msg: any) => {
  try {
    const parsed = JSON.parse(msg.toString());
    return parsed;
  } catch (error) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Invalid message format",
        },
      })
    );
    ws.close();
  }
};
