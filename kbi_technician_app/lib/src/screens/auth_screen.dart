import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'package:url_launcher/url_launcher.dart';

import 'registration_screen.dart';

class AuthScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;
  final bool Function()? onWelcomeContinue;
  final bool initialShowLoginForm;
  final ValueChanged<bool>? onViewChanged;

  const AuthScreen({
    super.key,
    required this.onLocaleChanged,
    required this.locale,
    this.onWelcomeContinue,
    this.initialShowLoginForm = true,
    this.onViewChanged,
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
  final LocalAuthentication _localAuth = LocalAuthentication();
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _savedEmailKey = 'kbi_biometric_email';
  static const _savedPasswordKey = 'kbi_biometric_password';

  late bool _showLoginForm;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _rememberMe = true;
  bool _hasBiometrics = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _showLoginForm = widget.initialShowLoginForm;
    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    try {
      final canAuthWithBiometrics = await _localAuth.canCheckBiometrics;
      final canAuth =
          canAuthWithBiometrics || await _localAuth.isDeviceSupported();
      final savedEmail = await _secureStorage.read(key: _savedEmailKey);
      final savedPassword = await _secureStorage.read(key: _savedPasswordKey);
      if (mounted) {
        setState(() => _hasBiometrics = canAuth &&
            savedEmail?.isNotEmpty == true &&
            savedPassword?.isNotEmpty == true);
      }
    } catch (_) {
      // Ignore if device doesn't support biometrics
    }
  }

  Future<void> _authenticateWithBiometrics() async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: widget.locale.languageCode == 'ar'
            ? 'استخدم البصمة أو Face ID لتسجيل الدخول إلى KBI Technician'
            : 'Use your fingerprint or Face ID to sign in to KBI Technician',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
      if (authenticated && mounted) {
        final savedEmail = await _secureStorage.read(key: _savedEmailKey);
        final savedPassword = await _secureStorage.read(key: _savedPasswordKey);
        if (savedEmail == null || savedPassword == null) {
          setState(() {
            _hasBiometrics = false;
            _error = widget.locale.languageCode == 'ar'
                ? 'سجّل الدخول بكلمة المرور أولاً لتفعيل الدخول السريع.'
                : 'Sign in with your password first to enable quick sign-in.';
          });
          return;
        }
        setState(() {
          _loading = true;
          _error = null;
        });
        try {
          await FirebaseAuth.instance.signInWithEmailAndPassword(
            email: savedEmail,
            password: savedPassword,
          );
        } on FirebaseAuthException catch (error) {
          await _clearSavedBiometricLogin();
          if (mounted) {
            setState(() {
              _hasBiometrics = false;
              _error = _friendlyLoginError(error);
            });
          }
        } finally {
          if (mounted) setState(() => _loading = false);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Biometric authentication was cancelled.');
      }
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
      if (_rememberMe) {
        await _secureStorage.write(
          key: _savedEmailKey,
          value: _email.text.trim(),
        );
        await _secureStorage.write(
          key: _savedPasswordKey,
          value: _password.text,
        );
      } else {
        await _clearSavedBiometricLogin();
      }
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
    final controller = TextEditingController(text: _email.text.trim());
    final email = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Reset password',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.emailAddress,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Email address',
            labelStyle: TextStyle(color: Colors.white70),
            enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.white30)),
            focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF0066FF))),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0066FF)),
            onPressed: () =>
                Navigator.pop(dialogContext, controller.text.trim()),
            child: const Text('Send request'),
          ),
        ],
      ),
    );
    controller.dispose();
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
          backgroundColor: Color(0xFF10B981),
          content: Text('Password reset request sent successfully.'),
        ),
      );
    } on FirebaseException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.redAccent,
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

    return Directionality(
      textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Stack(
          fit: StackFit.expand,
          children: [
            _buildTechnicianBackground(),

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
    );
  }

  Widget _buildTechnicianBackground() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final targetHeight = constraints.maxHeight * 0.60;
        final widthForTargetHeight = targetHeight * 1.35;
        final imageWidth = widthForTargetHeight > constraints.maxWidth
            ? widthForTargetHeight
            : constraints.maxWidth;
        final imageHeight = imageWidth / 1.35;
        final imageTopOffset = constraints.maxHeight < 650 ? 10.0 : 26.0;

        return ColoredBox(
          color: const Color(0xFFF1F3F6),
          child: Align(
            alignment: Alignment.topCenter,
            child: Transform.translate(
              offset: Offset(0, imageTopOffset),
              child: OverflowBox(
                alignment: Alignment.topCenter,
                minWidth: imageWidth,
                maxWidth: imageWidth,
                minHeight: imageHeight,
                maxHeight: imageHeight,
                child: Image.asset(
                  'assets/images/kbi_welcome_technician.png',
                  width: imageWidth,
                  height: imageHeight,
                  fit: BoxFit.contain,
                  alignment: Alignment.topCenter,
                  errorBuilder: (_, __, ___) => Image.asset(
                    'assets/images/technician-login-bg-v2.png',
                    width: imageWidth,
                    height: imageHeight,
                    fit: BoxFit.contain,
                    alignment: Alignment.topCenter,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // ==========================================
  // VIEW 1: HERO ONBOARDING / WELCOME SCREEN
  // ==========================================
  Widget _buildWelcomeView(bool isArabic) {
    return KeyedSubtree(
      key: const ValueKey('welcome_view'),
      child: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  const Color(0xFF06111F).withValues(alpha: 0.08),
                  const Color(0xFF06111F).withValues(alpha: 0.86),
                  const Color(0xFF06111F).withValues(alpha: 0.98),
                ],
                stops: const [0.0, 0.36, 0.62, 1.0],
              ),
            ),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxHeight < 650;

                return SingleChildScrollView(
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
                                  ? (compact ? 27 : 32)
                                  : (compact ? 29 : 36),
                              fontWeight: FontWeight.w900,
                              letterSpacing: isArabic ? 0 : -1.0,
                              height: isArabic ? 1.18 : 1.06,
                            ),
                          ),
                          SizedBox(height: compact ? 8 : 12),
                          Text(
                            isArabic
                                ? 'أدِر المهام المسندة إليك، وانتقل إلى العملاء، وحدّث حالة كل خدمة من مكان واحد.'
                                : 'Manage assigned jobs, navigate to customers, and keep every service update in one place.',
                            textAlign: TextAlign.start,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.76),
                              fontSize: compact ? 12.5 : 14,
                              fontWeight: FontWeight.w500,
                              height: 1.45,
                            ),
                          ),
                          SizedBox(height: compact ? 16 : 24),
                          SizedBox(
                            height: 58,
                            child: FilledButton(
                              key: const Key('welcome-primary-action'),
                              onPressed: _continueFromWelcome,
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF0D67E8),
                                foregroundColor: Colors.white,
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
                                      color:
                                          Colors.white.withValues(alpha: 0.16),
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
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.verified_user_outlined,
                                size: 14,
                                color: Colors.white.withValues(alpha: 0.52),
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
                                    color: Colors.white.withValues(alpha: 0.52),
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
    return KeyedSubtree(
      key: const ValueKey('login_view'),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _buildTechnicianBackground(),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.white.withValues(alpha: 0.10),
                  Colors.white.withValues(alpha: 0.84),
                  const Color(0xFFF6F8FC),
                ],
                stops: const [0, 0.25, 0.46, 1],
              ),
            ),
          ),
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildGlassIconButton(
                        key: const Key('show-welcome-action'),
                        icon: isArabic
                            ? Icons.arrow_forward_rounded
                            : Icons.arrow_back_rounded,
                        onTap: () => _setAuthView(showLogin: false),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.white,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0F172A)
                                  .withValues(alpha: 0.10),
                              blurRadius: 18,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: const _KbiWordmark(size: 19),
                      ),
                      const Spacer(),
                      _buildGlassIconButton(
                        text: isArabic ? 'EN' : 'عربي',
                        onTap: () => widget.onLocaleChanged(
                          Locale(isArabic ? 'en' : 'ar'),
                        ),
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
                  padding: const EdgeInsets.fromLTRB(18, 175, 18, 16),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 430),
                    child: Container(
                      key: const Key('technician-login-form'),
                      padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.96),
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(color: Colors.white),
                        boxShadow: [
                          BoxShadow(
                            color:
                                const Color(0xFF0F172A).withValues(alpha: 0.12),
                            blurRadius: 32,
                            offset: const Offset(0, 14),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Title & Subtitle
                          Text(
                            isArabic ? 'مرحباً بعودتك' : 'Welcome back',
                            textAlign: TextAlign.start,
                            style: const TextStyle(
                              color: Color(0xFF111827),
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.9,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            isArabic
                                ? 'سجل الدخول لإدارة مهامك الميدانية'
                                : 'Access your dispatch board and live jobs.',
                            textAlign: TextAlign.start,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 18),

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
                          ),
                          const SizedBox(height: 12),

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
                                color: const Color(0xFF64748B),
                                size: 19,
                              ),
                              onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword),
                            ),
                            onSubmitted: (_) => _loading ? null : _submit(),
                          ),
                          const SizedBox(height: 12),

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
                                                ? const Color(0xFF0A70FF)
                                                : Colors.transparent,
                                            borderRadius:
                                                BorderRadius.circular(6),
                                            border: Border.all(
                                              color: _rememberMe
                                                  ? const Color(0xFF0A70FF)
                                                  : const Color(0xFFCBD5E1),
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
                                          style: const TextStyle(
                                            color: Color(0xFF475569),
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
                                    color: Color(0xFF0D67E8),
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Error message banner
                          if (_error != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.redAccent.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: Colors.redAccent
                                        .withValues(alpha: 0.35)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline_rounded,
                                      color: Colors.redAccent, size: 17),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _error!,
                                      style: const TextStyle(
                                        color: Color(0xFFB42318),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          // CTA Button: Blue "Sign In" Capsule + Biometric Unlock Button
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 50,
                                  child: ElevatedButton(
                                    onPressed: _loading ? null : _submit,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0A70FF),
                                      foregroundColor: Colors.white,
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
                                              color: Colors.white,
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
                              if (_hasBiometrics) ...[
                                const SizedBox(width: 10),
                                Container(
                                  width: 50,
                                  height: 50,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEAF2FF),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: const Color(0xFFB9D4FF),
                                      width: 1.2,
                                    ),
                                  ),
                                  child: IconButton(
                                    icon: const Icon(Icons.fingerprint_rounded,
                                        color: Color(0xFF0D67E8), size: 26),
                                    tooltip: isArabic
                                        ? 'الدخول بالبصمة أو الوجه'
                                        : 'Sign in with Biometrics',
                                    onPressed: _loading
                                        ? null
                                        : _authenticateWithBiometrics,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Bottom Link: Apply to join
                          Wrap(
                            alignment: WrapAlignment.center,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                isArabic ? 'فني جديد؟ ' : 'New technician? ',
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 13,
                                ),
                              ),
                              TextButton(
                                onPressed: _openRegistration,
                                style: TextButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 4),
                                  foregroundColor: const Color(0xFF0D67E8),
                                ),
                                child: Text(
                                  isArabic
                                      ? 'انضم إلى أسطول KBI →'
                                      : 'Apply to join KBI →',
                                  style: const TextStyle(
                                    color: Color(0xFF0D67E8),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Customer Support Contact Section
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.headset_mic_outlined,
                                      size: 14,
                                      color: Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        isArabic
                                            ? 'خدمة العملاء والدعم الفني'
                                            : 'Customer & Technical Support',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          color: Color(0xFF64748B),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    // WhatsApp Support Button
                                    Expanded(
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(10),
                                        onTap: () async {
                                          final uri = Uri.parse(
                                              'https://wa.me/971502491034');
                                          if (await canLaunchUrl(uri)) {
                                            await launchUrl(uri,
                                                mode: LaunchMode
                                                    .externalApplication);
                                          }
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 7),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF0FDF4),
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                              color: const Color(0xFFDCFCE7),
                                            ),
                                          ),
                                          child: const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                Icons
                                                    .chat_bubble_outline_rounded,
                                                color: Color(0xFF22C55E),
                                                size: 14,
                                              ),
                                              SizedBox(width: 5),
                                              Flexible(
                                                child: Text(
                                                  '0502491034',
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: TextStyle(
                                                    color: Color(0xFF15803D),
                                                    fontSize: 11.5,
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),

                                    // Email Support Button
                                    Expanded(
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(10),
                                        onTap: () async {
                                          final uri = Uri.parse(
                                              'mailto:support@kbi.services');
                                          if (await canLaunchUrl(uri)) {
                                            await launchUrl(uri,
                                                mode: LaunchMode
                                                    .externalApplication);
                                          }
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 7),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFEFF6FF),
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                              color: const Color(0xFFDBEAFE),
                                            ),
                                          ),
                                          child: const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                Icons.mail_outline_rounded,
                                                color: Color(0xFF2563EB),
                                                size: 14,
                                              ),
                                              SizedBox(width: 5),
                                              Flexible(
                                                child: Text(
                                                  'support@kbi.services',
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: TextStyle(
                                                    color: Color(0xFF1D4ED8),
                                                    fontSize: 10.5,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
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
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF334155),
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 7),
        AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: 52,
          decoration: BoxDecoration(
            color: const Color(0xFFF5F7FA),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(
              color: focusNode.hasFocus
                  ? const Color(0xFF0D67E8)
                  : const Color(0xFFDCE3EC),
              width: focusNode.hasFocus ? 1.5 : 1.1,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 15),
          child: Row(
            children: [
              Icon(icon, color: const Color(0xFF0D67E8), size: 19),
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
                  style: const TextStyle(
                    color: Color(0xFF111827),
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
                    hintStyle: const TextStyle(
                      color: Color(0xFF94A3B8),
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
  }) {
    return GestureDetector(
      key: key,
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: text != null ? 14 : 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.10),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Center(
          child: icon != null
              ? Icon(icon, color: const Color(0xFF334155), size: 18)
              : Text(
                  text!,
                  style: const TextStyle(
                    color: Color(0xFF0D67E8),
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

  const _KbiWordmark({this.size = 26});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: RichText(
        text: TextSpan(
          style: TextStyle(
            color: const Color(0xFF111318),
            fontSize: size,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.2,
          ),
          children: const [
            TextSpan(text: 'KBI'),
            TextSpan(text: '.', style: TextStyle(color: Color(0xFF2AC8CB))),
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
                  const Color(0xFF0066FF),
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
                      color: const Color(0xFF0066FF),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0066FF)
                              .withValues(alpha: 0.5 + 0.3 * progress),
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
