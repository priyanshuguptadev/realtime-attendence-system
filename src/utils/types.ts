import type { Request } from "express";
import type { WebSocket } from "ws";

export interface NewRequest extends Request {
  userId?: string;
  role?: string;
}

export interface NewWebSocket extends WebSocket {
  user?: {
    userId: string;
    role: string;
  };
}
