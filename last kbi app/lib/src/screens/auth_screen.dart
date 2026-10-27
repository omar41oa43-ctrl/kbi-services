import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme.dart';
import '../widgets/password_reset_dialog.dart';
import '../widgets/auth_portrait_background.dart';
import 'registration_screen.dart';

class AuthScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;
  final bool Function()? onWelcomeContinue;
  final bool initialShowLoginForm;
  final ValueChanged<bool>? onViewChanged;
  final VoidCallback? onSignedIn;

  const AuthScreen({
    super.key,
    required this.onLocaleChanged,
    required this.locale,
    this.onWelcomeContinue,
    this.initialShowLoginForm = false,
    this.onViewChanged,
    this.onSignedIn,
  });

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen>
    with SingleTickerProviderStateMixin {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _savedEmailKey = 'kbi_biometric_email';
  static const _savedPasswordKey = 'kbi_biometric_password';

  late bool _showLoginForm;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _rememberMe = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _showLoginForm = widget.initialShowLoginForm;
    _restoreRememberedEmail();
  }

  Future<void> _restoreRememberedEmail() async {
    try {
      final savedEmail = await _secureStorage.read(key: _savedEmailKey);
      await _secureStorage.delete(key: _savedPasswordKey);
      if (mounted && savedEmail?.isNotEmpty == true) {
        setState(() => _email.text = savedEmail!);
      }
    } catch (_) {
      // Remembered email is an optional convenience only.
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Please enter your email and password.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final cred = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _email.text.trim(),
        password: _password.text,
      );
      final uid = cred.user?.uid;
      if (uid != null) {
        try {
          await FirebaseFirestore.instance
              .collection('technicians')
              .doc(uid)
              .set({
            'isOnline': true,
            'online': true,
            'isAvailable': true,
            'available': true,
            'availability': 'available',
            'status': 'AVAILABLE',
            'lastActive': FieldValue.serverTimestamp(),
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
        } catch (statusErr) {
          debugPrint(
              'Error setting initial online status on login: $statusErr');
        }
      }
      try {
        if (_rememberMe) {
          await _secureStorage.write(
            key: _savedEmailKey,
            value: _email.text.trim(),
          );
          await _secureStorage.delete(key: _savedPasswordKey);
        } else {
          await _clearSavedBiometricLogin();
        }
      } catch (error) {
        // Credential verification succeeded. Remembering the email is only a
        // convenience and must never prevent entry to the authenticated app.
        debugPrint('Could not update remembered login email: $error');
      }
      if (mounted) widget.onSignedIn?.call();
    } on FirebaseAuthException catch (error) {
      if (mounted) {
        setState(() => _error = _friendlyLoginError(error));
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Unable to sign in. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _clearSavedBiometricLogin() async {
    await _secureStorage.delete(key: _savedEmailKey);
    await _secureStorage.delete(key: _savedPasswordKey);
  }

  String _friendlyLoginError(FirebaseAuthException error) {
    final isArabic = widget.locale.languageCode == 'ar';
    switch (error.code) {
      case 'invalid-email':
        return isArabic
            ? 'تحقق من صيغة البريد الإلكتروني.'
            : 'Check the email address format.';
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return isArabic
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : 'The email or password is incorrect.';
      case 'user-disabled':
        return isArabic
            ? 'تم إيقاف هذا الحساب. تواصل مع دعم KBI.'
            : 'This account is disabled. Contact KBI support.';
      case 'too-many-requests':
        return isArabic
            ? 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.'
            : 'Too many attempts. Wait a moment, then try again.';
      case 'network-request-failed':
        return isArabic
            ? 'لا يوجد اتصال. تحقق من الشبكة وحاول مجدداً.'
            : 'No connection. Check your network and try again.';
      default:
        return isArabic
            ? 'تعذر تسجيل الدخول. حاول مجدداً.'
            : 'Unable to sign in. Please try again.';
    }
  }

  Future<void> _showForgotPasswordDialog() async {
    final email = await showDialog<String>(
      context: context,
      builder: (_) => PasswordResetDialog(
        initialEmail: _email.text.trim(),
        isArabic: widget.locale.languageCode == 'ar',
      ),
    );
    if (email == null || email.isEmpty || !mounted) return;
    try {
      final requestId =
          base64Url.encode(utf8.encode(email)).replaceAll('=', '');
      await FirebaseFirestore.instance
          .collection('password_reset_requests')
          .doc(requestId)
          .set({
        'email': email.toLowerCase(),
        'status': 'pending',
        'source': 'technician_app',
        'requestedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'requestCount': FieldValue.increment(1),
      }, SetOptions(merge: true));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: kbiSuccess,
          content: Text('Password reset request sent successfully.'),
        ),
      );
    } on FirebaseException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: kbiRed,
          content: Text(error.message ?? 'Unable to send the request.'),
        ),
      );
    }
  }

  Future<void> _openRegistration() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => RegistrationScreen(
          locale: widget.locale,
          onLocaleChanged: widget.onLocaleChanged,
        ),
      ),
    );
  }

  void _continueFromWelcome() {
    final handledByApp = widget.onWelcomeContinue?.call() ?? false;
    if (!handledByApp && mounted) {
      _setAuthView(showLogin: true);
    }
  }

  void _setAuthView({required bool showLogin}) {
    widget.onViewChanged?.call(showLogin);
    if (mounted && _showLoginForm != showLogin) {
      setState(() => _showLoginForm = showLogin);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isArabic = widget.locale.languageCode == 'ar';

    return AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: Directionality(
          textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
          child: Scaffold(
            backgroundColor: const Color(0xFF020305),
            body: Stack(
              fit: StackFit.expand,
              children: [
                _buildTechnicianBackground(
                  compactLogin: _showLoginForm,
                ),

                // 2. Animated Content Switcher (Welcome Screen <-> Login Screen)
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.04),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                          parent: anim, curve: Curves.easeOutCubic)),
                      child: child,
                    ),
                  ),
                  child: _showLoginForm
                      ? _buildLoginView(isArabic)
                      : _buildWelcomeView(isArabic),
                ),
              ],
            ),
          ),
        ));
  }

  Widget _buildTechnicianBackground({bool compactLogin = false}) =>
      AuthPortraitBackground(
        portraitKey: compactLogin ? const Key('login-technician-hero') : null,
      );

  // ==========================================
  // VIEW 1: HERO ONBOARDING / WELCOME SCREEN
  // ==========================================
  Widget _buildWelcomeView(bool isArabic) {
    return KeyedSubtree(
      key: const ValueKey('welcome_view'),
      child: Stack(
        fit: StackFit.expand,
        children: [
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxHeight < 650;
                final needsScroll = constraints.maxHeight < 460 ||
                    MediaQuery.textScalerOf(context).scale(1) > 1.3;

                return SingleChildScrollView(
                  physics: needsScroll
                      ? const ClampingScrollPhysics()
                      : const NeverScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(
                    compact ? 18 : 24,
                    12,
                    compact ? 18 : 24,
                    16,
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 28,
                    ),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            textDirection: TextDirection.ltr,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                key: const Key('welcome-header'),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.94),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: Colors.white),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF06111F)
                                          .withValues(alpha: 0.10),
                                      blurRadius: 18,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: const _KbiWordmark(size: 21),
                              ),
                              _buildGlassIconButton(
                                text: isArabic ? 'EN' : 'عربي',
                                onTap: () => widget.onLocaleChanged(
                                  Locale(isArabic ? 'en' : 'ar'),
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          Text(
                            isArabic
                                ? 'يوم عملك.\nتواصل أفضل.'
                                : 'Your workday.\nBetter connected.',
                            textAlign: TextAlign.start,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: isArabic
                                  ? (compact ? 30 : 36)
                                  : (compact ? 32 : 38),
                              fontWeight: FontWeight.w800,
                              letterSpacing: isArabic ? 0 : -1.0,
                              height: isArabic ? 1.18 : 1.06,
                            ),
                          ),
                          SizedBox(height: compact ? 8 : 12),
                          Text(
                            isArabic
                                ? 'أدر المهام المسندة إليك، وانتقل إلى العملاء، وحدّث حالة كل خدمة من مكان واحد.'
                                : 'Manage assigned jobs, navigate to customers, and keep every service update in one place.',
                            textAlign: TextAlign.start,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.76),
                              fontSize: compact ? 13.5 : 15,
                              fontWeight: FontWeight.w500,
                              height: 1.55,
                            ),
                          ),
                          SizedBox(height: compact ? 16 : 24),
                          SizedBox(
                            height: compact ? 54 : 58,
                            child: FilledButton(
                              key: const Key('welcome-primary-action'),
                              onPressed: _continueFromWelcome,
                              style: FilledButton.styleFrom(
                                backgroundColor: kbiBrand,
                                foregroundColor: const Color(0xFF032B2A),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Flexible(
                                    child: Text(
                                      isArabic
                                          ? 'المتابعة لتسجيل الدخول'
                                          : 'Continue to sign in',
                                      maxLines: 1,
                                      overflow: TextOverflow.fade,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Container(
                                    width: 30,
                                    height: 30,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF032B2A)
                                          .withValues(alpha: 0.08),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Directionality(
                                      textDirection: TextDirection.ltr,
                                      child: Icon(
                                        isArabic
                                            ? Icons.arrow_back_rounded
                                            : Icons.arrow_forward_rounded,
                                        size: 18,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: compact ? 8 : 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.verified_user_outlined,
                                size: 14,
                                color: Colors.white.withValues(alpha: 0.66),
                              ),
                              const SizedBox(width: 7),
                              Flexible(
                                child: Text(
                                  isArabic
                                      ? 'دخول آمن لمتخصصي الخدمة الميدانية'
                                      : 'Secure access for field professionals',
                                  maxLines: 1,
                                  overflow: TextOverflow.fade,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.66),
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // VIEW 2: LOGIN / DOORSTEP SCREEN
  // ==========================================
  Widget _buildLoginView(bool isArabic) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final compact = MediaQuery.sizeOf(context).height < 700;
    final panelColor = isDark ? kbiSurfaceRaised : const Color(0xFFFCFEFE);
    final fieldColor = isDark ? kbiSurfaceMuted : const Color(0xFFEAF3F3);
    final labelColor = isDark ? kbiLabel : const Color(0xFF102426);
    final secondaryColor = isDark ? kbiSecondaryLabel : const Color(0xFF536568);
    final borderColor = isDark ? kbiSeparator : const Color(0x33295F61);

    return KeyedSubtree(
      key: const ValueKey('login_view'),
      child: Stack(
        fit: StackFit.expand,
        children: [
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  maxWidth: 460,
                  maxHeight: 52,
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Row(
                    textDirection: TextDirection.ltr,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        key: const Key('login-header-logo'),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: panelColor.withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: borderColor,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.38),
                              blurRadius: 18,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: _KbiWordmark(size: 19, dark: isDark),
                      ),
                      const Spacer(),
                      _buildGlassIconButton(
                        key: const Key('show-welcome-action'),
                        icon: isArabic
                            ? Icons.arrow_forward_rounded
                            : Icons.arrow_back_rounded,
                        onTap: () => _setAuthView(showLogin: false),
                        lightMode: false,
                      ),
                      const SizedBox(width: 8),
                      _buildGlassIconButton(
                        text: isArabic ? 'EN' : 'عربي',
                        onTap: () => widget.onLocaleChanged(
                          Locale(isArabic ? 'en' : 'ar'),
                        ),
                        lightMode: false,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 52),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: EdgeInsets.fromLTRB(
                    compact ? 14 : 18,
                    compact ? 72 : 108,
                    compact ? 14 : 18,
                    compact ? 8 : 16,
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 430),
                    child: Container(
                      key: const Key('technician-login-form'),
                      padding: EdgeInsets.fromLTRB(
                        compact ? 15 : 20,
                        compact ? 14 : 18,
                        compact ? 15 : 20,
                        compact ? 12 : 16,
                      ),
                      decoration: BoxDecoration(
                        color: panelColor.withValues(alpha: 0.98),
                        borderRadius: BorderRadius.circular(compact ? 22 : 28),
                        border: Border.all(color: borderColor),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black
                                .withValues(alpha: isDark ? 0.46 : 0.14),
                            blurRadius: compact ? 20 : 32,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Align(
                            alignment: AlignmentDirectional.centerStart,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: kbiBrand.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(99),
                                border: Border.all(
                                  color: kbiBrand.withValues(alpha: 0.34),
                                ),
                              ),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.engineering_rounded,
                                      color: kbiBrand,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      isArabic
                                          ? 'بوابة فنيي KBI'
                                          : 'KBI TECHNICIAN PORTAL',
                                      style: const TextStyle(
                                        color: kbiBrand,
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.45,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Title & Subtitle
                          Text(
                            isArabic ? 'مرحباً بعودتك' : 'Welcome back',
                            textAlign: TextAlign.start,
                            style: TextStyle(
                              color: labelColor,
                              fontSize: compact ? 24 : 28,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.9,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isArabic
                                ? 'سجل الدخول لإدارة مهامك الميدانية'
                                : 'Access your dispatch board and live jobs.',
                            textAlign: TextAlign.start,
                            style: TextStyle(
                              color: secondaryColor,
                              fontSize: compact ? 12 : 13,
                            ),
                          ),
                          SizedBox(height: compact ? 12 : 18),

                          // Input 1: Enter your email
                          _buildGlassInputField(
                            label: isArabic
                                ? 'البريد الإلكتروني'
                                : 'Email address',
                            controller: _email,
                            focusNode: _emailFocus,
                            hintText: isArabic
                                ? 'أدخل بريدك الإلكتروني'
                                : 'Enter your email',
                            icon: Icons.mail_outline_rounded,
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            onSubmitted: (_) => _passwordFocus.requestFocus(),
                            fieldColor: fieldColor,
                            labelColor: labelColor,
                            secondaryColor: secondaryColor,
                            borderColor: borderColor,
                            compact: compact,
                          ),
                          SizedBox(height: compact ? 8 : 12),

                          // Input 2: Enter your password
                          _buildGlassInputField(
                            label: isArabic ? 'كلمة المرور' : 'Password',
                            controller: _password,
                            focusNode: _passwordFocus,
                            hintText: isArabic
                                ? 'أدخل كلمة المرور'
                                : 'Enter your password',
                            icon: Icons.lock_outline_rounded,
                            obscureText: _obscurePassword,
                            textInputAction: TextInputAction.done,
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                color: secondaryColor,
                                size: 19,
                              ),
                              onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword),
                            ),
                            onSubmitted: (_) => _loading ? null : _submit(),
                            fieldColor: fieldColor,
                            labelColor: labelColor,
                            secondaryColor: secondaryColor,
                            borderColor: borderColor,
                            compact: compact,
                          ),
                          SizedBox(height: compact ? 4 : 10),

                          // Row: [✓] Remember me ... Forgot Password?
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            children: [
                              Semantics(
                                button: true,
                                checked: _rememberMe,
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(10),
                                  onTap: () => setState(
                                    () => _rememberMe = !_rememberMe,
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 10,
                                      horizontal: 2,
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          width: 20,
                                          height: 20,
                                          decoration: BoxDecoration(
                                            color: _rememberMe
                                                ? kbiBrand
                                                : Colors.transparent,
                                            borderRadius:
                                                BorderRadius.circular(6),
                                            border: Border.all(
                                              color: _rememberMe
                                                  ? kbiBrand
                                                  : secondaryColor,
                                              width: 1.5,
                                            ),
                                          ),
                                          child: _rememberMe
                                              ? const Icon(
                                                  Icons.check_rounded,
                                                  size: 14,
                                                  color: Colors.white,
                                                )
                                              : null,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          isArabic ? 'تذكرني' : 'Remember me',
                                          style: TextStyle(
                                            color: secondaryColor,
                                            fontSize: 12.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              TextButton(
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  visualDensity: VisualDensity.compact,
                                ),
                                onPressed:
                                    _loading ? null : _showForgotPasswordDialog,
                                child: Text(
                                  isArabic
                                      ? 'نسيت كلمة المرور؟'
                                      : 'Forgot password?',
                                  style: const TextStyle(
                                    color: kbiBrand,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: compact ? 4 : 10),

                          // Error message banner
                          if (_error != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.redAccent.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: kbiRed.withValues(alpha: 0.35)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline_rounded,
                                      color: kbiRed, size: 17),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _error!,
                                      style: TextStyle(
                                        color: labelColor,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          // Primary sign-in action
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: compact ? 46 : 50,
                                  child: ElevatedButton(
                                    onPressed: _loading ? null : _submit,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: kbiBrand,
                                      foregroundColor: kbiBlack,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    child: _loading
                                        ? const SizedBox.square(
                                            dimension: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.2,
                                              color: kbiBlack,
                                            ),
                                          )
                                        : Text(
                                            isArabic
                                                ? 'تسجيل الدخول'
                                                : 'Sign in',
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 0.3,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: compact ? 4 : 8),

                          // Bottom Link: Apply to join
                          Wrap(
                            alignment: WrapAlignment.center,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                isArabic ? 'فني جديد؟ ' : 'New technician? ',
                                style: TextStyle(
                                  color: secondaryColor,
                                  fontSize: 13,
                                ),
                              ),
                              TextButton(
                                onPressed: _openRegistration,
                                style: TextButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 4),
                                  foregroundColor: kbiBrand,
                                ),
                                child: Text(
                                  isArabic
                                      ? 'انضم إلى أسطول KBI →'
                                      : 'Apply to join KBI →',
                                  style: const TextStyle(
                                    color: kbiBrand,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: compact ? 4 : 10),

                          _buildLoginSupport(
                            isArabic: isArabic,
                            compact: compact,
                            surfaceColor: fieldColor,
                            labelColor: labelColor,
                            secondaryColor: secondaryColor,
                            borderColor: borderColor,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginSupport({
    required bool isArabic,
    required bool compact,
    required Color surfaceColor,
    required Color labelColor,
    required Color secondaryColor,
    required Color borderColor,
  }) {
    Future<void> openSupport(Uri uri) async {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }

    Widget action({
      required IconData icon,
      required String label,
      required VoidCallback onTap,
    }) {
      return Expanded(
        child: Semantics(
          button: true,
          label: label,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: Container(
              height: compact ? 38 : 42,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: kbiBrand, size: 16),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: labelColor,
                        fontSize: compact ? 10.5 : 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.headset_mic_outlined, size: 14, color: secondaryColor),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                isArabic
                    ? 'تحتاج مساعدة؟ تواصل معنا'
                    : 'Need help? Contact support',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: secondaryColor,
                  fontSize: compact ? 10.5 : 11.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: compact ? 5 : 7),
        Row(
          children: [
            action(
              icon: Icons.chat_bubble_outline_rounded,
              label: isArabic ? 'واتساب' : 'WhatsApp',
              onTap: () => openSupport(Uri.parse('https://wa.me/971502491034')),
            ),
            const SizedBox(width: 8),
            action(
              icon: Icons.mail_outline_rounded,
              label: isArabic ? 'البريد الإلكتروني' : 'Email support',
              onTap: () =>
                  openSupport(Uri.parse('mailto:support@kbi.services')),
            ),
          ],
        ),
      ],
    );
  }

  // --- REUSABLE GLASS INPUT FIELD ---
  Widget _buildGlassInputField({
    required String label,
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hintText,
    required IconData icon,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction textInputAction = TextInputAction.done,
    Widget? suffixIcon,
    void Function(String)? onSubmitted,
    required Color fieldColor,
    required Color labelColor,
    required Color secondaryColor,
    required Color borderColor,
    required bool compact,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: labelColor,
            fontSize: compact ? 11.5 : 12.5,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: compact ? 5 : 7),
        AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: compact ? 48 : 52,
          decoration: BoxDecoration(
            color: fieldColor,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(
              color: focusNode.hasFocus ? kbiBrand : borderColor,
              width: focusNode.hasFocus ? 1.5 : 1.1,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 15),
          child: Row(
            children: [
              Icon(icon, color: kbiBrand, size: 19),
              const SizedBox(width: 11),
              Expanded(
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  obscureText: obscureText,
                  keyboardType: keyboardType,
                  textInputAction: textInputAction,
                  autofillHints: keyboardType == TextInputType.emailAddress
                      ? const [AutofillHints.email]
                      : obscureText
                          ? const [AutofillHints.password]
                          : null,
                  style: TextStyle(
                    color: labelColor,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 15),
                    hintText: hintText,
                    hintStyle: TextStyle(
                      color: secondaryColor,
                      fontSize: 13.5,
                    ),
                  ),
                  onSubmitted: onSubmitted,
                ),
              ),
              if (suffixIcon != null) suffixIcon,
            ],
          ),
        ),
      ],
    );
  }

  // --- REUSABLE GLASS TOP ICON BUTTON ---
  Widget _buildGlassIconButton({
    Key? key,
    IconData? icon,
    String? text,
    required VoidCallback onTap,
    bool lightMode = false,
  }) {
    final surface = lightMode
        ? const Color(0xF7FCFEFE)
        : kbiSurfaceRaised.withValues(alpha: 0.92);
    final foreground = lightMode ? const Color(0xFF102426) : kbiLabel;
    final outline = lightMode ? const Color(0x33295F61) : kbiSeparator;
    return GestureDetector(
      key: key,
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: text != null ? 14 : 10, vertical: 8),
        decoration: BoxDecoration(
          color: surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: outline),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.38),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Center(
          child: icon != null
              ? Icon(icon, color: foreground, size: 18)
              : Text(
                  text!,
                  style: const TextStyle(
                    color: kbiBrand,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }
}

// --- KBI WORDMARK ---
class _KbiWordmark extends StatelessWidget {
  final double size;
  final bool dark;

  const _KbiWordmark({this.size = 26, this.dark = false});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: RichText(
        text: TextSpan(
          style: TextStyle(
            color: dark ? kbiLabel : const Color(0xFF111318),
            fontSize: size,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.2,
          ),
          children: const [
            TextSpan(text: 'KBI'),
            TextSpan(text: '.', style: TextStyle(color: kbiBrand)),
          ],
        ),
      ),
    );
  }
}

// --- INTERACTIVE SWIPE TO GET STARTED ---
class _SwipeToGetStarted extends StatefulWidget {
  final bool isArabic;
  final VoidCallback onTrigger;

  const _SwipeToGetStarted({
    required this.isArabic,
    required this.onTrigger,
  });

  @override
  State<_SwipeToGetStarted> createState() => _SwipeToGetStartedState();
}

class _SwipeToGetStartedState extends State<_SwipeToGetStarted>
    with SingleTickerProviderStateMixin {
  double _dragPosition = 0.0;
  bool _completed = false;
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    )..addListener(() {
        setState(() {
          _dragPosition = _animation.value;
        });
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails details, double maxDrag) {
    if (_completed) return;
    final delta =
        widget.isArabic ? -details.primaryDelta! : details.primaryDelta!;
    setState(() {
      _dragPosition = (_dragPosition + delta).clamp(0.0, maxDrag);
    });
  }

  void _onDragEnd(DragEndDetails details, double maxDrag) {
    if (_completed) return;
    final velocity = details.primaryVelocity ?? 0;
    final isFling = widget.isArabic ? velocity < -250 : velocity > 250;
    if (_dragPosition >= maxDrag * 0.45 || isFling) {
      _completeSwipe(maxDrag);
    } else {
      _snapBack();
    }
  }

  void _snapBack() {
    _animation = Tween<double>(begin: _dragPosition, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward(from: 0.0);
  }

  void _completeSwipe(double maxDrag) {
    if (_completed) return;
    setState(() => _completed = true);
    _animation = Tween<double>(begin: _dragPosition, end: maxDrag).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward(from: 0.0).then((_) {
      widget.onTrigger();
    });
  }

  @override
  Widget build(BuildContext context) {
    const double knobSize = 48.0;
    const double trackHeight = 64.0;
    const double padding = 8.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final double maxDrag = (constraints.maxWidth - (knobSize + padding * 2))
            .clamp(10.0, double.infinity);
        final double progress =
            maxDrag > 0 ? (_dragPosition / maxDrag).clamp(0.0, 1.0) : 0.0;

        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _completeSwipe(maxDrag),
          onHorizontalDragUpdate: (details) => _onDragUpdate(details, maxDrag),
          onHorizontalDragEnd: (details) => _onDragEnd(details, maxDrag),
          child: Container(
            height: trackHeight,
            padding: const EdgeInsets.symmetric(horizontal: padding),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B).withValues(alpha: 0.88),
              borderRadius: BorderRadius.circular(36),
              border: Border.all(
                color: Color.lerp(
                  Colors.white.withValues(alpha: 0.2),
                  kbiBrand,
                  progress,
                )!,
                width: 1.4,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Background Track label & chevrons (fades out as knob advances)
                Opacity(
                  opacity: (1.0 - progress * 1.5).clamp(0.0, 1.0),
                  child: Row(
                    children: [
                      const SizedBox(width: knobSize + 8),
                      const Spacer(),
                      Text(
                        widget.isArabic ? 'اسحب للبدء' : 'Get Started',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Icon(
                            widget.isArabic
                                ? Icons.chevron_left_rounded
                                : Icons.chevron_right_rounded,
                            color: Colors.white.withValues(alpha: 0.35),
                            size: 22,
                          ),
                          Icon(
                            widget.isArabic
                                ? Icons.chevron_left_rounded
                                : Icons.chevron_right_rounded,
                            color: Colors.white.withValues(alpha: 0.65),
                            size: 22,
                          ),
                          Icon(
                            widget.isArabic
                                ? Icons.chevron_left_rounded
                                : Icons.chevron_right_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                        ],
                      ),
                    ],
                  ),
                ),

                // Draggable glowing circular knob
                Positioned(
                  left: widget.isArabic ? null : _dragPosition,
                  right: widget.isArabic ? _dragPosition : null,
                  child: Container(
                    width: knobSize,
                    height: knobSize,
                    decoration: BoxDecoration(
                      color: kbiBrand,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color:
                              kbiBrand.withValues(alpha: 0.5 + 0.3 * progress),
                          blurRadius: 12 + 6 * progress,
                          spreadRadius: 2 * progress,
                        ),
                      ],
                    ),
                    child: Center(
                      child: AnimatedRotation(
                        duration: const Duration(milliseconds: 150),
                        turns: progress * 0.25,
                        child: Icon(
                          progress > 0.6
                              ? (widget.isArabic
                                  ? Icons.arrow_back_rounded
                                  : Icons.arrow_forward_rounded)
                              : Icons.apps_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
