abstract final class AppConfig {
  static const environment = String.fromEnvironment(
    'APP_ENVIRONMENT',
    defaultValue: 'development',
  );

  static const requireEmailVerification = bool.fromEnvironment(
    'REQUIRE_EMAIL_VERIFICATION',
    defaultValue: false,
  );

  static const webVapidKey = String.fromEnvironment('FIREBASE_WEB_VAPID_KEY');

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://kbi.services',
  );

  static const supportWhatsApp = String.fromEnvironment(
    'SUPPORT_WHATSAPP',
    defaultValue: '971502491034',
  );

  static const supportEmail = String.fromEnvironment(
    'SUPPORT_EMAIL',
    defaultValue: 'support@kbi.services',
  );

  static const operationsEmail = String.fromEnvironment(
    'OPERATIONS_EMAIL',
    defaultValue: 'operations@kbi.services',
  );

  static const privacyPolicyUrl = String.fromEnvironment(
    'PRIVACY_POLICY_URL',
    defaultValue: 'https://kbi.services/privacy',
  );

  static const termsUrl = String.fromEnvironment(
    'TERMS_URL',
    defaultValue: 'https://kbi.services/terms',
  );

  static const reviewUrl = String.fromEnvironment(
    'REVIEW_URL',
    defaultValue: 'https://g.page/r/CWG_uPaqr-MjEAI/review',
  );
}
