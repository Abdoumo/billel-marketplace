import prisma from "../db";

/**
 * Verification requirements for professional roles
 */
export enum VerificationRequirement {
  KYC = "KYC",
  KYB = "KYB",
  KYB_SUBSCRIPTION = "KYB_SUBSCRIPTION",
  BAR_ASSOCIATION = "BAR_ASSOCIATION",
  SUBSCRIPTION = "SUBSCRIPTION",
}

/**
 * Verification rules for each professional role
 */
const roleVerificationRules: Record<string, VerificationRequirement[]> = {
  EXPERT: [VerificationRequirement.KYC],
  NOTARY: [VerificationRequirement.KYB, VerificationRequirement.KYB_SUBSCRIPTION],
  LAWYER: [VerificationRequirement.KYB, VerificationRequirement.BAR_ASSOCIATION],
  EVALUATION_COMPANY: [VerificationRequirement.KYB, VerificationRequirement.SUBSCRIPTION],
};

/**
 * Check if a user meets verification requirements for a role
 */
export async function canAssignRole(
  userId: string,
  targetRole: string
): Promise<{ allowed: boolean; missingRequirements: VerificationRequirement[] }> {
  // Non-professional roles don't require verification
  if (!roleVerificationRules[targetRole]) {
    return { allowed: true, missingRequirements: [] };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      kycStatus: true,
      notaryProfile: {
        select: {
          id: true,
          kybStatus: true,
          subscriptionStatus: true,
        },
      },
      lawyerProfile: {
        select: {
          id: true,
          kybStatus: true,
          barAssociationVerified: true,
        },
      },
      evaluationCompanyProfile: {
        select: {
          id: true,
          kybStatus: true,
          subscriptionStatus: true,
        },
      },
    },
  });

  if (!user) {
    return { allowed: false, missingRequirements: roleVerificationRules[targetRole] };
  }

  const requirements = roleVerificationRules[targetRole] || [];
  const missing: VerificationRequirement[] = [];

  for (const requirement of requirements) {
    const isMet = checkRequirement(user, targetRole, requirement);
    if (!isMet) {
      missing.push(requirement);
    }
  }

  return {
    allowed: missing.length === 0,
    missingRequirements: missing,
  };
}

/**
 * Check if a specific requirement is met for a user
 */
function checkRequirement(
  user: any,
  targetRole: string,
  requirement: VerificationRequirement
): boolean {
  switch (requirement) {
    case VerificationRequirement.KYC:
      // For EXPERT role
      return user.kycStatus === "VERIFIED";

    case VerificationRequirement.KYB:
      // For NOTARY, LAWYER, EVALUATION_COMPANY
      if (targetRole === "NOTARY") {
        return user.notaryProfile?.kybStatus === "VERIFIED";
      }
      if (targetRole === "LAWYER") {
        return user.lawyerProfile?.kybStatus === "VERIFIED";
      }
      if (targetRole === "EVALUATION_COMPANY") {
        return user.evaluationCompanyProfile?.kybStatus === "VERIFIED";
      }
      return false;

    case VerificationRequirement.KYB_SUBSCRIPTION:
      // For NOTARY, EVALUATION_COMPANY
      if (targetRole === "NOTARY") {
        return user.notaryProfile?.subscriptionStatus === "ACTIVE";
      }
      if (targetRole === "EVALUATION_COMPANY") {
        return user.evaluationCompanyProfile?.subscriptionStatus === "ACTIVE";
      }
      return false;

    case VerificationRequirement.BAR_ASSOCIATION:
      // For LAWYER
      return user.lawyerProfile?.barAssociationVerified === true;

    case VerificationRequirement.SUBSCRIPTION:
      // For EVALUATION_COMPANY
      return user.evaluationCompanyProfile?.subscriptionStatus === "ACTIVE";

    default:
      return false;
  }
}

/**
 * Get human-readable verification requirements for a role
 */
export function getVerificationDescription(role: string): string {
  const requirements = roleVerificationRules[role];
  if (!requirements || requirements.length === 0) return "No verification required";

  const descriptions: Record<VerificationRequirement, string> = {
    KYC: "KYC Verification",
    KYB: "KYB (Know Your Business) Verification",
    KYB_SUBSCRIPTION: "Active KYB Subscription",
    BAR_ASSOCIATION: "Bar Association Registration",
    SUBSCRIPTION: "Active Subscription",
  };

  return requirements.map((r) => descriptions[r]).join(", ");
}
