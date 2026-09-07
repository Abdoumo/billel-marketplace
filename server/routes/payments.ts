import { RequestHandler } from "express";
import Stripe from "stripe";
import prisma from "../db";
import PDFDocument from "pdfkit";

// Use a mock key if STRIPE_SECRET_KEY is not defined
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-01-27.acacia",
});

/**
 * Create a Stripe checkout session for a transaction
 */
export const createCheckoutSession: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: "transactionId is required" });

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { listing: true },
    });

    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.buyerId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (transaction.escrowStatus !== "PENDING") {
      return res.status(400).json({ error: "Transaction is not pending payment" });
    }

    // Since we are mocking the local gateway (EDAHABIA/CIB), we use Stripe as substitute
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "dzd", // Algerian Dinar
            product_data: {
              name: transaction.listing.title,
              description: transaction.listing.category,
            },
            unit_amount: Math.round(transaction.amount * 100), // Stripe takes cents/smallest unit
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:8080"}/dashboard/transactions?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:8080"}/dashboard/transactions?canceled=true`,
      metadata: {
        transactionId: transaction.id,
      },
    });

    // We can simulate webhook here for the mock environment
    if (!process.env.STRIPE_SECRET_KEY) {
      // Auto-confirm payment if mock
      setTimeout(async () => {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { escrowStatus: "ESCROW_HELD", paymentRef: "mock_pi_" + Date.now() },
        });
      }, 2000);
    }

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Escrow: Buyer confirms receipt, releasing funds to Seller
 */
export const confirmTransfer: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const { transactionId } = req.body;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.buyerId !== req.user.userId) {
      return res.status(403).json({ error: "Only the buyer can release escrow funds" });
    }
    if (transaction.escrowStatus !== "ESCROW_HELD") {
      return res.status(400).json({ error: "Funds are not in escrow" });
    }

    // Release funds (In a real system, you'd trigger a transfer to the seller's bank)
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        escrowStatus: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Mark listing as SOLD
    await prisma.listing.update({
      where: { id: transaction.listingId },
      data: { status: "SOLD", soldAt: new Date() },
    });

    res.json({ message: "Escrow funds released to seller", transaction: updated });
  } catch (error) {
    console.error("Confirm transfer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Generate PDF Invoice
 */
export const downloadInvoice: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const transactionId = req.params.transactionId;
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    });

    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.buyerId !== req.user.userId && transaction.sellerId !== req.user.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to view this invoice" });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${transactionId}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    
    // Details
    doc.fontSize(12).text(`Transaction ID: ${transaction.id}`);
    doc.text(`Date: ${transaction.createdAt.toLocaleDateString()}`);
    doc.text(`Status: ${transaction.escrowStatus}`);
    doc.text(`Payment Reference: ${transaction.paymentRef || "N/A"}`);
    doc.moveDown();
    
    // Parties
    doc.text(`Seller: ${transaction.seller.firstName} ${transaction.seller.lastName} (${transaction.seller.email})`);
    doc.text(`Buyer: ${transaction.buyer.firstName} ${transaction.buyer.lastName} (${transaction.buyer.email})`);
    doc.moveDown();
    
    // Item
    doc.text("Description", { underline: true });
    doc.text(`Asset: ${transaction.listing.title}`);
    doc.text(`Category: ${transaction.listing.category}`);
    doc.moveDown();
    
    // Total
    doc.fontSize(14).text(`Total Amount: ${transaction.amount.toLocaleString()} DA`, { align: "right" });
    
    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
