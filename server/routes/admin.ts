import { RequestHandler } from "express";
import prisma from "../db";

// Dashboard Stats
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const activeListingsCount = await prisma.listing.count({ where: { status: "ACTIVE" } });
    const usersCount = await prisma.user.count();
    const transactionsCount = await prisma.transaction.count();
    
    const transactions = await prisma.transaction.findMany({
      where: { escrowStatus: { in: ["COMPLETED", "PAYMENT_CONFIRMED"] } },
      select: { amount: true }
    });
    const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);

    res.json({
      activeListings: activeListingsCount,
      totalUsers: usersCount,
      totalTransactions: transactionsCount,
      totalRevenue
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Users Management
export const getUsers: RequestHandler = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserStatus: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const { isVerifiedBadge } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { isVerifiedBadge }
    });
    res.json(user);
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// KYC Management
export const getKycQueue: RequestHandler = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { kycStatus: "PENDING" },
      orderBy: { kycSubmittedAt: "asc" }
    });
    res.json(users);
  } catch (error) {
    console.error("Get KYC queue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateKycStatus: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const { kycStatus } = req.body;
    
    const data: any = { kycStatus };
    if (kycStatus === "VERIFIED") {
      data.kycVerifiedAt = new Date();
      data.isVerifiedBadge = true;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data
    });
    res.json(user);
  } catch (error) {
    console.error("Update KYC status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Listings Moderation
export const getPendingListings: RequestHandler = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      include: {
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
    res.json(listings);
  } catch (error) {
    console.error("Get pending listings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateListingStatus: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // e.g., ACTIVE, SUSPENDED, REJECTED
    const listing = await prisma.listing.update({
      where: { id },
      data: { status }
    });
    res.json(listing);
  } catch (error) {
    console.error("Update listing status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reports Management
export const getReports: RequestHandler = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true }
        },
        listing: {
          select: { id: true, title: true, status: true }
        }
      }
    });
    res.json(reports);
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Orders / Transactions Management
export const getAllOrders: RequestHandler = async (req, res) => {
  try {
    const orders = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: { select: { id: true, title: true, category: true, askingPrice: true, mediaUrls: true, description: true } },
      },
    });
    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const { escrowStatus } = req.body as { escrowStatus: string };

    const validStatuses = ["PENDING", "PAYMENT_CONFIRMED", "ESCROW_HELD", "COMPLETED", "CANCELLED", "DISPUTED"];
    if (!validStatuses.includes(escrowStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const data: any = { escrowStatus };
    if (escrowStatus === "COMPLETED") {
      data.completedAt = new Date();
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: { select: { id: true, title: true, category: true, askingPrice: true, mediaUrls: true, description: true } },
      },
    });

    // Mark listing as SOLD when order completes
    if (escrowStatus === "COMPLETED") {
      await prisma.listing.update({
        where: { id: updated.listingId },
        data: { status: "SOLD", soldAt: new Date() },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const updateReportStatus: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const data: any = { status };
    if (status === "RESOLVED" || status === "REJECTED") {
      data.resolvedAt = new Date();
    }
    
    const report = await prisma.report.update({
      where: { id },
      data
    });
    res.json(report);
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
