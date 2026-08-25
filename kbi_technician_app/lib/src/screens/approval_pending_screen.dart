import 'dart:async';
import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:geolocator/geolocator.dart';
import '../i18n.dart';
import '../services/storage_service.dart';
import '../services/technician_service.dart';
import 'request_received_screen.dart';

ImageProvider? _safeImageProvider(String? urlOrData) {
  if (urlOrData == null || urlOrData.trim().isEmpty) return null;
  final clean = urlOrData.trim();
  if (clean.startsWith('data:image')) {
    try {
      final commaIndex = clean.indexOf(',');
      if (commaIndex != -1) {
        final bytes = base64Decode(clean.substring(commaIndex + 1));
        return MemoryImage(bytes);
      }
    } catch (_) {
      return null;
    }
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return NetworkImage(clean);
  }
  return null;
}

class ApprovalPendingScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const ApprovalPendingScreen(
      {super.key, required this.onLocaleChanged, required this.locale});

  @override
  State<ApprovalPendingScreen> createState() => _ApprovalPendingScreenState();
}

class _ApprovalPendingScreenState extends State<ApprovalPendingScreen> {
  int _currentStep = 0;
  bool _loading = false;
  String? _error;
  bool _draftLoaded = false;

  // Step 1: Personal Info
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _whatsapp = TextEditingController();
  final _email = TextEditingController();
  final _nationality = TextEditingController();
  final _dob = TextEditingController();
  String _gender = 'Male';
  final List<String> _selectedLanguages = ['English'];
  final _langInput = TextEditingController();
  String? _profilePhotoUrl;
  bool _phoneVerified = false;
  bool _phoneVerifying = false;
  bool _photoUploading = false;
  double _photoUploadProgress = 0.0;

  // Step 2: Professional Info
  String _mainSkill = 'Mobile Phone Repair';
  final List<String> _selectedSubSkills = [];
  String _experience = '1–3 years';
  String _employmentType = 'Freelancer';
  bool _ownVehicle = false;
  bool _ownTools = false;
  bool _canWorkOnsite = true;
  final List<String> _availableDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ];
  final _startTime = TextEditingController(text: '09:00');
  final _endTime = TextEditingController(text: '18:00');

  // Step 3: Service Areas
  final List<String> _selectedAreas = [];
  final _latitude = TextEditingController();
  final _longitude = TextEditingController();
  bool _gpsDetecting = false;

  // Step 4: Documents (Simulated Upload Progress)
  String? _emiratesIdUrl;
  String? _passportUrl;
  String? _visaUrl;
  String? _cvUrl;
  String? _drivingLicenseUrl;
  String? _certificateUrl;
  final Map<String, double> _uploadProgress = {};
  final Map<String, bool> _uploading = {};

  // Step 5: Bank details
  String _paymentMethod = 'Cash'; // 'Bank Transfer' or 'Cash'
  final _bankName = TextEditingController();
  final _iban = TextEditingController();
  final _accountHolder = TextEditingController();

  // Step 6: Agreements
  bool _agreeTerms = false;
  bool _agreeCommission = false;
  bool _agreeBehavior = false;
  bool _understandApproval = false;

  final Map<String, List<String>> _subSkillsMapping = {
    'Mobile Phone Repair': ['iPhone', 'Samsung', 'Huawei', 'Xiaomi', 'OnePlus'],
    'Laptop Repair': ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple'],
    'Computer Repair': ['Desktop PC', 'iMac', 'Mac Mini', 'All-in-One'],
    'Printer Repair': ['HP', 'Canon', 'Epson', 'Brother', 'Ricoh'],
    'Apple Watch Repair': ['Series 3/4/5', 'Series 6/7/8', 'SE', 'Ultra'],
    'TV Installation': ['Wall Mount', 'Table Stand', 'Projector', 'Soundbar'],
    'CCTV Installation': [
      'IP Camera',
      'Analog Camera',
      'DVR/NVR',
      'PTZ Camera'
    ],
    'PlayStation Repair': ['PS4', 'PS5', 'Controllers'],
    'Xbox Repair': ['Xbox One', 'Xbox Series X/S', 'Controllers'],
    'Networking': [
      'Router Configuration',
      'Switch Installation',
      'Cabling',
      'Access Points'
    ],
    'Smart Home': [
      'Ring Doorbell',
      'Smart Lights',
      'Smart Thermostat',
      'Smart Locks'
    ],
    'Other': ['General Diagnostics', 'Battery Replacement', 'Screen Repair'],
  };

  void _loadDraft(Map<String, dynamic> data) {
    if (_draftLoaded) return;
    _draftLoaded = true;

    // Load step index if saved
    _currentStep = data['draftStep'] ?? 0;

    // Step 1
    _name.text = data['full_name'] ?? '';
    _phone.text = data['phone'] ?? '';
    _whatsapp.text = data['whatsapp'] ?? '';
    _email.text = data['email'] ?? '';
    _nationality.text = data['nationality'] ?? '';
    _dob.text = data['dob'] ?? '';
    _gender = data['gender'] ?? 'Male';
    if (data['languages'] != null) {
      _selectedLanguages.clear();
      _selectedLanguages.addAll(List<String>.from(data['languages']));
    } else if (data['language'] != null) {
      _selectedLanguages.clear();
      _selectedLanguages.add(data['language']);
    }
    _profilePhotoUrl = data['profile_photo'];
    _phoneVerified = data['phoneVerified'] ?? false;

    // Step 2
    _mainSkill = data['experience_main_skill'] ?? 'Mobile Phone Repair';
    if (data['skills'] != null) {
      _selectedSubSkills.clear();
      _selectedSubSkills.addAll(List<String>.from(data['skills']));
    }
    _experience = data['experience'] ?? '1–3 years';
    _employmentType = data['employment_type'] ?? 'Freelancer';
    _ownVehicle = data['vehicle'] == true;
    _ownTools = data['tools'] == true;
    _canWorkOnsite = data['onsite'] == true;
    if (data['availability'] != null && data['availability']['days'] != null) {
      _availableDays.clear();
      _availableDays.addAll(List<String>.from(data['availability']['days']));
    }
    if (data['availability'] != null) {
      _startTime.text = data['availability']['start_time'] ?? '09:00';
      _endTime.text = data['availability']['end_time'] ?? '18:00';
    }

    // Step 3
    if (data['service_areas'] != null) {
      _selectedAreas.clear();
      _selectedAreas.addAll(List<String>.from(data['service_areas']));
    }
    _latitude.text = data['latitude']?.toString() ?? '';
    _longitude.text = data['longitude']?.toString() ?? '';

    // Step 4
    if (data['documents'] != null) {
      _emiratesIdUrl = data['documents']['emirates_id'];
      _passportUrl = data['documents']['passport'];
      _visaUrl = data['documents']['visa'];
      _cvUrl = data['documents']['cv'];
      _drivingLicenseUrl = data['documents']['driving_license'];
      _certificateUrl = data['documents']['certificate'];
    }

    // Step 5
    if (data['bank_details'] != null) {
      _paymentMethod = data['bank_details']['method'] ?? 'Cash';
      _bankName.text = data['bank_details']['bank_name'] ?? '';
      _iban.text = data['bank_details']['iban'] ?? '';
      _accountHolder.text = data['bank_details']['account_holder'] ?? '';
    }
  }

  Map<String, dynamic> _buildPayload(String status) {
    return {
      'full_name': _name.text.trim(),
      'phone': _phone.text.trim(),
      'whatsapp': _whatsapp.text.trim(),
      'email': _email.text.trim(),
      'nationality': _nationality.text.trim(),
      'dob': _dob.text.trim(),
      'gender': _gender,
      'languages': _selectedLanguages,
      'language': _selectedLanguages.join(', '),
      'profile_photo': _profilePhotoUrl,
      'phoneVerified': _phoneVerified,
      'experience_main_skill':
          _selectedSubSkills.isNotEmpty ? _selectedSubSkills.first : _mainSkill,
      'skills': _selectedSubSkills,
      'experience': _experience,
      'employment_type': _employmentType,
      'vehicle': _ownVehicle,
      'tools': _ownTools,
      'onsite': _canWorkOnsite,
      'availability': {
        'days': _availableDays,
        'start_time': _startTime.text,
        'end_time': _endTime.text,
      },
      'service_areas': _selectedAreas,
      'latitude': double.tryParse(_latitude.text),
      'longitude': double.tryParse(_longitude.text),
      'documents': {
        'emirates_id': _emiratesIdUrl,
        'passport': _passportUrl,
        'visa': _visaUrl,
        'cv': _cvUrl,
        'driving_license': _drivingLicenseUrl,
        'certificate': _certificateUrl,
      },
      'bank_details': {
        'method': _paymentMethod,
        'bank_name': _bankName.text.trim(),
        'iban': _iban.text.trim(),
        'account_holder': _accountHolder.text.trim(),
      },
      'status': status,
      'draftStep': _currentStep,
    };
  }

  Future<void> _saveDraft() async {
    try {
      final payload = _buildPayload('draft');
      await TechnicianService.instance.registerTechnician(payload);
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_agreeTerms ||
        !_agreeCommission ||
        !_agreeBehavior ||
        !_understandApproval) {
      setState(() {
        _error = 'Please accept all agreements to continue.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final payload = _buildPayload('pending');
      await TechnicianService.instance.registerTechnician(payload);
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 15)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Colors.cyan,
              onPrimary: Colors.black,
              surface: Color(0xF2FFFFFF),
              onSurface: Colors.black,
            ),
            dialogTheme:
                const DialogThemeData(backgroundColor: Color(0xF2FFFFFF)),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final day = picked.day.toString().padLeft(2, '0');
      final month = picked.month.toString().padLeft(2, '0');
      final year = picked.year;
      setState(() {
        _dob.text = '$day-$month-$year';
      });
      _saveDraft();
    }
  }

  Future<String?> _promptForOtp() async {
    final otp = TextEditingController();
    final code = await showDialog<String>(
      context: context,
      builder: (context) {
        String? err;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xF2FFFFFF),
              title: const Text('Verify Phone Number',
                  style: TextStyle(color: Colors.black)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                      'Enter the 6-digit code sent by Firebase to your phone.',
                      style: TextStyle(color: Colors.black87)),
                  const SizedBox(height: 14),
                  TextField(
                    controller: otp,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: '6-Digit OTP',
                      errorText: err,
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final value = otp.text.trim();
                    if (RegExp(r'^\d{6}$').hasMatch(value)) {
                      Navigator.pop(context, value);
                    } else {
                      setDialogState(() {
                        err = 'Enter the complete 6-digit code.';
                      });
                    }
                  },
                  child: const Text('Verify'),
                )
              ],
            );
          },
        );
      },
    );
    otp.dispose();
    return code;
  }

  Future<void> _verifyOtp() async {
    final phone = _phone.text.trim();
    if (!RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(phone)) {
      setState(() => _error =
          'Enter the mobile number in international format, for example +971501234567.');
      return;
    }

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() => _error = 'Your session expired. Please sign in again.');
      return;
    }
    if (user.phoneNumber == phone) {
      setState(() => _phoneVerified = true);
      await _saveDraft();
      return;
    }

    setState(() {
      _phoneVerifying = true;
      _error = null;
    });
    try {
      if (kIsWeb) {
        final confirmation = await user.linkWithPhoneNumber(phone);
        if (!mounted) return;
        final code = await _promptForOtp();
        if (code == null) return;
        await confirmation.confirm(code);
      } else {
        final credentialCompleter = Completer<PhoneAuthCredential>();
        await FirebaseAuth.instance.verifyPhoneNumber(
          phoneNumber: phone,
          verificationCompleted: (credential) {
            if (!credentialCompleter.isCompleted) {
              credentialCompleter.complete(credential);
            }
          },
          verificationFailed: (error) {
            if (!credentialCompleter.isCompleted) {
              credentialCompleter.completeError(error);
            }
          },
          codeSent: (verificationId, _) async {
            if (!mounted) return;
            final code = await _promptForOtp();
            if (credentialCompleter.isCompleted) return;
            if (code == null) {
              credentialCompleter.completeError(
                  StateError('Phone verification was cancelled.'));
            } else {
              credentialCompleter.complete(
                PhoneAuthProvider.credential(
                    verificationId: verificationId, smsCode: code),
              );
            }
          },
          codeAutoRetrievalTimeout: (_) {},
        );
        await user.linkWithCredential(await credentialCompleter.future);
      }
      if (mounted) {
        setState(() => _phoneVerified = true);
        await _saveDraft();
      }
    } on FirebaseAuthException catch (error) {
      if (mounted) {
        setState(() => _error = error.message ?? 'Phone verification failed.');
      }
    } catch (error) {
      if (mounted && error is! StateError) {
        setState(() => _error = 'Phone verification failed: $error');
      }
    } finally {
      if (mounted) setState(() => _phoneVerifying = false);
    }
  }

  void _pickPhoto() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: true,
      );
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _photoUploading = true;
          _photoUploadProgress = 0.0;
        });

        final file = result.files.first;
        final bytes = file.bytes;
        if (bytes == null) {
          throw const FormatException('Unable to read the selected photo.');
        }
        final downloadUrl = await StorageService.instance.uploadTechnicianFile(
          category: 'profile',
          fileName: file.name,
          bytes: bytes,
        );

        if (mounted) {
          setState(() {
            _profilePhotoUrl = downloadUrl;
            _photoUploading = false;
            _photoUploadProgress = 1;
          });
          _saveDraft();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _photoUploading = false;
          _error = 'Photo upload failed: $e';
        });
      }
    }
  }

  void _pickDocument(String docKey) async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
        withData: true,
      );
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _uploading[docKey] = true;
          _uploadProgress[docKey] = 0.0;
        });

        final file = result.files.first;
        final bytes = file.bytes;
        if (bytes == null) {
          throw const FormatException('Unable to read the selected document.');
        }
        final downloadUrl = await StorageService.instance.uploadTechnicianFile(
          category: 'documents/$docKey',
          fileName: file.name,
          bytes: bytes,
        );

        if (mounted) {
          setState(() {
            _uploading[docKey] = false;
            _uploadProgress[docKey] = 1;
            if (docKey == 'emirates_id') _emiratesIdUrl = downloadUrl;
            if (docKey == 'passport') _passportUrl = downloadUrl;
            if (docKey == 'visa') _visaUrl = downloadUrl;
            if (docKey == 'cv') _cvUrl = downloadUrl;
            if (docKey == 'driving_license') _drivingLicenseUrl = downloadUrl;
            if (docKey == 'certificate') _certificateUrl = downloadUrl;
          });
          _saveDraft();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _uploading[docKey] = false;
          _error = 'Document upload failed: $e';
        });
      }
    }
  }

  void _detectGps() async {
    setState(() {
      _gpsDetecting = true;
      _error = null;
    });

    try {
      bool serviceEnabled;
      LocationPermission permission;

      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw 'Location services are disabled on this device.';
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw 'Location permissions are denied by the user.';
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw 'Location permissions are permanently denied in settings.';
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );

      if (mounted) {
        setState(() {
          _latitude.text = position.latitude.toStringAsFixed(6);
          _longitude.text = position.longitude.toStringAsFixed(6);
          _gpsDetecting = false;
        });
        _saveDraft();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _gpsDetecting = false;
          _error = 'Location Error: $e';
        });
      }
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _whatsapp.dispose();
    _email.dispose();
    _nationality.dispose();
    _dob.dispose();
    _startTime.dispose();
    _endTime.dispose();
    _latitude.dispose();
    _longitude.dispose();
    _bankName.dispose();
    _iban.dispose();
    _accountHolder.dispose();
    _langInput.dispose();
    super.dispose();
  }

  Widget _buildStepHeader() {
    final steps = [
      'Personal',
      'Skills',
      'Areas',
      'Verify',
      'Payout',
      'Confirm'
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(steps.length, (index) {
              final active = index == _currentStep;
              final completed = index < _currentStep;
              return Expanded(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: active
                          ? Theme.of(context).colorScheme.primary
                          : completed
                              ? Colors.green
                              : Colors.black12,
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: active || completed
                              ? Colors.black
                              : Colors.black54,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    if (index < steps.length - 1)
                      Expanded(
                        child: Container(
                          height: 2,
                          color: completed ? Colors.green : Colors.black12,
                        ),
                      )
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 6),
          Text(
            'Step ${_currentStep + 1}: ${steps[_currentStep]}',
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: Colors.cyanAccent),
          )
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStep1();
      case 1:
        return _buildStep2();
      case 2:
        return _buildStep3();
      case 3:
        return _buildStep4();
      case 4:
        return _buildStep5();
      case 5:
        return _buildStep6();
      default:
        return Container();
    }
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: GestureDetector(
            onTap: _photoUploading ? null : _pickPhoto,
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: const Color(0xF2FFFFFF),
                  backgroundImage: _safeImageProvider(_profilePhotoUrl),
                  child: _safeImageProvider(_profilePhotoUrl) == null
                      ? _photoUploading
                          ? CircularProgressIndicator(
                              value: _photoUploadProgress)
                          : const Icon(Icons.add_a_photo,
                              color: Colors.cyan, size: 28)
                      : null,
                ),
                const SizedBox(height: 8),
                const Text('Choose Profile Photo *',
                    style: TextStyle(fontSize: 12, color: Colors.black54)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text('Contact Information',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Full Name *')),
              const SizedBox(height: 12),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                onChanged: (_) {
                  if (_phoneVerified) setState(() => _phoneVerified = false);
                },
                decoration: InputDecoration(
                  labelText: 'Mobile Number *',
                  hintText: '+971501234567',
                  suffixIcon: _phoneVerified
                      ? const Icon(Icons.verified, color: Colors.green)
                      : TextButton(
                          onPressed: _phoneVerifying ? null : _verifyOtp,
                          child: _phoneVerifying
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Verify'),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                  controller: _whatsapp,
                  keyboardType: TextInputType.phone,
                  decoration:
                      const InputDecoration(labelText: 'WhatsApp Number *')),
              const SizedBox(height: 12),
              TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration:
                      const InputDecoration(labelText: 'Email Address *')),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text('Identity & Preferences',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              TextField(
                  controller: _nationality,
                  decoration:
                      const InputDecoration(labelText: 'Nationality *')),
              const SizedBox(height: 12),
              TextField(
                controller: _dob,
                readOnly: true,
                onTap: () => _selectDate(context),
                decoration: const InputDecoration(
                  labelText: 'Date of Birth *',
                  suffixIcon: Icon(Icons.calendar_today, size: 18),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _gender,
                decoration: const InputDecoration(labelText: 'Gender'),
                dropdownColor: const Color(0xF2FFFFFF),
                items: const [
                  DropdownMenuItem(value: 'Male', child: Text('Male')),
                  DropdownMenuItem(value: 'Female', child: Text('Female')),
                  DropdownMenuItem(value: 'Other', child: Text('Other')),
                ],
                onChanged: (v) => setState(() => _gender = v!),
              ),
              const SizedBox(height: 12),
              const Text('Languages Spoken *',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.black54)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _langInput,
                      decoration: const InputDecoration(
                        labelText: 'Add Language (e.g. Urdu, French)',
                        prefixIcon: Icon(Icons.language, size: 18),
                      ),
                      onSubmitted: (val) {
                        final v = val.trim();
                        if (v.isNotEmpty && !_selectedLanguages.contains(v)) {
                          setState(() {
                            _selectedLanguages.add(v);
                            _langInput.clear();
                          });
                          _saveDraft();
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      final v = _langInput.text.trim();
                      if (v.isNotEmpty && !_selectedLanguages.contains(v)) {
                        setState(() {
                          _selectedLanguages.add(v);
                          _langInput.clear();
                        });
                        _saveDraft();
                      }
                    },
                    child: const Text('Add'),
                  )
                ],
              ),
              const SizedBox(height: 12),
              if (_selectedLanguages.isNotEmpty) ...[
                Wrap(
                  spacing: 8.0,
                  runSpacing: 8.0,
                  children: _selectedLanguages.map((lang) {
                    return InputChip(
                      label: Text(lang),
                      onDeleted: () {
                        setState(() {
                          _selectedLanguages.remove(lang);
                        });
                        _saveDraft();
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
              ],
              const Text('Suggestions:',
                  style: TextStyle(fontSize: 11, color: Colors.black45)),
              const SizedBox(height: 4),
              Wrap(
                spacing: 6.0,
                runSpacing: 6.0,
                children: ['English', 'Arabic', 'Urdu', 'Hindi', 'Tagalog']
                    .map((lang) {
                  final contains = _selectedLanguages.contains(lang);
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (contains) {
                          _selectedLanguages.remove(lang);
                        } else {
                          _selectedLanguages.add(lang);
                        }
                      });
                      _saveDraft();
                    },
                    child: Chip(
                      label: Text(lang,
                          style: TextStyle(
                              fontSize: 11,
                              color: contains ? Colors.black : Colors.black87)),
                      backgroundColor:
                          contains ? Colors.cyan : const Color(0xFF0F141C),
                      padding: EdgeInsets.zero,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Weekly availability',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.black87),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: const [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map((day) {
                  return FilterChip(
                    label: Text(day.substring(0, 3)),
                    selected: _availableDays.contains(day),
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          _availableDays.add(day);
                        } else {
                          _availableDays.remove(day);
                        }
                      });
                      _saveDraft();
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _startTime,
                      decoration:
                          const InputDecoration(labelText: 'Start (HH:mm)'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _endTime,
                      decoration:
                          const InputDecoration(labelText: 'End (HH:mm)'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    final categories = _subSkillsMapping.keys.toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Skills (Choose one or more) *',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Wrap(
            spacing: 8.0,
            runSpacing: 8.0,
            children: categories.map((cat) {
              final isSel = _selectedSubSkills.contains(cat);
              return FilterChip(
                label: Text(cat, style: const TextStyle(fontSize: 13)),
                selected: isSel,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedSubSkills.add(cat);
                    } else {
                      _selectedSubSkills.remove(cat);
                    }
                  });
                  _saveDraft();
                },
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 20),
        const Text('Professional Experience',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                initialValue: _experience,
                decoration:
                    const InputDecoration(labelText: 'Years of Experience'),
                dropdownColor: const Color(0xF2FFFFFF),
                items: const [
                  DropdownMenuItem(
                      value: 'Less than 1 year',
                      child: Text('Less than 1 year')),
                  DropdownMenuItem(
                      value: '1–3 years', child: Text('1–3 years')),
                  DropdownMenuItem(
                      value: '3–5 years', child: Text('3–5 years')),
                  DropdownMenuItem(
                      value: '5–10 years', child: Text('5–10 years')),
                  DropdownMenuItem(
                      value: '10+ years', child: Text('10+ years')),
                ],
                onChanged: (v) => setState(() => _experience = v!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _employmentType,
                decoration: const InputDecoration(labelText: 'Employment Type'),
                dropdownColor: const Color(0xF2FFFFFF),
                items: const [
                  DropdownMenuItem(
                      value: 'Full Time', child: Text('Full Time')),
                  DropdownMenuItem(
                      value: 'Part Time', child: Text('Part Time')),
                  DropdownMenuItem(
                      value: 'Freelancer', child: Text('Freelancer')),
                ],
                onChanged: (v) => setState(() => _employmentType = v!),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Text('Preferences & Equipment',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Owns a Vehicle',
                    style: TextStyle(fontSize: 14)),
                value: _ownVehicle,
                onChanged: (v) => setState(() => _ownVehicle = v),
              ),
              const Divider(height: 1, color: Colors.black12),
              SwitchListTile(
                title: const Text('Owns Repair Tools',
                    style: TextStyle(fontSize: 14)),
                value: _ownTools,
                onChanged: (v) => setState(() => _ownTools = v),
              ),
              const Divider(height: 1, color: Colors.black12),
              SwitchListTile(
                title: const Text('Can Work On-site',
                    style: TextStyle(fontSize: 14)),
                value: _canWorkOnsite,
                onChanged: (v) => setState(() => _canWorkOnsite = v),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep3() {
    final areas = [
      'Abu Dhabi',
      'Al Reem Island',
      'Khalifa City',
      'MBZ City',
      'Mussafah',
      'Yas Island',
      'Al Raha',
      'Saadiyat',
      'Baniyas',
      'Al Ain'
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Service Areas Covered',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Wrap(
            spacing: 8.0,
            runSpacing: 8.0,
            children: areas.map((area) {
              final isSel = _selectedAreas.contains(area);
              return FilterChip(
                label: Text(area, style: const TextStyle(fontSize: 13)),
                selected: isSel,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedAreas.add(area);
                    } else {
                      _selectedAreas.remove(area);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),
        const Text('GPS Location Coordinates',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                      child: TextField(
                          controller: _latitude,
                          readOnly: true,
                          decoration:
                              const InputDecoration(labelText: 'Latitude'))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: TextField(
                          controller: _longitude,
                          readOnly: true,
                          decoration:
                              const InputDecoration(labelText: 'Longitude'))),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _gpsDetecting ? null : _detectGps,
                  icon: _gpsDetecting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.my_location, size: 18),
                  label: const Text('Detect GPS Location'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDocRow(String label, String? url, String docKey, bool required) {
    final isUploading = _uploading[docKey] == true;
    final progress = _uploadProgress[docKey] ?? 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$label${required ? ' *' : ''}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              if (url != null)
                const Icon(Icons.check_circle, color: Colors.green)
              else
                ElevatedButton(
                  onPressed: isUploading ? null : () => _pickDocument(docKey),
                  child: Text(isUploading ? 'Uploading' : 'Upload'),
                )
            ],
          ),
          if (isUploading) ...[
            const SizedBox(height: 6),
            LinearProgressIndicator(value: progress),
          ],
          const Divider(color: Colors.black12),
        ],
      ),
    );
  }

  Widget _buildStep4() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Upload Verification Documents',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              _buildDocRow(
                  'Emirates ID Copy *', _emiratesIdUrl, 'emirates_id', true),
              _buildDocRow('CV / Resume Copy *', _cvUrl, 'cv', true),
              _buildDocRow('Driving License (Optional)', _drivingLicenseUrl,
                  'driving_license', false),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep5() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Payout Option Settings',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                initialValue: _paymentMethod,
                decoration: const InputDecoration(labelText: 'Payment Method'),
                dropdownColor: const Color(0xF2FFFFFF),
                items: const [
                  DropdownMenuItem(value: 'Cash', child: Text('Cash Payout')),
                  DropdownMenuItem(
                      value: 'Bank Transfer', child: Text('Bank Transfer')),
                ],
                onChanged: (v) => setState(() => _paymentMethod = v!),
              ),
              if (_paymentMethod == 'Bank Transfer') ...[
                const SizedBox(height: 16),
                TextField(
                    controller: _bankName,
                    decoration:
                        const InputDecoration(labelText: 'Bank Name *')),
                const SizedBox(height: 12),
                TextField(
                    controller: _iban,
                    decoration:
                        const InputDecoration(labelText: 'IBAN Number *')),
                const SizedBox(height: 12),
                TextField(
                    controller: _accountHolder,
                    decoration: const InputDecoration(
                        labelText: 'Account Holder Name *')),
              ]
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep6() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Legal Agreements & Policies',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.cyanAccent)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(color: Colors.transparent),
          ),
          child: Column(
            children: [
              CheckboxListTile(
                title: const Text(
                    'I agree to the Terms & Conditions of KBI.Services',
                    style: TextStyle(fontSize: 13)),
                value: _agreeTerms,
                onChanged: (v) => setState(() => _agreeTerms = v ?? false),
              ),
              const Divider(height: 1, color: Colors.black12),
              CheckboxListTile(
                title: const Text('I agree to KBI.Services commission policy',
                    style: TextStyle(fontSize: 13)),
                value: _agreeCommission,
                onChanged: (v) => setState(() => _agreeCommission = v ?? false),
              ),
              const Divider(height: 1, color: Colors.black12),
              CheckboxListTile(
                title: const Text(
                    'I agree to maintain professional behavior at all times',
                    style: TextStyle(fontSize: 13)),
                value: _agreeBehavior,
                onChanged: (v) => setState(() => _agreeBehavior = v ?? false),
              ),
              const Divider(height: 1, color: Colors.black12),
              CheckboxListTile(
                title: const Text(
                    'I understand my account requires admin approval before receiving orders',
                    style: TextStyle(fontSize: 13)),
                value: _understandApproval,
                onChanged: (v) =>
                    setState(() => _understandApproval = v ?? false),
              ),
            ],
          ),
        ),
      ],
    );
  }

  bool _validateCurrentStep() {
    setState(() {
      _error = null;
    });
    if (_currentStep == 0) {
      if (_name.text.trim().isEmpty ||
          _phone.text.trim().isEmpty ||
          _whatsapp.text.trim().isEmpty ||
          _email.text.trim().isEmpty ||
          _nationality.text.trim().isEmpty ||
          _dob.text.trim().isEmpty ||
          _profilePhotoUrl == null) {
        setState(() => _error = 'Please fill all required fields (*).');
        return false;
      }
      if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_email.text.trim())) {
        setState(() => _error = 'Enter a valid email address.');
        return false;
      }
      if (!_phoneVerified) {
        setState(() => _error = 'Verify your mobile number before continuing.');
        return false;
      }
      if (_selectedLanguages.isEmpty) {
        setState(() => _error = 'Please select or add at least one language.');
        return false;
      }
    }
    if (_currentStep == 1) {
      if (_selectedSubSkills.isEmpty) {
        setState(() => _error = 'Please select at least one sub skill.');
        return false;
      }
      if (_availableDays.isEmpty ||
          !RegExp(r'^([01]\d|2[0-3]):[0-5]\d$')
              .hasMatch(_startTime.text.trim()) ||
          !RegExp(r'^([01]\d|2[0-3]):[0-5]\d$')
              .hasMatch(_endTime.text.trim())) {
        setState(() => _error =
            'Choose at least one day and enter availability as HH:mm.');
        return false;
      }
    }
    if (_currentStep == 2) {
      if (_selectedAreas.isEmpty) {
        setState(() => _error = 'Please select at least one service area.');
        return false;
      }
      if (_latitude.text.isEmpty || _longitude.text.isEmpty) {
        setState(() => _error = 'Please detect your GPS location coordinates.');
        return false;
      }
    }
    if (_currentStep == 3) {
      if (_emiratesIdUrl == null || _cvUrl == null) {
        setState(() => _error = 'Please upload all required files (*).');
        return false;
      }
    }
    if (_currentStep == 4) {
      if (_paymentMethod == 'Bank Transfer') {
        if (_bankName.text.isEmpty ||
            _iban.text.isEmpty ||
            _accountHolder.text.isEmpty) {
          setState(() => _error = 'Please fill out all bank transfer details.');
          return false;
        }
      }
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      return const Scaffold(body: Center(child: Text('Please log in')));
    }

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('technician_requests')
          .doc(uid)
          .snapshots(),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Scaffold(
              body: Center(child: CircularProgressIndicator()));
        }

        final data = snap.data?.data();
        final requestStatus = data?['status'];

        if (requestStatus != null && !_draftLoaded) {
          _loadDraft(data!);
        }

        // Show application success / request received page if pending
        if (requestStatus == 'pending' || requestStatus == null) {
          return RequestReceivedScreen(
            locale: widget.locale,
            onLocaleChanged: widget.onLocaleChanged,
          );
        }

        final isAr = widget.locale.languageCode == 'ar';
        return Directionality(
          textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Technician Registration'),
              actions: [
                DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: widget.locale.languageCode,
                    dropdownColor: const Color(0xF2FFFFFF),
                    items: const [
                      DropdownMenuItem(value: 'en', child: Text('EN')),
                      DropdownMenuItem(value: 'ar', child: Text('AR')),
                    ],
                    onChanged: (v) {
                      if (v == null) return;
                      widget.onLocaleChanged(Locale(v));
                    },
                  ),
                ),
                IconButton(
                  onPressed: () => FirebaseAuth.instance.signOut(),
                  icon: const Icon(Icons.logout),
                  tooltip: t(context, 'logout'),
                ),
              ],
            ),
            body: Center(
              child: SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildStepHeader(),
                            const SizedBox(height: 10),
                            const Divider(color: Colors.black12),
                            const SizedBox(height: 10),
                            _buildStepContent(),
                            if (_error != null) ...[
                              const SizedBox(height: 12),
                              Text(_error!,
                                  style:
                                      const TextStyle(color: Colors.redAccent)),
                            ],
                            const SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                if (_currentStep > 0)
                                  ElevatedButton(
                                    onPressed: () {
                                      setState(() {
                                        _currentStep--;
                                      });
                                    },
                                    child: const Text('Back'),
                                  )
                                else
                                  const SizedBox(),
                                ElevatedButton(
                                  onPressed: _loading
                                      ? null
                                      : () {
                                          if (_validateCurrentStep()) {
                                            if (_currentStep < 5) {
                                              setState(() {
                                                _currentStep++;
                                              });
                                              _saveDraft();
                                            } else {
                                              _submit();
                                            }
                                          }
                                        },
                                  child: _loading
                                      ? const SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2))
                                      : Text(
                                          _currentStep < 5 ? 'Next' : 'Submit'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
