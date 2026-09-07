import { RequestHandler } from "express";
import prisma from "../db";
import { ZodError } from "zod";
import { z } from "zod";

/**
 * Update user profile
 */
export const updateProfile: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { firstName, lastName, phone, bio, avatar } = req.body;

    // Validate optional fields
    const updateSchema = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      bio: z.string().max(500).optional(),
      avatar: z.string().url().optional(),
    });

    const data = updateSchema.parse({
      firstName,
      lastName,
      phone,
      bio,
      avatar,
    });

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        avatar: true,
        role: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get user profile by ID
 */
export const getProfile: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        isVerifiedBadge: true,
        sellerScore: true,
        totalTransactions: true,
        successfulDeals: true,
        createdAt: true,
        // Get their listings count
        listings: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { listings, ...profileData } = user;

    res.json({
      ...profileData,
      activeListingsCount: listings.length,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get seller statistics
 */
export const getSellerStats: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const seller = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        sellerScore: true,
        totalTransactions: true,
        successfulDeals: true,
        listings: {
          select: { id: true, status: true, viewCount: true },
        },
        evaluatorReviews: {
          select: { rating: true },
        },
      },
    });

    if (!seller) {
      return res.status(404).json({ error: "User not found" });
    }

    const { listings, evaluatorReviews, ...stats } = seller;

    // Calculate statistics
    const activeListings = listings.filter((l) => l.status === "ACTIVE").length;
    const totalViews = listings.reduce((sum, l) => sum + l.viewCount, 0);
    const averageRating =
      evaluatorReviews.length > 0
        ? evaluatorReviews.reduce((sum, r) => sum + r.rating, 0) /
          evaluatorReviews.length
        : 0;

    res.json({
      ...stats,
      activeListings,
      totalViews,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: evaluatorReviews.length,
    });
  } catch (error) {
    console.error("Get seller stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if admin
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can update user roles" });
    }

    const { userId, role } = req.body;

    // Validate role
    const validRoles = [
      "VISITOR",
      "SELLER",
      "BUYER",
      "INVESTOR",
      "EXPERT",
      "EVALUATION_COMPANY",
      "NOTARY",
      "LAWYER",
      "ADMIN",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Import verification system
    const { canAssignRole, getVerificationDescription } = await import("../lib/verification");

    // Check verification requirements for professional roles
    const { allowed, missingRequirements } = await canAssignRole(userId, role);
    if (!allowed) {
      return res.status(400).json({
        error: "User does not meet verification requirements for this role",
        role,
        missingRequirements,
        requirements: getVerificationDescription(role),
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    res.json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get seller reviews
 */
export const getSellerReviews: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    const reviews = await prisma.evaluatorReview.findMany({
      where: { evaluatorId: id },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (reviews.length === 0) {
      return res.json({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
      });
    }

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Get seller reviews error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all sellers (with pagination and filtering)
 */
export const getSellers: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
    const skip = (page - 1) * limit;

    // Filter options
    const whereCondition: any = {
      role: "SELLER",
      isVerifiedBadge: true, // Only show verified sellers
    };

    // Search by name
    if (req.query.search) {
      whereCondition.OR = [
        {
          firstName: {
            contains: req.query.search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: req.query.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where: whereCondition });

    // Get sellers
    const sellers = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        sellerScore: true,
        totalTransactions: true,
        isVerifiedBadge: true,
        createdAt: true,
      },
      orderBy: { sellerScore: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: sellers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get sellers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Add review to seller
 */
export const addReview: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { evaluatorId, rating, comment } = req.body;

    // Validate input
    const schema = z.object({
      evaluatorId: z.string(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    });

    schema.parse({ evaluatorId, rating, comment });

    // Check if evaluator exists
    const evaluator = await prisma.user.findUnique({
      where: { id: evaluatorId },
    });

    if (!evaluator) {
      return res.status(404).json({ error: "Evaluator not found" });
    }

    // Create review
    const review = await prisma.evaluatorReview.create({
      data: {
        evaluatorId,
        rating,
        comment,
      },
    });

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Add review error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Submit KYC documents
 */
export const submitKyc: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Handle files uploaded via multer-s3
    let documents = req.body.documents; // Fallback for base64
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      documents = req.files.map((file: any) => file.location || file.path);
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: "Documents are required" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        kycStatus: "PENDING",
        kycDocuments: documents,
        kycSubmittedAt: new Date(),
      },
      select: {
        id: true,
        kycStatus: true,
      },
    });

    res.json({
      message: "KYC documents submitted successfully",
      user,
    });
  } catch (error) {
    console.error("Submit KYC error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
