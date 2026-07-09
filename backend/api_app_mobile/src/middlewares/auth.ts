import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: number;
}

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const parts = header.split(" ");

    if (parts.length !== 2) {
      return res.status(401).json({
        error: "Header mal formatado",
      });
    }

    const [scheme, token] = parts;

    if (scheme !== "Bearer") {
      return res.status(401).json({
        error: "Token mal formatado",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || !token) {
      throw new Error("JWT_SECRET não definido");
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido",
    });
  }
}
