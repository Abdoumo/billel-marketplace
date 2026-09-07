import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JWTPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to verify JWT access token
 */
export function jwtMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7);
}

/**
 * Optional JWT middleware - doesn't fail if token is missing
 */
export function optionalJwtMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = extractToken(req);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Require user to be authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions", required: roles });
    }

    next();
  };
}

/**
 * Require specific permission from the permission matrix
 */
export function requirePermission(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { hasPermission } = require("../lib/permissions");

    if (!hasPermission(req.user.role, action)) {
      return res.status(403).json({
        error: "You don't have permission to perform this action",
        action,
        userRole: req.user.role,
      });
    }

    next();
  };
}
