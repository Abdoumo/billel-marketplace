import { RequestHandler } from "express";
import prisma from "../db";

/**
 * Get all notaries with optional filtering
 */
export const getNotaries: RequestHandler = async (req, res) => {
  try {
    const where: any = {};

    // Filter by wilaya
    if (req.query.wilaya && typeof req.query.wilaya === "string") {
      where.wilaya = {
        contains: req.query.wilaya,
        mode: "insensitive",
      };
    }

    // Filter by specialization
    if (req.query.specialization && typeof req.query.specialization === "string") {
      where.specialization = {
        contains: req.query.specialization,
        mode: "insensitive",
      };
    }

    const notaries = await prisma.notaryProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isVerifiedBadge: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    res.json(notaries);
  } catch (error) {
    console.error("Get notaries error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all lawyers with optional filtering
 */
export const getLawyers: RequestHandler = async (req, res) => {
  try {
    const where: any = {};

    // Filter by wilaya
    if (req.query.wilaya && typeof req.query.wilaya === "string") {
      where.wilaya = {
        contains: req.query.wilaya,
        mode: "insensitive",
      };
    }

    // Filter by specialization
    if (req.query.specialization && typeof req.query.specialization === "string") {
      where.specialization = {
        contains: req.query.specialization,
        mode: "insensitive",
      };
    }

    const lawyers = await prisma.lawyerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isVerifiedBadge: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    res.json(lawyers);
  } catch (error) {
    console.error("Get lawyers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
