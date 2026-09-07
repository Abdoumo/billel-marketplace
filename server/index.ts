import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { setupSwagger } from "./swagger";
import { uploadS3 } from "./uploads";
import { handleDemo } from "./routes/demo";
import { uploadFiles } from "./routes/uploads";
import { register, login, refresh, logout, me } from "./routes/auth";
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getUserListings,
} from "./routes/listings";
import {
  updateProfile,
  getProfile,
  getSellerStats,
  updateUserRole,
  getSellerReviews,
  getSellers,
  addReview,
  submitKyc,
} from "./routes/users";
import {
  requestEvaluation,
  getEvaluationQuote,
  submitEvaluationResult,
  getListingEvaluations,
  getEvaluatorPendingWork,
  markEvaluationAsPaid,
} from "./routes/evaluations";
import { getNotaries, getLawyers } from "./routes/legal";
import {
  toggleFavorite,
  getMyFavorites,
  checkFavorite,
  postQuestion,
  getListingQuestions,
  answerQuestion,
  submitReport,
  getMyTransactions,
  initiateTransaction,
} from "./routes/community";
import {
  createCheckoutSession,
  confirmTransfer,
  downloadInvoice
} from "./routes/payments";
import { estimateValuation } from "./routes/ai";
import { investInEquity } from "./routes/investment";
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getKycQueue,
  updateKycStatus,
  getPendingListings,
  updateListingStatus,
  getReports,
  updateReportStatus,
  getAllOrders,
  updateOrderStatus,
} from "./routes/admin";
import { jwtMiddleware, optionalJwtMiddleware, requireAuth, requireRole } from "./middleware/auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite's inline scripts and external assets
  }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Rate Limiting (Redis with Memory Fallback)
  let limiter;
  if (process.env.NODE_ENV !== "test") {
    try {
      const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Do not retry if local redis is down
        enableOfflineQueue: false // Prevent commands from hanging indefinitely if Redis is not running
      });
      
      redisClient.on('error', (err) => {
        console.warn("Redis rate-limiter error/offline, using default limits.");
      });

      limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per window
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true,
        store: new RedisStore({
          // @ts-expect-error - ioredis types mismatch with RedisStore
          sendCommand: (...args: string[]) => redisClient.call(...args),
        }),
      });
    } catch (err) {
      limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
    }
  } else {
    limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  }
  
  app.use("/api", limiter);
  
  // Swagger Documentation
  setupSwagger(app);

  // Apply optional JWT middleware to all routes (for authenticated features)
  app.use(optionalJwtMiddleware);

  // ============================================================================
  // Health & Demo Routes
  // ============================================================================
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ============================================================================
  // Authentication Routes
  // ============================================================================
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/refresh", refresh);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", jwtMiddleware, me);

  // ============================================================================
  // Listings Routes
  // ============================================================================
  app.get("/api/listings", getListings);
  app.get("/api/listings/:id", getListing);
  app.post("/api/listings", requireAuth, createListing);
  app.put("/api/listings/:id", requireAuth, updateListing);
  app.delete("/api/listings/:id", requireAuth, deleteListing);
  app.get("/api/users/listings/my-listings", requireAuth, getUserListings);

  // ============================================================================
  // Uploads Routes
  // ============================================================================
  app.post("/api/uploads", requireAuth, uploadS3.array("files", 10), uploadFiles);

  // ============================================================================
  // Users Routes
  // ============================================================================
  app.put("/api/users/profile", requireAuth, updateProfile);
  app.get("/api/users/:id", getProfile);
  app.get("/api/users/:id/stats", getSellerStats);
  app.get("/api/users/:id/reviews", getSellerReviews);
  app.get("/api/sellers", getSellers);
  app.post("/api/users/reviews", requireAuth, addReview);
  app.put("/api/users/:userId/role", requireAuth, updateUserRole);
  app.post("/api/users/kyc", requireAuth, uploadS3.array("documents", 5), submitKyc);

  // ============================================================================
  // Evaluations Routes
  // ============================================================================
  app.post("/api/evaluations/request", requireAuth, requestEvaluation);
  app.get("/api/evaluations/:evaluationId/quote", getEvaluationQuote);
  app.post("/api/evaluations/:evaluationId/submit", requireAuth, submitEvaluationResult);
  app.post("/api/evaluations/:evaluationId/mark-paid", requireAuth, markEvaluationAsPaid);
  app.get("/api/listings/:listingId/evaluations", getListingEvaluations);
  app.get("/api/evaluations/my-work", requireAuth, getEvaluatorPendingWork);

  // ============================================================================
  // Legal Services Routes
  // ============================================================================
  app.get("/api/legal/notaries", getNotaries);
  app.get("/api/legal/lawyers", getLawyers);

  // ============================================================================
  // Community Features Routes
  // ============================================================================
  // Favorites
  app.post("/api/favorites/toggle", requireAuth, toggleFavorite);
  app.get("/api/favorites", requireAuth, getMyFavorites);
  app.get("/api/listings/:listingId/favorite", checkFavorite);

  // Questions
  app.post("/api/listings/:listingId/questions", requireAuth, postQuestion);
  app.get("/api/listings/:listingId/questions", getListingQuestions);
  app.put("/api/questions/:questionId/answer", requireAuth, answerQuestion);

  // Reports
  app.post("/api/listings/:listingId/reports", requireAuth, submitReport);

  // Transactions & Payments
  app.get("/api/transactions", requireAuth, getMyTransactions);
  app.post("/api/transactions/initiate", requireAuth, initiateTransaction);
  app.post("/api/payments/create-checkout-session", requireAuth, createCheckoutSession);
  app.post("/api/payments/confirm-transfer", requireAuth, confirmTransfer);
  app.get("/api/payments/invoice/:transactionId", requireAuth, downloadInvoice);

  // AI Estimation
  app.post("/api/ai/estimate", requireAuth, estimateValuation);

  // Investments
  app.post("/api/investments/invest", requireAuth, investInEquity);

  // ============================================================================
  // Admin Routes
  // ============================================================================
  const requireAdmin = requireRole("ADMIN");
  
  app.get("/api/admin/stats", requireAuth, requireAdmin, getDashboardStats);
  
  app.get("/api/admin/users", requireAuth, requireAdmin, getUsers);
  app.put("/api/admin/users/:id/status", requireAuth, requireAdmin, updateUserStatus);
  
  app.get("/api/admin/kyc", requireAuth, requireAdmin, getKycQueue);
  app.put("/api/admin/kyc/:id/status", requireAuth, requireAdmin, updateKycStatus);
  
  app.get("/api/admin/listings/pending", requireAuth, requireAdmin, getPendingListings);
  app.put("/api/admin/listings/:id/status", requireAuth, requireAdmin, updateListingStatus);
  
  app.get("/api/admin/reports", requireAuth, requireAdmin, getReports);
  app.put("/api/admin/reports/:id/status", requireAuth, requireAdmin, updateReportStatus);

  app.get("/api/admin/orders", requireAuth, requireAdmin, getAllOrders);
  app.put("/api/admin/orders/:id/status", requireAuth, requireAdmin, updateOrderStatus);

  return app;
}
