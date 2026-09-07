import { RequestHandler } from "express";
import prisma from "../db";

export const investInEquity: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const { listingId, amount, equityPercentage } = req.body;
    if (!listingId || !amount) {
      return res.status(400).json({ error: "listingId and amount are required" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.status !== "ACTIVE") return res.status(400).json({ error: "Listing not available" });
    if (listing.sellerId === req.user.userId) return res.status(400).json({ error: "Cannot invest in your own startup" });

    // Create an investment transaction. We store the equity percentage in the paymentRef 
    // as a quick workaround without changing the Prisma schema.
    const transaction = await prisma.transaction.create({
      data: {
        listingId,
        buyerId: req.user.userId,
        sellerId: listing.sellerId,
        amount: parseFloat(amount),
        escrowStatus: "PENDING",
        paymentRef: equityPercentage ? `EQUITY_INVESTMENT_${equityPercentage}%` : "EQUITY_INVESTMENT"
      },
    });

    res.status(201).json({ 
      message: "Investment transaction initiated", 
      transaction 
    });
  } catch (error) {
    console.error("Investment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
