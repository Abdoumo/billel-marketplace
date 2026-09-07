import { RequestHandler } from "express";
import prisma from "../db";

// ── Favorites ─────────────────────────────────────────────────────────────────

/** Toggle favorite (add if not exists, remove if exists) */
export const toggleFavorite: RequestHandler = async (req, res) => {
  try {
    // Permission check handled by middleware, but validate anyway
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "listingId is required" });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: req.user.userId, listingId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false, message: "Removed from favorites" });
    }

    const favorite = await prisma.favorite.create({
      data: { userId: req.user.userId, listingId },
    });
    return res.status(201).json({ favorited: true, favorite });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Get current user's favorites */
export const getMyFavorites: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.userId },
      include: {
        listing: {
          include: {
            seller: { select: { id: true, firstName: true, lastName: true, isVerifiedBadge: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ favorites, count: favorites.length });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Check if a listing is favorited by the current user */
export const checkFavorite: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.json({ favorited: false });

    const listingId = req.params.listingId as string;
    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: req.user.userId, listingId } },
    });
    res.json({ favorited: !!existing });
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Questions ─────────────────────────────────────────────────────────────────

/** Post a question on a listing */
export const postQuestion: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const listingId = req.params.listingId as string;
    const { questionText } = req.body;

    if (!questionText?.trim()) {
      return res.status(400).json({ error: "Question text is required" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const question = await prisma.question.create({
      data: {
        listingId,
        userId: req.user.userId,
        questionText: questionText.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    res.status(201).json({ question });
  } catch (error) {
    console.error("Post question error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Get all questions for a listing */
export const getListingQuestions: RequestHandler = async (req, res) => {
  try {
    const listingId = req.params.listingId as string;

    const questions = await prisma.question.findMany({
      where: { listingId, isPublic: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ questions, count: questions.length });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Answer a question (seller only) */
export const answerQuestion: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const questionId = req.params.questionId as string;
    const { answerText } = req.body;

    if (!answerText?.trim()) {
      return res.status(400).json({ error: "Answer text is required" });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { listing: true },
    });

    if (!question) return res.status(404).json({ error: "Question not found" });

    // Only the listing seller can answer
    if (question.listing.sellerId !== req.user.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only the seller can answer this question" });
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { answerText: answerText.trim(), answeredAt: new Date() },
    });

    res.json({ question: updated });
  } catch (error) {
    console.error("Answer question error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Reports ───────────────────────────────────────────────────────────────────

/** Submit a report on a listing */
export const submitReport: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const listingId = req.params.listingId as string;
    const { reason, description } = req.body;

    const validReasons = ["SPAM", "FRAUD", "INAPPROPRIATE_CONTENT", "FAKE_LISTING", "COPYRIGHT_ISSUE", "OTHER"];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid report reason" });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Prevent seller from reporting their own listing
    if (listing.sellerId === req.user.userId) {
      return res.status(400).json({ error: "You cannot report your own listing" });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.userId,
        listingId,
        reason,
        description: description?.trim(),
      },
    });

    res.status(201).json({ report, message: "Report submitted successfully" });
  } catch (error) {
    console.error("Submit report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Transactions ──────────────────────────────────────────────────────────────

/** Get current user's transactions (as buyer or seller) */
export const getMyTransactions: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const [buyerTxs, sellerTxs] = await Promise.all([
      prisma.transaction.findMany({
        where: { buyerId: req.user.userId },
        include: {
          listing: { select: { id: true, title: true, category: true, mediaUrls: true } },
          seller: { select: { id: true, firstName: true, lastName: true, isVerifiedBadge: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.findMany({
        where: { sellerId: req.user.userId },
        include: {
          listing: { select: { id: true, title: true, category: true, mediaUrls: true } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({ asBuyer: buyerTxs, asSeller: sellerTxs });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Initiate a transaction (buyer intent to purchase) */
export const initiateTransaction: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "listingId is required" });

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { id: true } } },
    });

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.status !== "ACTIVE") return res.status(400).json({ error: "Listing is not available" });
    if (listing.sellerId === req.user.userId) return res.status(400).json({ error: "You cannot buy your own listing" });

    // Check no pending transaction already exists
    const existing = await prisma.transaction.findFirst({
      where: { listingId, buyerId: req.user.userId, escrowStatus: { in: ["PENDING", "ESCROW_HELD"] } },
    });
    if (existing) return res.status(400).json({ error: "Transaction already in progress" });

    const transaction = await prisma.transaction.create({
      data: {
        listingId,
        buyerId: req.user.userId,
        sellerId: listing.sellerId,
        amount: listing.askingPrice,
        escrowStatus: "PENDING",
      },
    });

    res.status(201).json({ transaction, message: "Transaction initiated" });
  } catch (error) {
    console.error("Initiate transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
