/**
 * Canonical Role-Based Access Control (RBAC) & Status Definitions
 * Supports:
 * - SUPER_ADMIN
 * - ADMIN
 * - DISPATCHER
 * - SUPPORT
 * - TECHNICIAN
 * - COMPANY
 * - CUSTOMER
 */

export const UserRoles = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  DISPATCHER: "DISPATCHER",
  SUPPORT: "SUPPORT",
  TECHNICIAN: "TECHNICIAN",
  COMPANY: "COMPANY",
  CUSTOMER: "CUSTOMER",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const TechnicianApprovalStates = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
  DISABLED: "DISABLED",
} as const;

export type TechnicianApprovalState =
  (typeof TechnicianApprovalStates)[keyof typeof TechnicianApprovalStates];

export const CompanyStatuses = {
  ACTIVE: "ACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  SUSPENDED: "SUSPENDED",
  INACTIVE: "INACTIVE",
} as const;

export type CompanyStatus = (typeof CompanyStatuses)[keyof typeof CompanyStatuses];

/**
 * Normalizes input role string to canonical uppercase UserRole
 */
export function normalizeUserRole(input: unknown): UserRole | null {
  if (!input || typeof input !== "string") return null;
  const cleaned = input.trim().toUpperCase().replace(/[\s-]+/g, "_");

  switch (cleaned) {
    case "SUPER_ADMIN":
    case "SUPERADMIN":
      return UserRoles.SUPER_ADMIN;
    case "ADMIN":
    case "OPERATIONS_MANAGER":
      return UserRoles.ADMIN;
    case "DISPATCHER":
    case "DISPATCH":
      return UserRoles.DISPATCHER;
    case "SUPPORT":
    case "CUSTOMER_SUPPORT":
    case "HELP_DESK":
      return UserRoles.SUPPORT;
    case "TECHNICIAN":
    case "TECH":
      return UserRoles.TECHNICIAN;
    case "COMPANY":
    case "CORPORATE":
    case "SERVICE_PROVIDER":
      return UserRoles.COMPANY;
    case "CUSTOMER":
    case "CLIENT":
    case "USER":
      return UserRoles.CUSTOMER;
    default:
      return null;
  }
}

/**
 * Normalizes technician approval state string to canonical uppercase TechnicianApprovalState
 */
export function normalizeTechnicianApprovalState(
  input: unknown
): TechnicianApprovalState {
  if (!input || typeof input !== "string") return TechnicianApprovalStates.PENDING;
  const cleaned = input.trim().toUpperCase();

  switch (cleaned) {
    case "APPROVED":
    case "ACTIVE":
      return TechnicianApprovalStates.APPROVED;
    case "SUSPENDED":
      return TechnicianApprovalStates.SUSPENDED;
    case "REJECTED":
      return TechnicianApprovalStates.REJECTED;
    case "DISABLED":
    case "DEACTIVATED":
      return TechnicianApprovalStates.DISABLED;
    case "PENDING":
    default:
      return TechnicianApprovalStates.PENDING;
  }
}

/**
 * Permission check: Can manage platform technicians (Approve, Reject, Suspend, Disable, Reactivate)
 */
export function canManageTechnicians(role: UserRole): boolean {
  return role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN;
}

/**
 * Permission check: Can dispatch orders to technicians
 */
export function canDispatchOrders(role: UserRole): boolean {
  return (
    role === UserRoles.SUPER_ADMIN ||
    role === UserRoles.ADMIN ||
    role === UserRoles.DISPATCHER
  );
}

/**
 * Permission check: Can access technician operational workflows (accept jobs, update status, broadcast location)
 */
export function canAccessOperationalTechFeatures(
  role: UserRole,
  status: TechnicianApprovalState,
  options?: {
    isLocked?: boolean;
    appAccessEnabled?: boolean;
    companyStatus?: CompanyStatus;
  }
): boolean {
  // Super admin and admin can access operational features for testing/override
  if (role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN) return true;

  if (role !== UserRoles.TECHNICIAN) return false;
  if (status !== TechnicianApprovalStates.APPROVED) return false;
  if (options?.isLocked === true) return false;
  if (options?.appAccessEnabled === false) return false;
  if (options?.companyStatus && options.companyStatus !== CompanyStatuses.ACTIVE) {
    return false;
  }

  return true;
}
