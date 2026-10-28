import '../utils/service_areas.dart';
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/storage_service.dart';
import '../theme.dart';
import '../widgets/service_multi_select.dart';
import 'request_received_screen.dart';

class RegistrationScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const RegistrationScreen({
    super.key,
    required this.onLocaleChanged,
    required this.locale,
  });

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  static const _regInk = kbiLabel;
  static const _regMuted = kbiSecondaryLabel;
  static const _regAccent = kbiBrand;
  static const _regBorder = kbiSeparator;

  // 'employee' or 'company'
  String _accountType = 'employee';
  bool _isSubmitted = false;
  bool _loading = false;
  String? _errorMessage;

  final _scrollController = ScrollController();

  // Employee fields
  final _empName = TextEditingController();
  final _empEmail = TextEditingController();
  final _empPhone = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _empArea = TextEditingController();
  final List<String> _empSpecializations = ['Mobile Repair'];
  String _empExperience = '3-5 Years';
  String _empEmirate = 'Dubai';
  String? _empEmiratesIdUrl;
  bool _empAgreeTerms = false;

  // Company fields
  final _compName = TextEditingController();
  final _compEmail = TextEditingController();
  final _compPhone = TextEditingController();
  final _compTradeLicenseNum = TextEditingController();
  final _compOwnerName = TextEditingController();
  final _compAreasCovered = TextEditingController();
  final List<String> _compServices = ['Mobile Repair', 'Laptop Repair'];
  String _compNumTechs = '1-5';
  String _compEmirate = 'Dubai';
  String? _compTradeLicenseUrl;
  bool _compAgreeTerms = false;

  // Upload states
  final Map<String, bool> _uploading = {};
  final Map<String, Uint8List> _pendingBytes = {};
  final Map<String, String> _pendingNames = {};

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  bool get _isArabic => widget.locale.languageCode == 'ar';

  String _t(String en, String ar) => _isArabic ? ar : en;

  @override
  void dispose() {
    _scrollController.dispose();
    _empName.dispose();
    _empEmail.dispose();
    _empPhone.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _empArea.dispose();

    _compName.dispose();
    _compEmail.dispose();
    _compPhone.dispose();
    _compTradeLicenseNum.dispose();
    _compOwnerName.dispose();
    _compAreasCovered.dispose();
    super.dispose();
  }

  Future<void> _pickFile(String key) async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
        withData: true,
      );

      if (!mounted) return;
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.bytes != null) {
          setState(() {
            _pendingBytes[key] = file.bytes!;
            _pendingNames[key] = file.name;
            _uploading[key] = true;
          });

          if (mounted) {
            setState(() {
              _uploading[key] = false;
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _uploading[key] = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: kbiRed,
            content: Text(_t('File upload failed: $e', 'فشل رفع الملف: $e')),
          ),
        );
      }
    }
  }

  Future<void> _submitRegistration() async {
    final isEmp = _accountType == 'employee';
    final email = isEmp ? _empEmail.text.trim() : _compEmail.text.trim();
    final password = _password.text;
    final confirm = _confirmPassword.text;
    final name = isEmp ? _empName.text.trim() : _compName.text.trim();
    final phone = isEmp ? _empPhone.text.trim() : _compPhone.text.trim();
    final agreed = isEmp ? _empAgreeTerms : _compAgreeTerms;

    // Basic Validations
    if (name.isEmpty) {
      _showError(
          _t('Please enter your full name.', 'يرجى إدخال الاسم الكامل.'));
      return;
    }
    if (email.isEmpty || !email.contains('@')) {
      _showError(_t('Please enter a valid email address.',
          'يرجى إدخال بريد إلكتروني صحيح.'));
      return;
    }
    if (phone.isEmpty) {
      _showError(_t('Please enter a valid mobile number.',
          'يرجى إدخال رقم هاتف متحرك صحيح.'));
      return;
    }
    if (password.length < 6) {
      _showError(_t('Password must be at least 6 characters.',
          'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'));
      return;
    }
    if (password != confirm) {
      _showError(_t('Passwords do not match.', 'كلمتا المرور غير متطابقتين.'));
      return;
    }
    if (!agreed) {
      _showError(_t('Please agree to the Terms & Conditions.',
          'يرجى الموافقة على الشروط والأحكام.'));
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    UserCredential? userCredential;
    try {
      // 1. Firebase Auth Registration
      userCredential =
          await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final uid = userCredential.user!.uid;

      // Upload documents only after authentication. Storage rules scope every
      // registration file to the signed-in technician's uid.
      try {
        for (final entry in _pendingBytes.entries) {
          final fileName = _pendingNames[entry.key] ?? '${entry.key}.jpg';
          final url = await StorageService.instance.uploadTechnicianFile(
            category: 'registration/${entry.key}',
            fileName: fileName,
            bytes: entry.value,
          );
          if (entry.key == 'emp_emirates_id') _empEmiratesIdUrl = url;
          if (entry.key == 'comp_trade_license') _compTradeLicenseUrl = url;
        }
      } catch (_) {
        await userCredential.user?.delete();
        rethrow;
      }

      // 2. Prepare Firestore Payload
      final Map<String, dynamic> registrationData = isEmp
          ? {
              'full_name': name,
              'phone': phone,
              'experience_main_skill': _empSpecializations.join(', '),
              'skills': _empSpecializations,
              'experience': _empExperience,
              'emirate': _empEmirate,
              'area': _empArea.text.trim().isEmpty
                  ? _empEmirate
                  : _empArea.text.trim(),
              'documents': {
                'emirates_id': _empEmiratesIdUrl,
              },
            }
          : {
              'company_name': name,
              'phone': phone,
              'trade_license_number': _compTradeLicenseNum.text.trim(),
              'owner_name': _compOwnerName.text.trim(),
              'number_of_technicians': _compNumTechs,
              'skills': _compServices,
              'emirate': _compEmirate,
              'areas_covered': _compAreasCovered.text.trim().isEmpty
                  ? _compEmirate
                  : _compAreasCovered.text.trim(),
              'documents': {
                'trade_license': _compTradeLicenseUrl,
              },
            };

      final batch = FirebaseFirestore.instance.batch();

      // Users table entry
      batch.set(FirebaseFirestore.instance.collection('users').doc(uid), {
        'role': 'technician',
        'email': email,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Technicians table entry (for app state & gate)
      batch.set(FirebaseFirestore.instance.collection('technicians').doc(uid), {
        'uid': uid,
        'email': email,
        'isApproved': false,
        'isActive': false,
        'subscriptionStatus': 'inactive',
        'accountType': _accountType,
        'status': 'pending',
        'rating': 5.0,
        'totalJobs': 0,
        'createdAt': FieldValue.serverTimestamp(),
        ...registrationData,
      });

      // Technician_requests table entry (for Admin approval dashboard)
      batch.set(
          FirebaseFirestore.instance.collection('technician_requests').doc(uid),
          {
            'userId': uid,
            'email': email,
            'accountType': _accountType,
            'status': 'pending',
            'createdAt': FieldValue.serverTimestamp(),
            ...registrationData,
          });

      await batch.commit();

      if (mounted) {
        setState(() {
          _loading = false;
          _isSubmitted = true;
        });
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        if (e.code == 'email-already-in-use') {
          _showError(_t('This email is already registered. Please sign in.',
              'هذا البريد مسجل بالفعل. يرجى تسجيل الدخول.'));
        } else if (e.code == 'weak-password') {
          _showError(_t(
              'The password provided is too weak.', 'كلمة المرور ضعيفة جداً.'));
        } else {
          _showError(e.message ??
              _t('Registration error occurred.', 'حدث خطأ أثناء التسجيل.'));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        _showError(_t('Error creating account: $e', 'حدث خطأ: $e'));
      }
    }
  }

  void _showError(String message) {
    setState(() => _errorMessage = message);
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: kbiRed,
        behavior: SnackBarBehavior.floating,
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded,
                color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
                child: Text(message,
                    style: const TextStyle(fontSize: 13, color: Colors.white))),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: Directionality(
          textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
          child: Scaffold(
            backgroundColor: kbiBlack,
            body: Container(
              width: double.infinity,
              height: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [kbiSurface, kbiBlack, kbiBlack],
                  stops: [0.0, 0.25, 1.0],
                ),
              ),
              child: SafeArea(
                child: _isSubmitted
                    ? _buildSuccessView()
                    : _buildRegistrationFormView(),
              ),
            ),
          ),
        ));
  }

  Widget _buildRegistrationFormView() {
    final isEmp = _accountType == 'employee';
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            textDirection: TextDirection.ltr,
            children: [
              const Text('KBI',
                  style: TextStyle(
                      color: _regInk,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.8)),
              const Text('.',
                  style: TextStyle(
                      color: _regAccent,
                      fontSize: 24,
                      fontWeight: FontWeight.w900)),
              const Spacer(),
              IconButton.outlined(
                tooltip: _t('Back', 'رجوع'),
                onPressed: _loading ? null : () => Navigator.of(context).pop(),
                icon: Icon(_isArabic
                    ? Icons.arrow_forward_rounded
                    : Icons.arrow_back_rounded),
                style: IconButton.styleFrom(
                    foregroundColor: _regInk,
                    side: const BorderSide(color: kbiSeparator)),
              ),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: () =>
                    widget.onLocaleChanged(Locale(_isArabic ? 'en' : 'ar')),
                icon: const Icon(Icons.language_rounded, size: 17),
                label: Text(_isArabic ? 'EN' : 'عربي'),
                style: TextButton.styleFrom(foregroundColor: _regInk),
              ),
            ],
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            controller: _scrollController,
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 580),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: _regAccent.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                              color: _regAccent.withValues(alpha: 0.25)),
                        ),
                        child: Text(_t('KBI PARTNER NETWORK', 'شبكة شركاء KBI'),
                            style: const TextStyle(
                                color: _regAccent,
                                fontSize: 10,
                                letterSpacing: 1.1,
                                fontWeight: FontWeight.w800)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(_t('Join the KBI Network', 'انضم إلى شبكة فنيي KBI'),
                        style: const TextStyle(
                            fontSize: 28,
                            height: 1.15,
                            fontWeight: FontWeight.w800,
                            color: _regInk,
                            letterSpacing: -0.7)),
                    const SizedBox(height: 10),
                    Text(
                        _t('Your expertise. Our network. Build your professional profile to get started.',
                            'خبرتك، وشبكتنا. أنشئ ملفك المهني وابدأ رحلتك مع KBI.'),
                        style: const TextStyle(
                            fontSize: 14, color: _regMuted, height: 1.6)),
                    const SizedBox(height: 24),
                    _buildAccountTypeToggle(),
                    const SizedBox(height: 12),
                    Text(
                        isEmp
                            ? _t('For independent field service professionals.',
                                'للفنيين المستقلين والمتخصصين في الخدمات الميدانية.')
                            : _t('For maintenance companies and their teams.',
                                'لشركات الصيانة وفرق العمل التابعة لها.'),
                        style: const TextStyle(
                            color: _regMuted, fontSize: 12, height: 1.5)),
                    const SizedBox(height: 24),
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                            color: const Color(0xFF351D25),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF9D4656))),
                        child: Row(children: [
                          const Icon(Icons.error_outline_rounded,
                              color: kbiRed, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                              child: Text(_errorMessage!,
                                  style: const TextStyle(
                                      color: kbiRed,
                                      fontSize: 13,
                                      height: 1.5))),
                        ]),
                      ),
                      const SizedBox(height: 16),
                    ],
                    _registrationSection(
                      title: _t('1. Account Information', '1. معلومات الحساب'),
                      subtitle: _t('Your contact details and secure sign-in.',
                          'بيانات التواصل والدخول الآمن إلى حسابك.'),
                      icon: Icons.person_outline_rounded,
                      children: [
                        _buildInput(
                            controller: isEmp ? _empName : _compName,
                            label: isEmp
                                ? _t('Full Name *', 'الاسم الكامل *')
                                : _t('Company Name *', 'اسم الشركة *'),
                            icon: isEmp
                                ? Icons.badge_outlined
                                : Icons.business_outlined),
                        _buildInput(
                            controller: isEmp ? _empEmail : _compEmail,
                            label: isEmp
                                ? _t('Email Address *', 'البريد الإلكتروني *')
                                : _t('Company Email *',
                                    'البريد الإلكتروني للشركة *'),
                            icon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress),
                        _buildInput(
                            controller: isEmp ? _empPhone : _compPhone,
                            label: isEmp
                                ? _t('Mobile Number *', 'رقم الهاتف المتحرك *')
                                : _t('Company Phone *', 'هاتف الشركة *'),
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                            hint: '+971 50 000 0000'),
                        if (!isEmp) ...[
                          _buildInput(
                              controller: _compOwnerName,
                              label: _t('Manager / Owner Name *',
                                  'اسم المدير / المالك *'),
                              icon: Icons.person_pin_outlined),
                          _buildInput(
                              controller: _compTradeLicenseNum,
                              label: _t('Trade License Number *',
                                  'رقم الرخصة التجارية *'),
                              icon: Icons.receipt_long_outlined),
                        ],
                        _buildInput(
                            controller: _password,
                            label: _t('Password *', 'كلمة المرور *'),
                            icon: Icons.lock_outline_rounded,
                            obscureText: _obscurePassword,
                            suffixIcon: IconButton(
                                tooltip: _t('Show or hide password',
                                    'إظهار أو إخفاء كلمة المرور'),
                                icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    size: 20,
                                    color: _regMuted),
                                onPressed: () => setState(() =>
                                    _obscurePassword = !_obscurePassword))),
                        _buildInput(
                            controller: _confirmPassword,
                            label:
                                _t('Confirm Password *', 'تأكيد كلمة المرور *'),
                            icon: Icons.lock_clock_outlined,
                            obscureText: _obscureConfirmPassword,
                            suffixIcon: IconButton(
                                tooltip: _t('Show or hide password',
                                    'إظهار أو إخفاء كلمة المرور'),
                                icon: Icon(
                                    _obscureConfirmPassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    size: 20,
                                    color: _regMuted),
                                onPressed: () => setState(() =>
                                    _obscureConfirmPassword =
                                        !_obscureConfirmPassword))),
                        Text(
                            _t('Use at least 6 characters. Fields marked * are required.',
                                'استخدم 6 أحرف على الأقل. الحقول بعلامة * مطلوبة.'),
                            style: const TextStyle(
                                color: _regMuted, fontSize: 11.5, height: 1.5)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _registrationSection(
                      title: _t(
                          '2. Service & Coverage', '2. الخدمات ونطاق التغطية'),
                      subtitle: _t('Tell us what you do and where you work.',
                          'حدد تخصصاتك والمناطق التي تقدم خدماتك فيها.'),
                      icon: Icons.handyman_outlined,
                      children: [
                        Text(
                            _t('Specializations / Services Offered *',
                                'التخصصات والخدمات المقدمة *'),
                            style: const TextStyle(
                                color: _regInk,
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 12),
                        _buildServiceDropdown(),
                        const SizedBox(height: 22),
                        _buildDropdown(
                            label: _t('Emirate *', 'الإمارة *'),
                            value: isEmp ? _empEmirate : _compEmirate,
                            items: uaeEmirates,
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  if (isEmp) {
                                    _empEmirate = value;
                                  } else {
                                    _compEmirate = value;
                                  }
                                });
                              }
                            }),
                        const SizedBox(height: 14),
                        _buildDropdown(
                            label: isEmp
                                ? _t('Experience *', 'الخبرة *')
                                : _t('Techs Count *', 'عدد الفنيين *'),
                            value: isEmp ? _empExperience : _compNumTechs,
                            items: isEmp
                                ? const [
                                    '1-2 Years',
                                    '3-5 Years',
                                    '5-10 Years',
                                    '10+ Years'
                                  ]
                                : const [
                                    '1-5',
                                    '6-10',
                                    '11-20',
                                    '21-50',
                                    '50+'
                                  ],
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  if (isEmp) {
                                    _empExperience = value;
                                  } else {
                                    _compNumTechs = value;
                                  }
                                });
                              }
                            }),
                        const SizedBox(height: 14),
                        _buildInput(
                            controller: isEmp ? _empArea : _compAreasCovered,
                            label: _t('Specific Areas Covered *',
                                'المناطق التي تغطيها *'),
                            icon: Icons.location_on_outlined,
                            hint: _t('e.g. Downtown, Marina, Business Bay',
                                'مثال: وسط المدينة، مارينا، الخليج التجاري')),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _registrationSection(
                      title: _t('3. Documents & Verification',
                          '3. المستندات والتحقق'),
                      subtitle: _t(
                          'Attach a clear copy for your application review.',
                          'أرفق نسخة واضحة لمراجعة طلب انضمامك.'),
                      icon: Icons.verified_user_outlined,
                      children: [
                        _buildUploadCard(
                            label: isEmp
                                ? _t('Emirates ID (Front / Back)',
                                    'بطاقة الهوية الإماراتية')
                                : _t('Trade License Copy',
                                    'نسخة الرخصة التجارية'),
                            keyName: isEmp
                                ? 'emp_emirates_id'
                                : 'comp_trade_license',
                            url: isEmp
                                ? _empEmiratesIdUrl
                                : _compTradeLicenseUrl),
                        const SizedBox(height: 14),
                        Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.info_outline_rounded,
                                  color: _regAccent, size: 17),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: Text(
                                      _t('Applications are reviewed by KBI before account access is enabled.',
                                          'تراجع إدارة KBI طلبك قبل تفعيل الدخول إلى الحساب.'),
                                      style: const TextStyle(
                                          color: _regMuted,
                                          fontSize: 12,
                                          height: 1.5))),
                            ]),
                      ],
                    ),
                    const SizedBox(height: 18),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: kbiBrand,
                      title: Text(
                          _t('I confirm all information is correct and agree to the KBI Partner Terms & Conditions.',
                              'أقر بأن جميع البيانات صحيحة وأوافق على شروط وأحكام شبكة شركاء KBI.'),
                          style: const TextStyle(
                              fontSize: 12.5, color: _regMuted, height: 1.5)),
                      value: isEmp ? _empAgreeTerms : _compAgreeTerms,
                      onChanged: _loading
                          ? null
                          : (value) => setState(() {
                                if (isEmp) {
                                  _empAgreeTerms = value ?? false;
                                } else {
                                  _compAgreeTerms = value ?? false;
                                }
                              }),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                        height: 56,
                        child: FilledButton(
                          onPressed: _loading ? null : _submitRegistration,
                          style: FilledButton.styleFrom(
                              backgroundColor: kbiBrand,
                              foregroundColor: kbiBlack,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16))),
                          child: _loading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                      color: kbiBlack, strokeWidth: 2.5))
                              : Text(
                                  _t('Submit Application',
                                      'تقديم طلب الانضمام'),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15)),
                        )),
                    const SizedBox(height: 16),
                    Text(
                        _t('Already part of KBI? Return to sign in',
                            'لديك حساب بالفعل؟ العودة لتسجيل الدخول'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: _regMuted, fontSize: 12)),
                    Center(
                        child: TextButton(
                            onPressed: _loading
                                ? null
                                : () => Navigator.of(context).pop(),
                            child: Text(_t('Sign in', 'تسجيل الدخول'),
                                style: const TextStyle(color: _regAccent)))),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _registrationSection(
      {required String title,
      required String subtitle,
      required IconData icon,
      required List<Widget> children}) {
    return Container(
      padding: EdgeInsets.all(MediaQuery.sizeOf(context).width < 360 ? 16 : 20),
      decoration: BoxDecoration(
          color: kbiSurfaceRaised,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: kbiSeparator)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        _buildSectionHeading(title, icon),
        const SizedBox(height: 8),
        Text(subtitle,
            style:
                const TextStyle(color: _regMuted, fontSize: 12.5, height: 1.5)),
        const SizedBox(height: 22),
        ...children,
      ]),
    );
  }

  Widget _buildAccountTypeToggle() {
    final isEmp = _accountType == 'employee';
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: kbiSurfaceRaised,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _regBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: _loading
                  ? null
                  : () => setState(() => _accountType = 'employee'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isEmp
                      ? _regAccent.withValues(alpha: 0.10)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: isEmp
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.person_rounded,
                      size: 20,
                      color: isEmp ? _regAccent : _regMuted,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          _t('Individual Tech', 'فني مستقل'),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight:
                                isEmp ? FontWeight.w800 : FontWeight.w600,
                            color: isEmp ? _regInk : _regMuted,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: _loading
                  ? null
                  : () => setState(() => _accountType = 'company'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !isEmp
                      ? _regAccent.withValues(alpha: 0.10)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: !isEmp
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.business_rounded,
                      size: 20,
                      color: !isEmp ? _regAccent : _regMuted,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          _t('Company Tech', 'شركة صيانة'),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight:
                                !isEmp ? FontWeight.w800 : FontWeight.w600,
                            color: !isEmp ? _regInk : _regMuted,
                          ),
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
    );
  }

  Widget _buildSectionHeading(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: _regAccent),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
                fontSize: 16, fontWeight: FontWeight.w700, color: _regInk),
          ),
        ),
      ],
    );
  }

  Widget _buildInput({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            keyboardType: keyboardType,
            enabled: !_loading,
            textInputAction: TextInputAction.next,
            textDirection: keyboardType == TextInputType.emailAddress ||
                    keyboardType == TextInputType.phone
                ? TextDirection.ltr
                : null,
            autocorrect: keyboardType == TextInputType.text &&
                controller != _password &&
                controller != _confirmPassword,
            enableSuggestions:
                controller != _password && controller != _confirmPassword,
            obscureText: obscureText,
            style: const TextStyle(fontSize: 14, color: _regInk),
            decoration: InputDecoration(
              labelText: label,
              hintText: hint,
              hintStyle: const TextStyle(fontSize: 13, color: _regMuted),
              labelStyle: const TextStyle(fontSize: 13, color: _regMuted),
              prefixIcon: Icon(icon, size: 19, color: _regMuted),
              suffixIcon: suffixIcon,
              filled: true,
              fillColor: kbiSurfaceRaised,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _regBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _regBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: _regAccent, width: 1.6),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      isExpanded: true,
      dropdownColor: kbiSurfaceRaised,
      style: const TextStyle(color: _regInk, fontSize: 13.5),
      key: ValueKey('$label:$value'),
      initialValue: value,
      borderRadius: BorderRadius.circular(16),
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: _regMuted),
      menuMaxHeight: 320,
      items: items
          .map((item) => DropdownMenuItem(
              value: item,
              child: Text(_optionLabel(item),
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13.5))))
          .toList(),
      onChanged: _loading ? null : onChanged,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13, color: _regMuted),
        filled: true,
        fillColor: kbiSurfaceRaised,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: _regBorder)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: _regBorder)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: _regAccent, width: 1.6)),
      ),
    );
  }

  String _optionLabel(String value) {
    if (!_isArabic) return value;
    return const {
          'Abu Dhabi': 'أبوظبي',
          'Dubai': 'دبي',
          'Sharjah': 'الشارقة',
          'Ajman': 'عجمان',
          'Umm Al Quwain': 'أم القيوين',
          'Ras Al Khaimah': 'رأس الخيمة',
          'Fujairah': 'الفجيرة',
          '1-2 Years': 'سنة إلى سنتين',
          '3-5 Years': '3 إلى 5 سنوات',
          '5-10 Years': '5 إلى 10 سنوات',
          '10+ Years': 'أكثر من 10 سنوات',
          'Mobile Repair': 'صيانة الهواتف',
          'Laptop Repair': 'صيانة اللابتوبات',
          'Printer Repair': 'صيانة الطابعات',
          'TV Repair': 'صيانة التلفزيونات',
          'Gaming Console': 'أجهزة الألعاب',
          'CCTV': 'كاميرات المراقبة',
          'Network & IT': 'الشبكات والدعم التقني',
          'Apple Devices': 'أجهزة Apple',
          'Android Devices': 'أجهزة Android',
        }[value] ??
        value;
  }

  Widget _buildServiceDropdown() {
    final selection =
        _accountType == 'employee' ? _empSpecializations : _compServices;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      ServiceMultiSelect(
        options: const [
          'Mobile Repair',
          'Laptop Repair',
          'Printer Repair',
          'TV Repair',
          'Gaming Console',
          'CCTV',
          'Network & IT',
          'Apple Devices',
          'Android Devices'
        ],
        selected: selection,
        labelFor: _optionLabel,
        isArabic: _isArabic,
        enabled: !_loading,
        onChanged: (values) => setState(() {
          selection
            ..clear()
            ..addAll(values);
        }),
      ),
      const SizedBox(height: 8),
      Text(
          _t('Choose one or more services from the list.',
              'اختر تخصصاً أو أكثر من القائمة.'),
          style: const TextStyle(color: _regMuted, fontSize: 12, height: 1.5)),
    ]);
  }

  Widget _buildUploadCard({
    required String label,
    required String keyName,
    required String? url,
  }) {
    final isUploading = _uploading[keyName] == true;
    final hasFile = url != null || _pendingNames.containsKey(keyName);
    final fileName = _pendingNames[keyName];

    return InkWell(
      onTap: isUploading ? null : () => _pickFile(keyName),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: hasFile ? kbiSuccess.withValues(alpha: 0.10) : kbiSurfaceMuted,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasFile ? kbiSuccess.withValues(alpha: 0.55) : _regBorder,
            style: BorderStyle.solid,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color:
                    hasFile ? kbiSuccess.withValues(alpha: 0.16) : Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(
                hasFile
                    ? Icons.check_circle_rounded
                    : Icons.upload_file_rounded,
                size: 20,
                color: hasFile ? kbiSuccess : _regMuted,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: hasFile ? kbiSuccess : _regInk,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isUploading
                        ? _t('Uploading...', 'جارٍ الرفع...')
                        : (hasFile
                            ? (fileName ??
                                _t('Document attached', 'المستند مرفق'))
                            : _t('Tap to upload PDF, PNG or JPG',
                                'اضغط لرفع ملف PDF أو صورة')),
                    style: TextStyle(
                      fontSize: 11.5,
                      color: hasFile ? kbiSuccess : _regMuted,
                    ),
                  ),
                ],
              ),
            ),
            if (isUploading)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: _regAccent),
              )
            else
              Text(
                hasFile ? _t('Change', 'تغيير') : _t('Browse', 'استعراض'),
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: _regAccent),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return RequestReceivedScreen(
      locale: widget.locale,
      onLocaleChanged: widget.onLocaleChanged,
    );
  }
}
