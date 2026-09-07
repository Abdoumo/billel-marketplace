import { RequestHandler } from "express";
import prisma from "../db";
import { EvaluationRequestSchema, EvaluationSubmitSchema } from "../lib/validation";
import { ZodError } from "zod";

/**
 * Request an evaluation for a listing
 */
export const requestEvaluation: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { listingId, evaluationType, projectData } = req.body;

    // Validate input
    const data = EvaluationRequestSchema.parse({
      listingId,
      evaluationType,
      projectData,
    });

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Check if user is the seller (for self-evaluation or requesting evaluation)
    // For other types, anyone can request an evaluation
    if (data.evaluationType === "SELF" && listing.sellerId !== req.user.userId) {
      return res.status(403).json({
        error: "Only the seller can request self-evaluation",
      });
    }

    // Check if evaluation already exists
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        listingId: data.listingId,
        type: data.evaluationType,
      },
    });

    if (existingEvaluation) {
      return res.status(400).json({
        error: `${data.evaluationType} evaluation already exists for this listing`,
      });
    }

    // Create evaluation request
    const evaluation = await prisma.evaluation.create({
      data: {
        listing: { connect: { id: data.listingId } },
        evaluator: { connect: { id: req.user.userId } },
        type: data.evaluationType,
        status: data.evaluationType === "SELF" ? "COMPLETED" : "PENDING_QUOTE",
        projectData: data.projectData as any,
      },
    });

    // If self-evaluation, generate auto quote
    if (data.evaluationType === "SELF") {
      const autoScore = generateAutoScore(listing);
      const autoColor = getColorForScore(autoScore);

      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: {
          resultScore: autoScore,
          evaluationColor: autoColor,
          completedAt: new Date(),
        },
      });

      // Update listing
      await prisma.listing.update({
        where: { id: data.listingId },
        data: {
          evaluationType: "SELF",
          evaluationColor: autoColor,
        },
      });
    }

    const updatedEvaluation = await prisma.evaluation.findUnique({
      where: { id: evaluation.id },
    });

    res.status(201).json({
      message: "Evaluation requested successfully",
      evaluation: updatedEvaluation,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Request evaluation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get evaluation quote (for expert/certified evaluations)
 */
export const getEvaluationQuote: RequestHandler = async (req, res) => {
  try {
    const evaluationId = req.params.evaluationId as string;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        listing: true,
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    // Calculate quote based on evaluation type
    const quote = calculateQuote(evaluation.type, evaluation.listing);

    res.json({
      evaluationId,
      quote,
      evaluationType: evaluation.type,
      estimatedCompletionDays: evaluation.type === "CERTIFIED" ? 7 : 3,
    });
  } catch (error) {
    console.error("Get evaluation quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Submit evaluation result (for expert/certified evaluators)
 */
export const submitEvaluationResult: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { evaluationId, score, reportUrl, evaluationColor } = req.body;

    // Validate input
    const data = EvaluationSubmitSchema.parse({
      evaluationId,
      score,
      reportUrl,
      evaluationColor,
    });

    // Get evaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: data.evaluationId },
      include: { listing: true },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    // Check if user is evaluator
    if (evaluation.evaluatorId !== req.user.userId) {
      return res.status(403).json({
        error: "Only the assigned evaluator can submit results",
      });
    }

    // Check if evaluation is in progress
    if (evaluation.status !== "PAID" && evaluation.status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Evaluation is not ready for submission",
      });
    }

    // Update evaluation
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: data.evaluationId },
      data: {
        resultScore: data.score,
        reportUrl: data.reportUrl,
        evaluationColor: data.evaluationColor,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Update listing with evaluation color
    await prisma.listing.update({
      where: { id: evaluation.listing.id },
      data: {
        evaluationType: evaluation.type,
        evaluationColor: data.evaluationColor,
      },
    });

    res.json({
      message: "Evaluation result submitted successfully",
      evaluation: updatedEvaluation,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Submit evaluation result error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get evaluations for a listing
 */
export const getListingEvaluations: RequestHandler = async (req, res) => {
  try {
    const listingId = req.params.listingId as string;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        listingId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        type: true,
        resultScore: true,
        evaluationColor: true,
        reportUrl: true,
        createdAt: true,
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      listingId,
      evaluations,
      count: evaluations.length,
    });
  } catch (error) {
    console.error("Get listing evaluations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get evaluator's pending evaluations
 */
export const getEvaluatorPendingWork: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const pending = await prisma.evaluation.findMany({
      where: {
        evaluatorId: req.user.userId,
        status: {
          in: ["PENDING_QUOTE", "PAID", "IN_PROGRESS"],
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            askingPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      pendingEvaluations: pending,
      count: pending.length,
    });
  } catch (error) {
    console.error("Get evaluator pending work error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Mark evaluation as paid
 */
export const markEvaluationAsPaid: RequestHandler = async (req, res) => {
  try {
    // Require authentication
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const evaluationId = req.params.evaluationId as string;
    const { paymentRef } = req.body;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { listing: true },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    // Check if user is the seller of the listing
    if (evaluation.listing.sellerId !== req.user.userId) {
      return res.status(403).json({
        error: "Only the seller can confirm payment",
      });
    }

    // Update evaluation status
    const updated = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        status: "PAID",
      },
    });

    res.json({
      message: "Evaluation marked as paid",
      evaluation: updated,
    });
  } catch (error) {
    console.error("Mark evaluation as paid error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate auto score based on listing characteristics
 */
function generateAutoScore(listing: any): number {
  let score = 50; // Base score

  // Add points for financial metrics
  if (listing.revenue) {
    score += Math.min(20, listing.revenue / 100000);
  }

  // Add points for team size
  if (listing.teamSize) {
    score += Math.min(15, listing.teamSize);
  }

  // Add points for state
  const stateScore: Record<string, number> = {
    FINISHED: 25,
    IN_EXECUTION: 20,
    TESTING: 15,
    IN_DEVELOPMENT: 10,
    IDEA: 5,
  };
  score += stateScore[listing.state] || 0;

  return Math.min(100, Math.round(score));
}

/**
 * Determine evaluation color based on score
 */
function getColorForScore(score: number): "LIGHT_BLUE" | "PURPLE" | "GREEN" {
  if (score >= 70) return "GREEN";
  if (score >= 50) return "PURPLE";
  return "LIGHT_BLUE";
}

/**
 * Calculate quote price for evaluation
 */
function calculateQuote(
  evaluationType: "SELF" | "LOCAL_EXPERT" | "CERTIFIED",
  listing: any
): number {
  const basePrice: Record<string, number> = {
    SELF: 0,
    LOCAL_EXPERT: 15000, // 15,000 DZD
    CERTIFIED: 50000, // 50,000 DZD
  };

  let quote = basePrice[evaluationType];

  // Adjust for listing complexity
  if (listing.askingPrice > 5000000) {
    quote *= 1.5;
  } else if (listing.askingPrice > 1000000) {
    quote *= 1.2;
  }

  return Math.round(quote);
}
