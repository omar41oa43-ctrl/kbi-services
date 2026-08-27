import 'dart:async';
import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
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
  String? _empProfilePhotoUrl;
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
  String? _compLogoUrl;
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

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.bytes != null) {
          setState(() {
            _pendingBytes[key] = file.bytes!;
            _pendingNames[key] = file.name;
            _uploading[key] = true;
          });

          final ext = file.name.split('.').last.toLowerCase();
          final fileName = '${DateTime.now().millisecondsSinceEpoch}_$key.$ext';
          final ref = FirebaseStorage.instance
              .ref()
              .child('registration_docs/$key/$fileName');
          
          await ref.putData(
            file.bytes!,
            SettableMetadata(
              contentType: ext == 'pdf' ? 'application/pdf' : 'image/jpeg',
            ),
          );
          final url = await ref.getDownloadURL();

          if (mounted) {
            setState(() {
              _uploading[key] = false;
              if (key == 'emp_emirates_id') _empEmiratesIdUrl = url;
              if (key == 'emp_profile_photo') _empProfilePhotoUrl = url;
              if (key == 'comp_trade_license') _compTradeLicenseUrl = url;
              if (key == 'comp_logo') _compLogoUrl = url;
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _uploading[key] = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFD92D20),
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
      _showError(_t('Please enter your full name.', 'يرجى إدخال الاسم الكامل.'));
      return;
    }
    if (email.isEmpty || !email.contains('@')) {
      _showError(_t('Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.'));
      return;
    }
    if (phone.isEmpty) {
      _showError(_t('Please enter a valid mobile number.', 'يرجى إدخال رقم هاتف متحرك صحيح.'));
      return;
    }
    if (password.length < 6) {
      _showError(_t('Password must be at least 6 characters.', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'));
      return;
    }
    if (password != confirm) {
      _showError(_t('Passwords do not match.', 'كلمتا المرور غير متطابقتين.'));
      return;
    }
    if (!agreed) {
      _showError(_t('Please agree to the Terms & Conditions.', 'يرجى الموافقة على الشروط والأحكام.'));
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    UserCredential? userCredential;
    try {
      // 1. Firebase Auth Registration
      userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final uid = userCredential.user!.uid;

      // 2. Prepare Firestore Payload
      final Map<String, dynamic> registrationData = isEmp
          ? {
              'full_name': name,
              'phone': phone,
              'experience_main_skill': _empSpecializations.join(', '),
              'skills': _empSpecializations,
              'experience': _empExperience,
              'emirate': _empEmirate,
              'area': _empArea.text.trim().isEmpty ? _empEmirate : _empArea.text.trim(),
              'documents': {
                'emirates_id': _empEmiratesIdUrl,
                'profile_photo': _empProfilePhotoUrl,
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
              'areas_covered': _compAreasCovered.text.trim().isEmpty ? _compEmirate : _compAreasCovered.text.trim(),
              'documents': {
                'company_logo': _compLogoUrl,
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
      batch.set(FirebaseFirestore.instance.collection('technician_requests').doc(uid), {
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
          _showError(_t('This email is already registered. Please sign in.', 'هذا البريد مسجل بالفعل. يرجى تسجيل الدخول.'));
        } else if (e.code == 'weak-password') {
          _showError(_t('The password provided is too weak.', 'كلمة المرور ضعيفة جداً.'));
        } else {
          _showError(e.message ?? _t('Registration error occurred.', 'حدث خطأ أثناء التسجيل.'));
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
        backgroundColor: const Color(0xFFD92D20),
        behavior: SnackBarBehavior.floating,
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontSize: 13, color: Colors.white))),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFEBF3FE), Color(0xFFF8FAFC), Color(0xFFF8FAFC)],
              stops: [0.0, 0.25, 1.0],
            ),
          ),
          child: SafeArea(
            child: _isSubmitted ? _buildSuccessView() : _buildRegistrationFormView(),
          ),
        ),
      ),
    );
  }

  Widget _buildRegistrationFormView() {
    return Column(
      children: [
        // App Bar Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              IconButton.filled(
                onPressed: () => Navigator.of(context).pop(),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF0F172A),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: Icon(_isArabic ? Icons.arrow_forward_rounded : Icons.arrow_back_rounded),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Center(
                  child: RichText(
                    text: const TextSpan(
                      style: TextStyle(color: Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.8),
                      children: [
                        TextSpan(text: 'KBI'),
                        TextSpan(text: '.', style: TextStyle(color: Color(0xFF0D67E8))),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: () => widget.onLocaleChanged(Locale(_isArabic ? 'en' : 'ar')),
                style: TextButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF0F172A),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  minimumSize: const Size(54, 42),
                ),
                child: Text(_isArabic ? 'EN' : 'عربي', style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),

        // Scrollable Form Body
        Expanded(
          child: SingleChildScrollView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 30),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 580),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Title & Subtitle
                    Text(
                      _t('Join the KBI Network', 'انضم إلى شبكة فنيي KBI'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: -0.6),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _t('Create your profile to receive high-value service orders.', 'أنشئ حسابك المهني وابدأ في استقبال طلبات الصيانة.'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13.5, color: Color(0xFF64748B), height: 1.4),
                    ),
                    const SizedBox(height: 22),

                    // Account Type Toggle Card
                    _buildAccountTypeToggle(),
                    const SizedBox(height: 22),

                    // Main Form Card
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 20),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFFCA5A5)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 20),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      _errorMessage!,
                                      style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // 1. Account Details Section
                          _buildSectionHeading(_t('1. Account Information', '1. معلومات الحساب'), Icons.person_outline_rounded),
                          const SizedBox(height: 14),

                          if (_accountType == 'employee') ...[
                            _buildInput(
                              controller: _empName,
                              label: _t('Full Name *', 'الاسم الكامل *'),
                              icon: Icons.badge_outlined,
                            ),
                            _buildInput(
                              controller: _empEmail,
                              label: _t('Email Address *', 'البريد الإلكتروني *'),
                              icon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            _buildInput(
                              controller: _empPhone,
                              label: _t('Mobile Number *', 'رقم الهاتف المتحرك *'),
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              hint: '+971 50 000 0000',
                            ),
                          ] else ...[
                            _buildInput(
                              controller: _compName,
                              label: _t('Company Name *', 'اسم الشركة *'),
                              icon: Icons.business_outlined,
                            ),
                            _buildInput(
                              controller: _compEmail,
                              label: _t('Company Email *', 'البريد الإلكتروني للشركة *'),
                              icon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            _buildInput(
                              controller: _compPhone,
                              label: _t('Company Phone *', 'هاتف الشركة *'),
                              icon: Icons.phone_outlined,
                              keyboardType: TextInputType.phone,
                              hint: '+971 4 000 0000',
                            ),
                            _buildInput(
                              controller: _compOwnerName,
                              label: _t('Manager / Owner Name *', 'اسم المدير / المالك *'),
                              icon: Icons.person_pin_outlined,
                            ),
                            _buildInput(
                              controller: _compTradeLicenseNum,
                              label: _t('Trade License Number *', 'رقم الرخصة التجارية *'),
                              icon: Icons.receipt_long_outlined,
                            ),
                          ],

                          // Passwords
                          _buildInput(
                            controller: _password,
                            label: _t('Password *', 'كلمة المرور *'),
                            icon: Icons.lock_outline_rounded,
                            obscureText: _obscurePassword,
                            suffixIcon: IconButton(
                              icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: const Color(0xFF64748B)),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          _buildInput(
                            controller: _confirmPassword,
                            label: _t('Confirm Password *', 'تأكيد كلمة المرور *'),
                            icon: Icons.lock_clock_outlined,
                            obscureText: _obscureConfirmPassword,
                            suffixIcon: IconButton(
                              icon: Icon(_obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: const Color(0xFF64748B)),
                              onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                            ),
                          ),

                          const SizedBox(height: 16),
                          const Divider(color: Color(0xFFF1F5F9), thickness: 1.5),
                          const SizedBox(height: 16),

                          // 2. Service & Location Profile
                          _buildSectionHeading(_t('2. Service & Coverage', '2. الخدمات ونطاق التغطية'), Icons.build_circle_outlined),
                          const SizedBox(height: 14),

                          // Services / Specialization Chips
                          Text(
                            _t('Specializations / Services Offered *', 'التخصصات والخدمات المقدمة *'),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF334155)),
                          ),
                          const SizedBox(height: 8),
                          _buildSpecializationChips(),
                          const SizedBox(height: 16),

                          // Emirate & Area
                          Row(
                            children: [
                              Expanded(
                                child: _buildDropdown(
                                  label: _t('Emirate *', 'الإمارة *'),
                                  value: _accountType == 'employee' ? _empEmirate : _compEmirate,
                                  items: const ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
                                  onChanged: (v) {
                                    if (v != null) {
                                      setState(() {
                                        if (_accountType == 'employee') {
                                          _empEmirate = v;
                                        } else {
                                          _compEmirate = v;
                                        }
                                      });
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildDropdown(
                                  label: _accountType == 'employee' ? _t('Experience *', 'الخبرة *') : _t('Techs Count *', 'عدد الفنيين *'),
                                  value: _accountType == 'employee' ? _empExperience : _compNumTechs,
                                  items: _accountType == 'employee'
                                      ? const ['1-2 Years', '3-5 Years', '5-10 Years', '10+ Years']
                                      : const ['1-5', '6-10', '11-20', '21-50', '50+'],
                                  onChanged: (v) {
                                    if (v != null) {
                                      setState(() {
                                        if (_accountType == 'employee') {
                                          _empExperience = v;
                                        } else {
                                          _compNumTechs = v;
                                        }
                                      });
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildInput(
                            controller: _accountType == 'employee' ? _empArea : _compAreasCovered,
                            label: _t('Specific Areas Covered *', 'المناطق التي تغطيها *'),
                            icon: Icons.location_on_outlined,
                            hint: _t('e.g. Downtown, Marina, Business Bay', 'مثال: وسط المدينة، مارينا، الخليج التجاري'),
                          ),

                          const SizedBox(height: 16),
                          const Divider(color: Color(0xFFF1F5F9), thickness: 1.5),
                          const SizedBox(height: 16),

                          // 3. Document Verification
                          _buildSectionHeading(_t('3. Documents & Verification', '3. المستندات والتحقق'), Icons.verified_user_outlined),
                          const SizedBox(height: 14),

                          if (_accountType == 'employee') ...[
                            _buildUploadCard(
                              label: _t('Emirates ID (Front / Back)', 'بطاقة الهوية الإماراتية'),
                              keyName: 'emp_emirates_id',
                              url: _empEmiratesIdUrl,
                            ),
                            const SizedBox(height: 10),
                            _buildUploadCard(
                              label: _t('Personal Profile Photo', 'الصورة الشخصية'),
                              keyName: 'emp_profile_photo',
                              url: _empProfilePhotoUrl,
                            ),
                          ] else ...[
                            _buildUploadCard(
                              label: _t('Trade License Copy', 'نسخة الرخصة التجارية'),
                              keyName: 'comp_trade_license',
                              url: _compTradeLicenseUrl,
                            ),
                            const SizedBox(height: 10),
                            _buildUploadCard(
                              label: _t('Company Logo / ID', 'شعار الشركة'),
                              keyName: 'comp_logo',
                              url: _compLogoUrl,
                            ),
                          ],

                          const SizedBox(height: 18),

                          // Terms agreement
                          Material(
                            type: MaterialType.transparency,
                            child: CheckboxListTile(
                              contentPadding: EdgeInsets.zero,
                              controlAffinity: ListTileControlAffinity.leading,
                              activeColor: const Color(0xFF0D67E8),
                              title: Text(
                                _t('I confirm all information is correct and agree to the KBI Partner Terms & Conditions.',
                                    'أقر بأن جميع البيانات صحيحة وأوافق على شروط وأحكام شبكة شركاء KBI.'),
                                style: const TextStyle(fontSize: 12.5, color: Color(0xFF334155), height: 1.35),
                              ),
                              value: _accountType == 'employee' ? _empAgreeTerms : _compAgreeTerms,
                              onChanged: (val) {
                                setState(() {
                                  if (_accountType == 'employee') {
                                    _empAgreeTerms = val ?? false;
                                  } else {
                                    _compAgreeTerms = val ?? false;
                                  }
                                });
                              },
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Submit Action Button
                          SizedBox(
                            height: 54,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _submitRegistration,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0D67E8),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: _loading
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                    )
                                  : FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            _t('Submit Application', 'تقديم طلب الانضمام'),
                                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                                          ),
                                          const SizedBox(width: 8),
                                          Icon(_isArabic ? Icons.arrow_back_rounded : Icons.arrow_forward_rounded, size: 20),
                                        ],
                                      ),
                                    ),
                            ),
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
      ],
    );
  }

  Widget _buildAccountTypeToggle() {
    final isEmp = _accountType == 'employee';
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _accountType = 'employee'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isEmp ? Colors.white : Colors.transparent,
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
                      color: isEmp ? const Color(0xFF0D67E8) : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          _t('Individual Tech', 'فني مستقل'),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isEmp ? FontWeight.w800 : FontWeight.w600,
                            color: isEmp ? const Color(0xFF0F172A) : const Color(0xFF64748B),
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
              onTap: () => setState(() => _accountType = 'company'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  color: !isEmp ? Colors.white : Colors.transparent,
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
                      color: !isEmp ? const Color(0xFF0D67E8) : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          _t('Company Tech', 'شركة صيانة'),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: !isEmp ? FontWeight.w800 : FontWeight.w600,
                            color: !isEmp ? const Color(0xFF0F172A) : const Color(0xFF64748B),
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
        Icon(icon, size: 20, color: const Color(0xFF0D67E8)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
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
            obscureText: obscureText,
            style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
            decoration: InputDecoration(
              labelText: label,
              hintText: hint,
              hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              labelStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF64748B)),
              prefixIcon: Icon(icon, size: 19, color: const Color(0xFF64748B)),
              suffixIcon: suffixIcon,
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFF0D67E8), width: 1.6),
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
      initialValue: value,
      items: items.map((item) => DropdownMenuItem(value: item, child: Text(item, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5)))).toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF64748B)),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF0D67E8), width: 1.6)),
      ),
    );
  }

  Widget _buildSpecializationChips() {
    final list = _accountType == 'employee' ? _empSpecializations : _compServices;
    const options = [
      'Mobile Repair',
      'Laptop Repair',
      'Printer Repair',
      'TV Repair',
      'Gaming Console',
      'CCTV',
      'Network & IT',
      'Apple Devices',
      'Android Devices',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) {
        final selected = list.contains(opt);
        return FilterChip(
          label: Text(opt),
          selected: selected,
          onSelected: (val) {
            setState(() {
              if (val) {
                list.add(opt);
              } else {
                if (list.length > 1) list.remove(opt);
              }
            });
          },
          selectedColor: const Color(0xFF0D67E8).withValues(alpha: 0.12),
          checkmarkColor: const Color(0xFF0D67E8),
          backgroundColor: const Color(0xFFF8FAFC),
          side: BorderSide(color: selected ? const Color(0xFF0D67E8) : const Color(0xFFE2E8F0)),
          labelStyle: TextStyle(
            fontSize: 12.5,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? const Color(0xFF0D67E8) : const Color(0xFF475569),
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        );
      }).toList(),
    );
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
          color: hasFile ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasFile ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
            style: BorderStyle.solid,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: hasFile ? const Color(0xFFDCFCE7) : const Color(0xFFE2E8F0),
                shape: BoxShape.circle,
              ),
              child: Icon(
                hasFile ? Icons.check_circle_rounded : Icons.upload_file_rounded,
                size: 20,
                color: hasFile ? const Color(0xFF16A34A) : const Color(0xFF64748B),
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
                      color: hasFile ? const Color(0xFF15803D) : const Color(0xFF334155),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isUploading
                        ? _t('Uploading...', 'جارٍ الرفع...')
                        : (hasFile ? (fileName ?? _t('Document attached', 'المستند مرفق')) : _t('Tap to upload PDF, PNG or JPG', 'اضغط لرفع ملف PDF أو صورة')),
                    style: TextStyle(
                      fontSize: 11.5,
                      color: hasFile ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
            if (isUploading)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0D67E8)),
              )
            else
              Text(
                hasFile ? _t('Change', 'تغيير') : _t('Browse', 'استعراض'),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF0D67E8)),
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
