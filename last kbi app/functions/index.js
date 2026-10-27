const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");

initializeApp();

/**
 * Permanently removes the authenticated technician's account and profile data.
 * The auth token supplied by Firebase determines the account; callers cannot
 * provide a different uid.
 */
exports.technicianDeleteAccount = onCall(
  {region: "us-central1", enforceAppCheck: false},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in before deleting your account.",
      );
    }

    const uid = request.auth.uid;
    const db = getFirestore();
    const ownedDocuments = [
      db.collection("users").doc(uid),
      db.collection("technicians").doc(uid),
      db.collection("technician_requests").doc(uid),
      db.collection("activation_requests").doc(uid),
    ];

    try {
      await Promise.all(
        ownedDocuments.map((document) => db.recursiveDelete(document)),
      );

      await getStorage().bucket().deleteFiles({
        prefix: `technicians/${uid}/`,
        force: true,
      });

      await getAuth().deleteUser(uid);
      logger.info("Technician account deleted", {uid});
      return {deleted: true};
    } catch (error) {
      logger.error("Technician account deletion failed", {uid, error});
      throw new HttpsError(
        "internal",
        "We could not delete the account. Please contact KBI support.",
      );
    }
  },
);
