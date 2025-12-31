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
  startedAt: string;
  attendence: Record<string, "Present" | "Absent">;
}

export const activeSession: Partial<Session> = {};

export const getWsToken = (ws: WebSocket, req: any) => {
  const url = new URL(req.url, "ws://localhost");
  const token = url.searchParams.get("token");
  if (!token) {
    ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message: "Token not found in the query param.",
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
          message: "Token is not correct!",
        },
      })
    );
    ws.close();
  }
};

export const handleAttendenceMarked = (
  wss: WebSocketServer,
  ws: WebSocket,
  payload: any
) => {
  if (Object.keys(activeSession).length === 0 || !activeSession.attendence) {
    return ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message:
            "No active session found! Please start the attendence first.",
        },
      })
    );
  }
  const { studentId, status } = payload.data;
  activeSession.attendence[studentId] = status;
  wss.clients.forEach(
    (client) =>
      client.readyState === WebSocket.OPEN &&
      client.send(JSON.stringify(payload))
  );
};

export const handleTodaySummary = async (
  ws: WebSocket,
  wss: WebSocketServer
) => {
  try {
    if (Object.keys(activeSession).length === 0 || !activeSession.attendence) {
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message:
              "No active session found! Please start the attendence first.",
          },
        })
      );
    }
    const vals = Object.values(activeSession.attendence);

    const dbClass = await Class.findById(activeSession.classId);
    if (!dbClass) {
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: "No class for active session found in database.",
          },
        })
      );
    }
    const totalStuds = dbClass.studentIds.length;
    const presentStuds = vals.map((val) => val === "Present").length;
    const delivery = {
      event: "TODAY_SUMMARY",
      data: {
        present: presentStuds,
        absent: totalStuds - presentStuds,
        total: totalStuds,
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

export const handleStudAttendence = (ws: NewWebSocket, payload: any) => {
  if (Object.keys(activeSession).length === 0 || !activeSession.attendence) {
    return ws.send(
      JSON.stringify({
        event: "ERROR",
        data: {
          message:
            "No active session found! Let your teacher start attendence.",
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
  ws: WebSocket,
  wss: WebSocketServer
) => {
  try {
    if (Object.keys(activeSession).length === 0 || !activeSession.attendence) {
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message:
              "No active session found! Please start the attendence first.",
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
            message: "No class for active session found in database.",
          },
        })
      );
    }
    const studIds = dbClass.studentIds;
    if (studIds.length === 0) {
      return ws.send(
        JSON.stringify({
          event: "ERROR",
          data: {
            message: "There are no students in this class.",
          },
        })
      );
    }
    if (!activeSession.attendence) {
      activeSession.attendence = {};
    }

    for (const sid of studIds) {
      const key = sid.toString();
      activeSession.attendence[key] ??= "Absent";
    }

    const keys = Object.keys(activeSession.attendence);
    const classObjId = new Types.ObjectId(activeSession.classId);
    for (const key of keys) {
      const keyId = key.toString();
      await Attendence.create({
        classId: classObjId,
        studentId: key,
        status: activeSession.attendence[keyId]!,
      });
    }
    const presentStuds = await Attendence.find({
      classId: classObjId,
      status: "Present",
    });
    const absentStuds = await Attendence.find({
      classId: classObjId,
      status: "Absent",
    });
    const delivery = {
      event: "DONE",
      data: {
        message: "Attendance persisted",
        present: presentStuds.length,
        absent: absentStuds.length,
        total: presentStuds.length + absentStuds.length,
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
