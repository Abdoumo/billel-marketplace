import { UserRole } from "../generated/prisma/enums";

/**
 * Define all possible actions in the system
 */
export enum Action {
  // Listings
  CREATE_LISTING = "CREATE_LISTING",
  EDIT_LISTING = "EDIT_LISTING",
  DELETE_LISTING = "DELETE_LISTING",
  VIEW_LISTING = "VIEW_LISTING",

  // Favorites
  SAVE_FAVORITE = "SAVE_FAVORITE",
  VIEW_FAVORITES = "VIEW_FAVORITES",

  // Questions
  ASK_QUESTION = "ASK_QUESTION",
  VIEW_QUESTIONS = "VIEW_QUESTIONS",
  ANSWER_QUESTION = "ANSWER_QUESTION",

  // Transactions
  INITIATE_TRANSACTION = "INITIATE_TRANSACTION",
  VIEW_TRANSACTIONS = "VIEW_TRANSACTIONS",
  COMPLETE_TRANSACTION = "COMPLETE_TRANSACTION",

  // Evaluations
  REQUEST_EVALUATION = "REQUEST_EVALUATION",
  SUBMIT_EVALUATION = "SUBMIT_EVALUATION",
  VIEW_EVALUATIONS = "VIEW_EVALUATIONS",

  // Legal Services
  PROVIDE_LEGAL_ADVICE = "PROVIDE_LEGAL_ADVICE",
  REGISTER_CONTRACT = "REGISTER_CONTRACT",
  TRANSFER_OWNERSHIP = "TRANSFER_OWNERSHIP",

  // Deal Rooms
  ACCESS_DEAL_ROOM = "ACCESS_DEAL_ROOM",
  VIEW_DEAL_ROOMS = "VIEW_DEAL_ROOMS",

  // Admin
  ADMIN_VIEW_KYC = "ADMIN_VIEW_KYC",
  ADMIN_APPROVE_KYC = "ADMIN_APPROVE_KYC",
  ADMIN_VIEW_USERS = "ADMIN_VIEW_USERS",
  ADMIN_UPDATE_USER_ROLE = "ADMIN_UPDATE_USER_ROLE",
  ADMIN_MODERATE_LISTINGS = "ADMIN_MODERATE_LISTINGS",
  ADMIN_VIEW_REPORTS = "ADMIN_VIEW_REPORTS",
  ADMIN_VIEW_STATS = "ADMIN_VIEW_STATS",

  // User Profile
  VIEW_PROFILE = "VIEW_PROFILE",
  UPDATE_PROFILE = "UPDATE_PROFILE",
  SUBMIT_KYC = "SUBMIT_KYC",
}

/**
 * Permission matrix: what each role can do
 */
const permissionMatrix: Record<UserRole, Action[]> = {
  VISITOR: [
    Action.VIEW_LISTING,
    Action.VIEW_PROFILE,
  ],

  BUYER: [
    // All visitor actions
    Action.VIEW_LISTING,
    Action.VIEW_PROFILE,
    Action.UPDATE_PROFILE,
    Action.SUBMIT_KYC,

    // Buyer-specific actions
    Action.SAVE_FAVORITE,
    Action.VIEW_FAVORITES,
    Action.ASK_QUESTION,
    Action.VIEW_QUESTIONS,
    Action.INITIATE_TRANSACTION,
    Action.VIEW_TRANSACTIONS,
    Action.REQUEST_EVALUATION,
    Action.VIEW_EVALUATIONS,
  ],

  SELLER: [
    // All buyer actions (sellers can also buy)
    ...permissionMatrix.BUYER || [],

    // Seller-specific actions
    Action.CREATE_LISTING,
    Action.EDIT_LISTING,
    Action.DELETE_LISTING,
    Action.ANSWER_QUESTION,
    Action.COMPLETE_TRANSACTION,
  ],

  INVESTOR: [
    // All buyer actions
    ...permissionMatrix.BUYER || [],

    // Investor-specific actions
    Action.ACCESS_DEAL_ROOM,
    Action.VIEW_DEAL_ROOMS,
  ],

  EXPERT: [
    // All buyer actions
    ...permissionMatrix.BUYER || [],

    // Expert-specific actions
    Action.SUBMIT_EVALUATION,
    Action.VIEW_EVALUATIONS,
    Action.PROVIDE_LEGAL_ADVICE,
  ],

  EVALUATION_COMPANY: [
    // All buyer actions
    ...permissionMatrix.BUYER || [],

    // Company-specific actions
    Action.SUBMIT_EVALUATION,
    Action.VIEW_EVALUATIONS,
  ],

  NOTARY: [
    // All buyer actions
    ...permissionMatrix.BUYER || [],

    // Notary-specific actions
    Action.REGISTER_CONTRACT,
    Action.TRANSFER_OWNERSHIP,
  ],

  LAWYER: [
    // All buyer actions
    ...permissionMatrix.BUYER || [],

    // Lawyer-specific actions
    Action.PROVIDE_LEGAL_ADVICE,
  ],

  ADMIN: [
    // Admins can do everything
    Object.values(Action),
  ].flat() as Action[],
};

/**
 * Check if a user role has permission to perform an action
 */
export function hasPermission(role: UserRole, action: Action): boolean {
  const permissions = permissionMatrix[role];
  return permissions ? permissions.includes(action) : false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Action[] {
  return permissionMatrix[role] || [];
}

/**
 * Get human-readable description of an action
 */
export function getActionDescription(action: Action): string {
  const descriptions: Record<Action, string> = {
    // Listings
    CREATE_LISTING: "Create a new listing",
    EDIT_LISTING: "Edit a listing",
    DELETE_LISTING: "Delete a listing",
    VIEW_LISTING: "View listings",

    // Favorites
    SAVE_FAVORITE: "Save listings as favorites",
    VIEW_FAVORITES: "View saved favorites",

    // Questions
    ASK_QUESTION: "Ask questions on listings",
    VIEW_QUESTIONS: "View questions on listings",
    ANSWER_QUESTION: "Answer questions on your listings",

    // Transactions
    INITIATE_TRANSACTION: "Initiate a transaction",
    VIEW_TRANSACTIONS: "View transactions",
    COMPLETE_TRANSACTION: "Complete transactions",

    // Evaluations
    REQUEST_EVALUATION: "Request an evaluation",
    SUBMIT_EVALUATION: "Submit an evaluation",
    VIEW_EVALUATIONS: "View evaluations",

    // Legal Services
    PROVIDE_LEGAL_ADVICE: "Provide legal advice",
    REGISTER_CONTRACT: "Register contracts",
    TRANSFER_OWNERSHIP: "Transfer ownership",

    // Deal Rooms
    ACCESS_DEAL_ROOM: "Access deal rooms",
    VIEW_DEAL_ROOMS: "View deal rooms",

    // Admin
    ADMIN_VIEW_KYC: "View KYC applications",
    ADMIN_APPROVE_KYC: "Approve/reject KYC",
    ADMIN_VIEW_USERS: "View users",
    ADMIN_UPDATE_USER_ROLE: "Update user roles",
    ADMIN_MODERATE_LISTINGS: "Moderate listings",
    ADMIN_VIEW_REPORTS: "View reports",
    ADMIN_VIEW_STATS: "View platform stats",

    // User Profile
    VIEW_PROFILE: "View profiles",
    UPDATE_PROFILE: "Update profile",
    SUBMIT_KYC: "Submit KYC documents",
  };

  return descriptions[action] || "Unknown action";
}

/**
 * Middleware factory: require specific permission
 */
export function requirePermission(action: Action) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const role = req.user.role as UserRole;
    if (!hasPermission(role, action)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: getActionDescription(action),
        userRole: role,
      });
    }

    next();
  };
}
