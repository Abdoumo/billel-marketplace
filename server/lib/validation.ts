import { z } from "zod";

// Auth schemas
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["BUYER", "SELLER", "INVESTOR"]).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Listing schemas
export const ListingSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  category: z.enum([
    "STARTUP",
    "SHARES",
    "DOMAIN",
    "PATENT",
    "APP",
    "SAAS",
    "DESIGN",
  ]),
  state: z.enum([
    "FINISHED",
    "IN_EXECUTION",
    "TESTING",
    "IN_DEVELOPMENT",
    "IDEA",
  ]),
  wilaya: z.string().min(1, "Wilaya is required"),
  askingPrice: z.number().positive("Asking price must be positive"),
  initialInvestment: z.number().positive().optional(),
  revenue: z.number().positive().optional(),
  teamSize: z.number().int().positive().optional(),
  monthlyCampaigners: z.number().int().positive().optional(),
  techStack: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  ownershipDocs: z.array(z.string().url()).optional(),
  pitchDeckUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  evaluationType: z.enum(["SELF", "LOCAL_EXPERT", "CERTIFIED"]).optional(),
});

// Evaluation schemas
export const EvaluationRequestSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  evaluationType: z.enum(["SELF", "LOCAL_EXPERT", "CERTIFIED"]),
  projectData: z.record(z.unknown()).optional(),
});

export const EvaluationSubmitSchema = z.object({
  evaluationId: z.string().min(1, "Evaluation ID is required"),
  score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  reportUrl: z.string().url("Invalid report URL").optional(),
  evaluationColor: z.enum(["LIGHT_BLUE", "PURPLE", "GREEN"]),
});

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(50)
    .default(12),
});

// Type exports for runtime validation
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ListingInput = z.infer<typeof ListingSchema>;
export type EvaluationRequestInput = z.infer<typeof EvaluationRequestSchema>;
