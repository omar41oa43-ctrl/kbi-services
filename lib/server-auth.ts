import { adminAuth, adminDb } from "./firebase-admin";
import {
  UserRole,
  UserRoles,
  normalizeUserRole,
  TechnicianApprovalState,
  TechnicianApprovalStates,
  normalizeTechnicianApprovalState,
  CompanyStatus,
  canAccessOperationalTechFeatures,
} from "./auth-roles";

export type { UserRole, TechnicianApprovalState, CompanyStatus };
export { UserRoles, TechnicianApprovalStates };

export interface VerifiedUserIdentity {
  uid: string;
  email: string | null;
  role: UserRole;
  approvalStatus: TechnicianApprovalState;
  isActive: boolean;
  isLocked: boolean;
  appAccessEnabled: boolean;
  companyId?: string;
  companyStatus?: CompanyStatus;
  userData: Record<string, any>;
}

// Check if Firebase is initialized properly
function isFirebaseReady(): boolean {
  try {
    adminDb.collection("users").doc("test");
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies Firebase ID token, profile existence, role, active status, and approval gates.
 */
export async function verifyUserIdentity(
  idToken: string,
  options?: {
    allowedRoles?: readonly UserRole[];
    requireOperationalTech?: boolean;
  }
): Promise<VerifiedUserIdentity | null> {
  if (!idToken) return null;

  try {
    if (!isFirebaseReady()) return null;

    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const uid = decodedToken.uid;
    if (!uid) return null;

    // 1. Fetch user profile from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    let userData = userDoc.exists ? userDoc.data() || {} : {};

    // 2. Resolve Role
    let rawRole = userData.role || decodedToken.role;
    let role = normalizeUserRole(rawRole);

    // Fallback: Check technicians collection if not in users
    if (!role || role === UserRoles.CUSTOMER) {
      const techDoc = await adminDb.collection("technicians").doc(uid).get();
      if (techDoc.exists) {
        const techData = techDoc.data() || {};
        userData = { ...techData, ...userData };
        role = UserRoles.TECHNICIAN;
      }
    }

    if (!role) return null;

    // Role check if specific roles are required
    if (options?.allowedRoles && !options.allowedRoles.includes(role)) {
      return null;
    }

    // 3. Resolve Approval and Account Flags
    const approvalStatus = normalizeTechnicianApprovalState(
      userData.status ?? userData.approvalStatus ?? (userData.isApproved ? "APPROVED" : "PENDING")
    );

    const isLocked = userData.isLocked === true || userData.disabled === true;
    const appAccessEnabled = userData.appAccessEnabled !== false;
    const isActive = userData.isActive !== false && !isLocked && approvalStatus !== TechnicianApprovalStates.DISABLED;

    // 4. Resolve Company Status (for company technicians)
    let companyStatus: CompanyStatus | undefined;
    if (userData.companyId) {
      const companyDoc = await adminDb.collection("companies").doc(userData.companyId).get();
      if (companyDoc.exists) {
        companyStatus = companyDoc.data()?.status as CompanyStatus;
      }
    }

    // 5. Enforce Operational Access Gate if required
    if (options?.requireOperationalTech) {
      const allowed = canAccessOperationalTechFeatures(role, approvalStatus, {
        isLocked,
        appAccessEnabled,
        companyStatus,
      });
      if (!allowed) return null;
    }

    return {
      uid,
      email: decodedToken.email || userData.email || null,
      role,
      approvalStatus,
      isActive,
      isLocked,
      appAccessEnabled,
      companyId: userData.companyId,
      companyStatus,
      userData,
    };
  } catch (error) {
    console.error("User identity verification error:", error);
    return null;
  }
}

export async function verifyAdmin(idToken: string): Promise<{ uid: string; role: UserRole } | null> {
  const verified = await verifyUserIdentity(idToken, {
    allowedRoles: [UserRoles.SUPER_ADMIN, UserRoles.ADMIN],
  });
  return verified ? { uid: verified.uid, role: verified.role } : null;
}

export async function verifyDispatcher(idToken: string): Promise<{ uid: string; role: UserRole } | null> {
  const verified = await verifyUserIdentity(idToken, {
    allowedRoles: [UserRoles.SUPER_ADMIN, UserRoles.ADMIN, UserRoles.DISPATCHER],
  });
  return verified ? { uid: verified.uid, role: verified.role } : null;
}

export async function verifyTechnician(idToken: string): Promise<{ uid: string; role: UserRole } | null> {
  const verified = await verifyUserIdentity(idToken, {
    allowedRoles: [UserRoles.TECHNICIAN, UserRoles.SUPER_ADMIN, UserRoles.ADMIN],
    requireOperationalTech: true,
  });
  return verified ? { uid: verified.uid, role: verified.role } : null;
}

