import { RequestHandler } from "express";
import prisma from "../db";
import { ListingSchema, PaginationSchema } from "../lib/validation";
import { ZodError } from "zod";

/**
 * Get all listings with filtering, search, and pagination
 */
export const getListings: RequestHandler = async (req, res) => {
  try {
    // Parse and validate pagination
    const paginationData = PaginationSchema.parse({
      page: req.query.page,
      limit: req.query.limit,
    });

    // Build filters
    const where: any = {
      status: "ACTIVE", // Only show active listings
    };

    // Category filter
    if (req.query.category && typeof req.query.category === "string") {
      where.category = req.query.category as any;
    }

    // State filter
    if (req.query.state && typeof req.query.state === "string") {
      where.state = req.query.state as any;
    }

    // Wilaya (location) filter
    if (req.query.location && typeof req.query.location === "string") {
      where.wilaya = {
        contains: req.query.location,
        mode: "insensitive",
      };
    }

    // Evaluation type filter
    if (req.query.evaluation_type && typeof req.query.evaluation_type === "string") {
      where.evaluationType = req.query.evaluation_type as any;
    }

    // Price range filter
    const minPrice = req.query.min_price
      ? parseFloat(req.query.min_price as string)
      : undefined;
    const maxPrice = req.query.max_price
      ? parseFloat(req.query.max_price as string)
      : undefined;

    if (minPrice || maxPrice) {
      where.askingPrice = {};
      if (minPrice) where.askingPrice.gte = minPrice;
      if (maxPrice) where.askingPrice.lte = maxPrice;
    }

    // Featured filter
    if (req.query.is_featured === "true") {
      where.isFeatured = true;
    }

    // Search filter (title and description)
    if (req.query.search && typeof req.query.search === "string") {
      const searchTerm = req.query.search;
      where.OR = [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    // Determine sort order
    let orderBy: any = {
      createdAt: "desc",
    };

    if (req.query.sort === "price_asc") {
      orderBy = { askingPrice: "asc" };
    } else if (req.query.sort === "price_desc") {
      orderBy = { askingPrice: "desc" };
    } else if (req.query.sort === "most_viewed") {
      orderBy = { viewCount: "desc" };
    }

    // Calculate pagination
    const skip = (paginationData.page - 1) * paginationData.limit;

    // Get total count
    const total = await prisma.listing.count({ where });

    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        state: true,
        wilaya: true,
        askingPrice: true,
        evaluationType: true,
        evaluationColor: true,
        isFeatured: true,
        viewCount: true,
        mediaUrls: true,
        revenue: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isVerifiedBadge: true,
            sellerScore: true,
            avatar: true,
          },
        },
      },
      orderBy,
      skip,
      take: paginationData.limit,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / paginationData.limit);

    res.json({
      data: listings,
      pagination: {
        page: paginationData.page,
        limit: paginationData.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Get listings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get single listing by ID
 */
export const getListing: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isVerifiedBadge: true,
            sellerScore: true,
            totalTransactions: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            type: true,
            status: true,
            resultScore: true,
            evaluationColor: true,
            reportUrl: true,
          },
          where: { status: "COMPLETED" },
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            answerText: true,
            isPublic: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        favorites: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Count favorites
    const favoriteCount = listing.favorites.length;
    const isFavorited = req.user
      ? listing.favorites.some((f) => f.userId === req.user!.userId)
      : false;

    // Clean up the response
    const { favorites, ...listingData } = listing;

    res.json({
      ...listingData,
      favoriteCount,
      isFavorited,
    });
  } catch (error) {
    console.error("Get listing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Create new listing (requires authentication)
 */
export const createListing: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate input
    const data = ListingSchema.parse(req.body);

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        state: data.state,
        wilaya: data.wilaya,
        askingPrice: data.askingPrice,
        initialInvestment: data.initialInvestment,
        revenue: data.revenue,
        teamSize: data.teamSize,
        monthlyCampaigners: data.monthlyCampaigners,
        techStack: data.techStack,
        mediaUrls: data.mediaUrls,
        ownershipDocs: data.ownershipDocs,
        pitchDeckUrl: data.pitchDeckUrl,
        videoUrl: data.videoUrl,
        evaluationType: data.evaluationType || "SELF",
        evaluationColor: (data.evaluationType === "SELF" || !data.evaluationType) ? "LIGHT_BLUE" : undefined,
        status: "PENDING_REVIEW",
        seller: {
          connect: { id: req.user.userId },
        },
      },
    });

    res.status(201).json({
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Create listing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update listing (requires ownership)
 */
export const updateListing: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const id = req.params.id as string;

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.sellerId !== req.user.userId) {
      return res.status(403).json({ error: "You don't have permission to update this listing" });
    }

    // Only allow updates if listing is draft or pending review
    if (!["DRAFT", "PENDING_REVIEW"].includes(listing.status)) {
      return res.status(400).json({
        error: "Cannot update listing in current status",
      });
    }

    // Validate input
    const data = ListingSchema.partial().parse(req.body);

    // Update listing
    const updated = await prisma.listing.update({
      where: { id },
      data,
    });

    res.json({
      message: "Listing updated successfully",
      listing: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Update listing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete listing (requires ownership)
 */
export const deleteListing: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const id = req.params.id as string;

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.sellerId !== req.user.userId) {
      return res.status(403).json({ error: "You don't have permission to delete this listing" });
    }

    // Delete listing
    await prisma.listing.delete({
      where: { id },
    });

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get user's listings (seller dashboard)
 */
export const getUserListings: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse pagination
    const paginationData = PaginationSchema.parse({
      page: req.query.page,
      limit: req.query.limit,
    });

    const skip = (paginationData.page - 1) * paginationData.limit;

    // Get total count
    const total = await prisma.listing.count({
      where: { sellerId: req.user.userId },
    });

    // Get listings
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: paginationData.limit,
    });

    const totalPages = Math.ceil(total / paginationData.limit);

    res.json({
      data: listings,
      pagination: {
        page: paginationData.page,
        limit: paginationData.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Get user listings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
