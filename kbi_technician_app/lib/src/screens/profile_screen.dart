import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_config.dart';
import '../services/fcm_service.dart';
import '../services/storage_service.dart';
import '../services/technician_service.dart';
import '../theme.dart';
import '../utils/job_utils.dart';

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

class ProfileScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const ProfileScreen({
    super.key,
    required this.locale,
    required this.onLocaleChanged,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final Stream<DocumentSnapshot<Map<String, dynamic>>> _techStream;
  late final Stream<List<DocumentSnapshot<Map<String, dynamic>>>> _jobsStream;
  bool _notificationToggled = false;
  bool _notificationPreferenceLoaded = false;

  @override
  void initState() {
    super.initState();
    _techStream = TechnicianService.instance.watchMyTechDoc();
    _jobsStream = TechnicianService.instance.watchMyJobDocs();
  }

  @override
  void dispose() {
    super.dispose();
  }

  // List of all options for editing
  final List<String> _allSkills = [
    'Smartphone Repair',
    'Laptop Repair',
    'Desktop Repair',
    'Printer Repair',
    'TV Repair',
    'Gaming Console',
    'CCTV Installation',
    'Network & IT',
    'Apple Devices',
    'Android Devices',
  ];

  final List<String> _allAreas = [
    'Abu Dhabi City',
    'Khalifa City',
    'Mussafah',
    'MBZ City',
    'Al Reem Island',
    'Yas Island',
    'Saadiyat',
    'Al Raha',
    'Baniyas',
    'Shamkha',
  ];

  Future<void> _pickAndUploadPhoto() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    final isAr = widget.locale.languageCode == 'ar';
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                isAr ? 'تحديث الصورة الشخصية' : 'Update Profile Photo',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE0F2FE),
                  child:
                      Icon(Icons.camera_alt_rounded, color: Color(0xFF0284C7)),
                ),
                title: Text(
                    isAr ? 'التقاط صورة بالكاميرا' : 'Take a Photo (Camera)'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFDCFCE7),
                  child: Icon(Icons.photo_library_rounded,
                      color: Color(0xFF16A34A)),
                ),
                title:
                    Text(isAr ? 'اختيار من معرض الصور' : 'Choose from Gallery'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return;

    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (picked == null) return;

      final bytes = await picked.readAsBytes();
      if (bytes.isEmpty) return;

      String photoUrl;
      try {
        photoUrl = await StorageService.instance.uploadTechnicianFile(
          category: 'profile',
          fileName: picked.name.isNotEmpty ? picked.name : 'profile.jpg',
          bytes: bytes,
        );
      } catch (storageErr) {
        debugPrint('Firebase Storage notice, saving as data URI: $storageErr');
        photoUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      await FirebaseFirestore.instance.collection('technicians').doc(uid).set({
        'profile_photo': photoUrl,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(isAr
                ? 'تم تحديث الصورة بنجاح!'
                : 'Profile photo updated successfully!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not update photo: $e')),
        );
      }
    }
  }

  Future<void> _launchSupportUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    try {
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        throw 'Could not launch $urlString';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open client: $e')),
        );
      }
    }
  }

  Future<void> _setNotificationsEnabled(bool enabled) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    final previous = _notificationToggled;
    setState(() => _notificationToggled = enabled);

    try {
      if (enabled) {
        await FcmService.instance.enableForCurrentUser();
      } else {
        await FcmService.instance.disableForCurrentUser();
      }
      await FirebaseFirestore.instance.collection('technicians').doc(uid).set({
        'notificationsEnabled': enabled,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(enabled
                ? 'Notifications enabled successfully'
                : 'Notifications disabled'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (error) {
      if (!mounted) return;
      setState(() => _notificationToggled = previous);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to update notifications: $error')),
      );
    }
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete account permanently?'),
        content: const Text(
          'This removes your technician profile, registration data, device '
          'tokens, and login account. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Delete permanently'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      await FirebaseFunctions.instance
          .httpsCallable('technicianDeleteAccount')
          .call();
      await FirebaseAuth.instance.signOut();
    } on FirebaseFunctionsException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message ?? 'Account deletion failed.')),
      );
    }
  }

  // Edit Profile bottom sheet form trigger
  void _showEditProfileBottomSheet(Map<String, dynamic>? techData) {
    final nameController = TextEditingController(text: techData?['name'] ?? '');
    final phoneController =
        TextEditingController(text: techData?['phone'] ?? '');

    final vehicle = techData?['vehicle'] as Map<String, dynamic>?;
    String vehicleType = vehicle?['type'] ?? 'Motorcycle';
    final vehicleBrandController =
        TextEditingController(text: vehicle?['brand'] ?? '');
    final vehicleModelController =
        TextEditingController(text: vehicle?['model'] ?? '');
    final vehicleColorController =
        TextEditingController(text: vehicle?['color'] ?? '');
    final vehiclePlateController =
        TextEditingController(text: vehicle?['plateNumber'] ?? '');

    List<String> selectedSkills = List<String>.from(
        (techData?['skills'] as List?)?.map((e) => e.toString()) ?? []);
    List<String> selectedAreas = List<String>.from(
        (techData?['service_areas'] as List?)?.map((e) => e.toString()) ?? []);

    String? newProfilePhotoUrl = techData?['profile_photo'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xF2FFFFFF),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.85,
              maxChildSize: 0.95,
              minChildSize: 0.5,
              expand: false,
              builder: (context, scrollController) {
                return SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: const BoxDecoration(
                            color: Colors.black12,
                            borderRadius: BorderRadius.all(Radius.circular(24)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Edit Profile Information',
                        style: TextStyle(
                            color: Color(0xFF111318),
                            fontSize: 18,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 18),

                      // Avatar Selector
                      Center(
                        child: Stack(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFF111318),
                              ),
                              child: CircleAvatar(
                                radius: 50,
                                backgroundColor: const Color(0xF2FFFFFF),
                                backgroundImage:
                                    _safeImageProvider(newProfilePhotoUrl),
                                child: _safeImageProvider(newProfilePhotoUrl) ==
                                        null
                                    ? const Icon(Icons.person,
                                        size: 54, color: Colors.black12)
                                    : null,
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Material(
                                color: const Color(0xFF111318),
                                shape: const CircleBorder(),
                                child: InkWell(
                                  onTap: () async {
                                    final result = await FilePicker.pickFiles(
                                      type: FileType.image,
                                      allowMultiple: false,
                                      withData: true,
                                    );
                                    if (result != null &&
                                        result.files.isNotEmpty) {
                                      final file = result.files.first;
                                      final bytes = file.bytes;
                                      if (bytes == null) return;
                                      final downloadUrl = await StorageService
                                          .instance
                                          .uploadTechnicianFile(
                                        category: 'profile',
                                        fileName: file.name,
                                        bytes: bytes,
                                      );
                                      setModalState(() {
                                        newProfilePhotoUrl = downloadUrl;
                                      });
                                    }
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.all(8.0),
                                    child: Icon(
                                      Icons.camera_alt_rounded,
                                      color: Color(0xFF111318),
                                      size: 18,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Personal details inputs
                      _buildModalInput(
                          controller: nameController,
                          label: 'Full Name',
                          icon: Icons.person_outline),
                      _buildModalInput(
                          controller: phoneController,
                          label: 'Phone Number',
                          icon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone),

                      const SizedBox(height: 16),
                      const Text('Vehicle Information',
                          style: TextStyle(
                              color: Color(0xFF111318),
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                      const SizedBox(height: 12),

                      // Vehicle type selection
                      DropdownButtonFormField<String>(
                        initialValue: vehicleType,
                        decoration: const InputDecoration(
                          labelText: 'Vehicle Type',
                          labelStyle:
                              TextStyle(color: Colors.black54, fontSize: 13),
                          prefixIcon: Icon(Icons.directions_car_outlined,
                              color: Colors.black54, size: 18),
                          filled: true,
                          fillColor: Color(0xF2FFFFFF),
                          border: OutlineInputBorder(
                              borderRadius:
                                  BorderRadius.all(Radius.circular(24)),
                              borderSide: BorderSide.none),
                        ),
                        dropdownColor: const Color(0xF2FFFFFF),
                        style: const TextStyle(
                            color: Color(0xFF111318), fontSize: 14),
                        items: const [
                          DropdownMenuItem(value: 'Car', child: Text('🚗 Car')),
                          DropdownMenuItem(
                              value: 'Motorcycle',
                              child: Text('🏍 Motorcycle')),
                          DropdownMenuItem(
                              value: 'Walking', child: Text('🚶 Walking')),
                        ],
                        onChanged: (v) {
                          setModalState(() {
                            vehicleType = v!;
                          });
                        },
                      ),
                      const SizedBox(height: 12),

                      _buildModalInput(
                          controller: vehicleBrandController,
                          label: 'Vehicle Brand (e.g. Honda)',
                          icon: Icons.branding_watermark_outlined),
                      _buildModalInput(
                          controller: vehicleModelController,
                          label: 'Vehicle Model (e.g. CB150R)',
                          icon: Icons.motorcycle_outlined),
                      _buildModalInput(
                          controller: vehicleColorController,
                          label: 'Vehicle Color',
                          icon: Icons.color_lens_outlined),
                      _buildModalInput(
                          controller: vehiclePlateController,
                          label: 'Plate Number',
                          icon: Icons.pin_outlined),

                      const SizedBox(height: 16),
                      const Text('Skills & Specializations',
                          style: TextStyle(
                              color: Color(0xFF111318),
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _allSkills.map((skill) {
                          final isSel = selectedSkills.contains(skill);
                          return FilterChip(
                            label: Text(skill,
                                style: const TextStyle(fontSize: 12)),
                            selected: isSel,
                            selectedColor:
                                const Color(0xFF111318).withValues(alpha: 0.3),
                            checkmarkColor: const Color(0xFF111318),
                            backgroundColor: const Color(0xF2FFFFFF),
                            shape: RoundedRectangleBorder(
                                borderRadius:
                                    const BorderRadius.all(Radius.circular(24)),
                                side: BorderSide(
                                    color: isSel
                                        ? const Color(0xFF111318)
                                        : const Color(0xF2FFFFFF)
                                            .withValues(alpha: 0.05))),
                            onSelected: (selected) {
                              setModalState(() {
                                if (selected) {
                                  selectedSkills.add(skill);
                                } else {
                                  selectedSkills.remove(skill);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 24),
                      const Text('Service Areas Covered',
                          style: TextStyle(
                              color: Color(0xFF111318),
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _allAreas.map((area) {
                          final isSel = selectedAreas.contains(area);
                          return FilterChip(
                            label: Text(area,
                                style: const TextStyle(fontSize: 12)),
                            selected: isSel,
                            selectedColor:
                                const Color(0xFF111318).withValues(alpha: 0.3),
                            checkmarkColor: const Color(0xFF111318),
                            backgroundColor: const Color(0xF2FFFFFF),
                            shape: RoundedRectangleBorder(
                                borderRadius:
                                    const BorderRadius.all(Radius.circular(24)),
                                side: BorderSide(
                                    color: isSel
                                        ? const Color(0xFF111318)
                                        : const Color(0xF2FFFFFF)
                                            .withValues(alpha: 0.05))),
                            onSelected: (selected) {
                              setModalState(() {
                                if (selected) {
                                  selectedAreas.add(area);
                                } else {
                                  selectedAreas.remove(area);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 36),

                      // Submit Save Button
                      Container(
                        height: 52,
                        decoration: const BoxDecoration(
                          color: Color(0xFF111318),
                          borderRadius: BorderRadius.all(Radius.circular(20)),
                        ),
                        child: ElevatedButton(
                          onPressed: () async {
                            final uid = FirebaseAuth.instance.currentUser?.uid;
                            if (uid == null) return;

                            // Save profile to Firestore
                            await FirebaseFirestore.instance
                                .collection('technicians')
                                .doc(uid)
                                .set({
                              'name': nameController.text.trim(),
                              'phone': phoneController.text.trim(),
                              'profile_photo': newProfilePhotoUrl,
                              'skills': selectedSkills,
                              'service_areas': selectedAreas,
                              'vehicle': {
                                'type': vehicleType,
                                'brand': vehicleBrandController.text.trim(),
                                'model': vehicleModelController.text.trim(),
                                'color': vehicleColorController.text.trim(),
                                'plateNumber':
                                    vehiclePlateController.text.trim(),
                                'isVerified': vehicle?['isVerified'] == true,
                              },
                              'updatedAt': FieldValue.serverTimestamp(),
                            }, SetOptions(merge: true));

                            if (context.mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Profile saved successfully!')),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            shadowColor: Colors.black,
                            shape: const RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.all(Radius.circular(24))),
                          ),
                          child: const Text('Save Changes',
                              style: TextStyle(
                                  color: Color(0xFF111318),
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildModalInput({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(color: Color(0xFF111318), fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.black54, fontSize: 13),
          prefixIcon: Icon(icon, color: Colors.black54, size: 18),
          filled: true,
          fillColor: const Color(0xF2FFFFFF),
          border: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(24)),
              borderSide: BorderSide.none),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  // Logout Dialog Confirmation
  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xF2FFFFFF),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(24))),
          title:
              const Text('Log Out', style: TextStyle(color: Color(0xFF111318))),
          content: const Text('Are you sure you want to log out?',
              style: TextStyle(color: Colors.black)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child:
                  const Text('Cancel', style: TextStyle(color: Colors.black54)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                await FirebaseAuth.instance.signOut();
              },
              style:
                  ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
              child: const Text('Log Out',
                  style: TextStyle(color: Color(0xFF111318))),
            ),
          ],
        );
      },
    );
  }

  // Change Password Dialog Simulation
  void _showChangePasswordDialog() {
    final passController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xF2FFFFFF),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(24))),
          title: const Text('Change Password',
              style: TextStyle(color: Color(0xFF111318))),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Enter a new password (min. 6 characters):',
                  style: TextStyle(color: Colors.black)),
              const SizedBox(height: 12),
              TextField(
                controller: passController,
                obscureText: true,
                style: const TextStyle(color: Color(0xFF111318)),
                decoration: const InputDecoration(
                  labelText: 'New Password',
                  filled: true,
                  fillColor: Color(0xF2FFFFFF),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child:
                  const Text('Cancel', style: TextStyle(color: Colors.black54)),
            ),
            ElevatedButton(
              onPressed: () async {
                final user = FirebaseAuth.instance.currentUser;
                if (user != null && passController.text.length >= 6) {
                  try {
                    await user.updatePassword(passController.text);
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Password updated successfully!')),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  }
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final isAr = widget.locale.languageCode == 'ar';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: _techStream,
          builder: (context, techSnap) {
            if (techSnap.connectionState == ConnectionState.waiting &&
                !techSnap.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            if (techSnap.hasError) {
              return Center(
                child: Text(
                  'Unable to load profile: ${techSnap.error}',
                  textAlign: TextAlign.center,
                ),
              );
            }
            final techData = techSnap.data?.data();
            if (!_notificationPreferenceLoaded && techData != null) {
              _notificationPreferenceLoaded = true;
              _notificationToggled = techData['notificationsEnabled'] == true;
            }

            // Basic details
            final String techName = techData?['full_name'] ??
                techData?['name'] ??
                user?.displayName ??
                'Technician';
            final String techEmail = techData?['email'] ?? user?.email ?? '';
            final double rating = (techData?['rating'] is num)
                ? (techData?['rating'] as num).toDouble()
                : 0;
            final String experience = (techData?['experienceYears'] ??
                    techData?['experience'] ??
                    'Not provided')
                .toString();
            final rawAvailability = techData?['availability'];
            final String availability = rawAvailability is String
                ? rawAvailability
                : (techData?['available'] == true ? 'Online' : 'Offline');

            final uid = user?.uid ?? '';
            final String techId = uid.isEmpty
                ? 'KBI—'
                : 'KBI-${uid.substring(0, uid.length < 4 ? uid.length : 4).toUpperCase()}';
            final String? profilePhoto = techData?['profile_photo'];

            // Skills & Service Areas
            final skills = (techData?['skills'] as List?)
                    ?.map((e) => e.toString())
                    .toList() ??
                <String>[];
            final serviceAreas = (techData?['service_areas'] as List?)
                    ?.map((e) => e.toString())
                    .toList() ??
                <String>[];

            // Vehicle
            final vehicle = techData?['vehicle'] as Map<String, dynamic>?;
            final vehicleType = vehicle?['type'] ?? 'Not provided';
            final vehicleBrand = vehicle?['brand'] ?? 'Not provided';
            final vehicleModel = vehicle?['model'] ?? 'Not provided';
            final vehicleColor = vehicle?['color'] ?? 'Not provided';
            final vehiclePlate = vehicle?['plateNumber'] ?? 'Not provided';
            final vehicleVerified = vehicle?['isVerified'] == true;

            return StreamBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
              stream: _jobsStream,
              builder: (context, jobsSnap) {
                if (jobsSnap.connectionState == ConnectionState.waiting &&
                    !jobsSnap.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (jobsSnap.hasError) {
                  return Center(
                    child: Text(
                      'Unable to load performance: ${jobsSnap.error}',
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                final jobs = jobsSnap.data ?? const [];
                final completedJobs = jobs.where((job) {
                  final d = job.data();
                  if (d == null) return false;
                  return normalizeJobStatus(d['status']) == 'completed';
                }).length;
                final decided = jobs.where((job) {
                  final d = job.data();
                  if (d == null) return false;
                  final status = normalizeJobStatus(d['status']);
                  return !{
                    'assigned',
                    'pending',
                    'pending acceptance',
                    'cancelled'
                  }.contains(status);
                }).toList();
                final accepted = decided.where((job) {
                  final d = job.data();
                  if (d == null) return false;
                  return normalizeJobStatus(d['status']) != 'rejected';
                }).length;
                // A rate computed from one or two jobs reads as "100%" and
                // misleads. Withhold it until the sample means something.
                const minimumDecidedForRate = 5;
                final acceptanceRate = decided.length < minimumDecidedForRate
                    ? '—'
                    : '${((accepted / decided.length) * 100).round()}%';
                final responseDurations = <Duration>[];
                for (final job in jobs) {
                  final data = job.data();
                  if (data == null) continue;
                  final assigned = data['assignedAt'] ?? data['createdAt'];
                  final acceptedAt = data['acceptedAt'];
                  if (assigned is Timestamp && acceptedAt is Timestamp) {
                    final duration =
                        acceptedAt.toDate().difference(assigned.toDate());
                    if (!duration.isNegative) responseDurations.add(duration);
                  }
                }
                final responseTime = responseDurations.isEmpty
                    ? '—'
                    : '${(responseDurations.fold<int>(0, (totalMinutes, value) => totalMinutes + value.inMinutes) / responseDurations.length).round()} min';
                final levelText = completedJobs > 200
                    ? 'Platinum Technician'
                    : completedJobs > 50
                        ? 'Gold Technician'
                        : completedJobs > 10
                            ? 'Silver Technician'
                            : 'Bronze Technician';

                return Scaffold(
                  backgroundColor: kbiGroupedBackground,
                  appBar: AppBar(
                    elevation: 0,
                    scrolledUnderElevation: 0,
                    backgroundColor: Colors.transparent,
                    centerTitle: false,
                    leading: Navigator.canPop(context)
                        ? IconButton(
                            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                                color: Color(0xFF0F172A), size: 20),
                            onPressed: () => Navigator.maybePop(context),
                          )
                        : null,
                    title: Text(
                      isAr ? 'الملف الشخصي' : 'Profile',
                    ),
                    actions: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: TextButton.icon(
                          onPressed: () =>
                              _showEditProfileBottomSheet(techData),
                          icon: const Icon(Icons.edit_outlined,
                              size: 16, color: kbiBlue),
                          label: Text(
                            isAr ? 'تعديل' : 'Edit',
                            style: const TextStyle(
                              color: kbiBlue,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  body: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildHeroCard(
                              techName,
                              techEmail,
                              techId,
                              levelText,
                              availability,
                              profilePhoto,
                              techData,
                              isAr,
                            ),
                            const SizedBox(height: 20),
                            _buildSectionLabel(isAr
                                ? 'نظرة عامة على الأداء'
                                : 'Performance Overview'),
                            const SizedBox(height: 10),
                            _buildPerformanceStats(
                              rating,
                              completedJobs,
                              experience,
                              acceptanceRate,
                              responseTime,
                              isAr,
                            ),
                            const SizedBox(height: 24),
                            _buildExpandableProfileSection(
                              isAr
                                  ? 'المعلومات الشخصية'
                                  : 'Personal Information',
                              _buildProfileInformationCard(
                                techName,
                                techEmail,
                                techId,
                                techData?['phone'] ??
                                    user?.phoneNumber ??
                                    (isAr ? 'غير مسجل' : 'Not registered'),
                                isAr,
                              ),
                            ),
                            if (skills.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              _buildExpandableProfileSection(
                                isAr
                                    ? 'المهارات المتخصصة'
                                    : 'Specialized Skills',
                                _buildSkillsWrap(skills),
                              ),
                            ],
                            const SizedBox(height: 12),
                            _buildExpandableProfileSection(
                              isAr ? 'المركبة والأسطول' : 'Vehicle & Fleet',
                              _buildVehicleCard(
                                vehicleType,
                                vehicleBrand,
                                vehicleModel,
                                vehicleColor,
                                vehiclePlate,
                                vehicleVerified,
                                isAr,
                              ),
                            ),
                            if (serviceAreas.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              _buildExpandableProfileSection(
                                isAr
                                    ? 'مناطق الخدمة المحددة'
                                    : 'Assigned Service Areas',
                                _buildServiceAreasWrap(serviceAreas),
                              ),
                            ],
                            const SizedBox(height: 24),
                            _buildSectionLabel(isAr
                                ? 'الإعدادات والأمان'
                                : 'Settings & Security'),
                            const SizedBox(height: 10),
                            _buildSettingsSection(isAr),
                            const SizedBox(height: 24),
                            _buildSectionLabel(isAr
                                ? 'الدعم المباشر والإرسال'
                                : 'Direct Support & Dispatch'),
                            const SizedBox(height: 10),
                            _buildSupportCard(isAr),
                            const SizedBox(height: 32),
                            _buildLogoutButton(isAr),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        color: Colors.black54,
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      ),
    );
  }

  Widget _buildExpandableProfileSection(String title, Widget child) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: kbiSeparator),
        ),
        clipBehavior: Clip.antiAlias,
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          childrenPadding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
          iconColor: kbiBlue,
          collapsedIconColor: kbiSecondaryLabel,
          title: Text(
            title,
            style: const TextStyle(
              color: kbiLabel,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          children: [child],
        ),
      ),
    );
  }

  // Hero Card construction with live status badges
  Widget _buildHeroCard(
    String name,
    String email,
    String id,
    String level,
    String availability,
    String? profilePhotoUrl,
    Map<String, dynamic>? techData,
    bool isAr,
  ) {
    final bool isOnline = availability.toLowerCase() == 'online' ||
        techData?['online'] == true ||
        techData?['isOnline'] == true;
    final bool isApproved = techData?['isApproved'] != false;
    final String specialization = (techData?['specialization'] ??
            techData?['experience_main_skill'] ??
            (isAr
                ? 'أخصائي صيانة ميدانية معتمد'
                : 'Certified Field Repair Specialist'))
        .toString();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Avatar + Edit Trigger + Verified Badge
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isOnline
                        ? const Color(0xFF10B981)
                        : const Color(0xFFE2E8F0),
                    width: 3,
                  ),
                ),
                child: CircleAvatar(
                  radius: 46,
                  backgroundColor: const Color(0xFFF1F5F9),
                  backgroundImage: _safeImageProvider(profilePhotoUrl),
                  child: _safeImageProvider(profilePhotoUrl) == null
                      ? const Icon(Icons.person_outline_rounded,
                          size: 44, color: Color(0xFF64748B))
                      : null,
                ),
              ),
              Positioned(
                bottom: 0,
                right: isAr ? null : 0,
                left: isAr ? 0 : null,
                child: InkWell(
                  onTap: _pickAndUploadPhoto,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.camera_alt_rounded,
                        color: Colors.white, size: 16),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Name and Tier Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                name,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(width: 8),
              if (isApproved)
                const Icon(Icons.verified_rounded,
                    color: Color(0xFF0284C7), size: 20),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            specialization,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),

          // Tier and Level Chip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.workspace_premium_rounded,
                    size: 16, color: Color(0xFFF59E0B)),
                const SizedBox(width: 6),
                Text(
                  level,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileInformationCard(
      String name, String email, String id, String phone, bool isAr) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          _buildProfileInfoRow(Icons.person_outline_rounded,
              isAr ? 'اسم الفني' : 'Technician Name', name),
          const Divider(height: 1, indent: 56, color: Color(0xFFF1F5F9)),
          _buildProfileInfoRow(Icons.mail_outline_rounded,
              isAr ? 'البريد الرسمي' : 'Official Email', email),
          const Divider(height: 1, indent: 56, color: Color(0xFFF1F5F9)),
          _buildProfileInfoRow(Icons.phone_outlined,
              isAr ? 'رقم الهاتف المسجل' : 'Registered Phone', phone),
          const Divider(height: 1, indent: 56, color: Color(0xFFF1F5F9)),
          _buildProfileInfoRow(Icons.badge_outlined,
              isAr ? 'رقم الهوية الفنية' : 'Technician ID', id,
              isCopyable: true),
        ],
      ),
    );
  }

  Widget _buildProfileInfoRow(IconData icon, String label, String value,
      {bool isCopyable = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Icon(icon, color: const Color(0xFF0F172A), size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          if (isCopyable)
            IconButton(
              icon: const Icon(Icons.copy_rounded,
                  size: 16, color: Color(0xFF0284C7)),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Copied $value to clipboard'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  // Performance Statistics Cards
  Widget _buildPerformanceStats(
    double rating,
    int completedJobs,
    String experience,
    String acceptance,
    String response,
    bool isAr,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = (constraints.maxWidth - 12) / 2;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _buildStatCard(
              isAr ? 'تقييم الأداء' : 'Rating Score',
              rating > 0 ? rating.toStringAsFixed(2) : '5.00',
              isAr ? '★ تقييم العملاء' : '★ Customer Review',
              Icons.star_rounded,
              const Color(0xFFF59E0B),
              cardWidth,
            ),
            _buildStatCard(
              isAr ? 'الطلبات المكتملة' : 'Completed',
              completedJobs.toString(),
              isAr ? 'إجمالي الإصلاحات' : 'Total Repaired',
              Icons.check_circle_outline_rounded,
              const Color(0xFF10B981),
              cardWidth,
            ),
            _buildStatCard(
              isAr ? 'نسبة القبول' : 'Acceptance',
              acceptance,
              isAr ? 'مطابقة الطلبات' : 'Dispatch Match',
              Icons.thumb_up_alt_outlined,
              const Color(0xFF0284C7),
              cardWidth,
            ),
            _buildStatCard(
              isAr ? 'متوسط الاستجابة' : 'Avg Response',
              response,
              isAr ? 'سرعة الوصول' : 'Arrival Speed',
              Icons.timer_outlined,
              const Color(0xFF6366F1),
              cardWidth,
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String label, String value, String sub, IconData icon,
      Color color, double width) {
    return Container(
      width: width,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 14, color: color),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // Specialized Skills badging
  Widget _buildSkillsWrap(List<String> skills) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: const Color(0xFFEDEEF1)),
      ),
      child: skills.isEmpty
          ? const Text('No specialized skills configured.',
              style: TextStyle(color: Colors.black54, fontSize: 13))
          : Wrap(
              spacing: 8,
              runSpacing: 8,
              children: skills.map((skill) {
                return Chip(
                  label: Text(
                    skill,
                    style: const TextStyle(color: Colors.black, fontSize: 12.5),
                  ),
                  backgroundColor: const Color(0xFFF1F2F4),
                  side: const BorderSide(color: Color(0xFFE8E9EC)),
                  shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.all(Radius.circular(24))),
                );
              }).toList(),
            ),
    );
  }

  // Vehicle Details Card
  Widget _buildVehicleCard(
    String type,
    String brand,
    String model,
    String color,
    String plate,
    bool isVerified,
    bool isAr,
  ) {
    final vehicleTypeLabel = type == 'Car'
        ? (isAr ? 'سيارة' : 'Car')
        : (isAr ? 'دراجة نارية' : 'Motorcycle');

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: const Color(0xFFEDEEF1)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    type == 'Car'
                        ? Icons.directions_car_outlined
                        : Icons.motorcycle_outlined,
                    color: const Color(0xFF111318),
                    size: 22,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    isAr
                        ? 'بيانات مركبة $vehicleTypeLabel'
                        : '$type Information',
                    style: const TextStyle(
                        color: Color(0xFF111318),
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              if (isVerified)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.08),
                    borderRadius: const BorderRadius.all(Radius.circular(24)),
                    border:
                        Border.all(color: Colors.green.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.verified, color: Colors.green, size: 12),
                      const SizedBox(width: 4),
                      Text(isAr ? 'موثقة' : 'Verified',
                          style: const TextStyle(
                              color: Colors.green,
                              fontSize: 10,
                              fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          _buildVehicleDetailRow(isAr ? 'الشركة المصنعة' : 'Brand', brand),
          const Divider(color: Colors.black12, height: 16),
          _buildVehicleDetailRow(isAr ? 'الموديل والطراز' : 'Model', model),
          const Divider(color: Colors.black12, height: 16),
          _buildVehicleDetailRow(isAr ? 'اللون' : 'Color', color),
          const Divider(color: Colors.black12, height: 16),
          _buildVehicleDetailRow(isAr ? 'رقم اللوحة' : 'Plate Number', plate),
        ],
      ),
    );
  }

  Widget _buildVehicleDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(color: Colors.black54, fontSize: 13)),
        Text(value,
            style: const TextStyle(
                color: Colors.black,
                fontSize: 13,
                fontWeight: FontWeight.bold)),
      ],
    );
  }

  // Location service areas list
  Widget _buildServiceAreasWrap(List<String> areas) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: const Color(0xFFEDEEF1)),
      ),
      child: areas.isEmpty
          ? const Text('No service areas configured.',
              style: TextStyle(color: Colors.black54, fontSize: 13))
          : Wrap(
              spacing: 8,
              runSpacing: 8,
              children: areas.map((area) {
                return Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F2F4),
                    borderRadius: const BorderRadius.all(Radius.circular(16)),
                    border: Border.all(color: const Color(0xFFE8E9EC)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_on_outlined,
                          color: Color(0xFF555961), size: 14),
                      const SizedBox(width: 6),
                      Text(area,
                          style: const TextStyle(
                              color: Colors.black, fontSize: 12)),
                    ],
                  ),
                );
              }).toList(),
            ),
    );
  }

  // Settings list tiles
  Widget _buildSettingsSection(bool isAr) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            ListTile(
              leading: const Icon(Icons.language_rounded,
                  color: Color(0xFF0F172A), size: 20),
              title: Text(isAr ? 'اللغة' : 'Language',
                  style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              subtitle: Text(isAr ? 'العربية (Arabic)' : 'English (الإنجليزية)',
                  style:
                      const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
              trailing: Icon(
                  isAr
                      ? Icons.chevron_left_rounded
                      : Icons.chevron_right_rounded,
                  color: const Color(0xFF64748B)),
              onTap: () {
                if (isAr) {
                  widget.onLocaleChanged(const Locale('en'));
                } else {
                  widget.onLocaleChanged(const Locale('ar'));
                }
              },
            ),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            ListTile(
              leading: const Icon(Icons.notifications_outlined,
                  color: Color(0xFF0F172A), size: 20),
              title: Text(isAr ? 'الإشعارات الفورية' : 'Push Notifications',
                  style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              trailing: Switch(
                value: _notificationToggled,
                activeTrackColor: const Color(0xFF0284C7),
                onChanged: _setNotificationsEnabled,
              ),
            ),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            ListTile(
              leading: const Icon(Icons.lock_outline_rounded,
                  color: Color(0xFF0F172A), size: 20),
              title: Text(isAr ? 'الأمان وكلمة المرور' : 'Security & Password',
                  style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              trailing: Icon(
                  isAr
                      ? Icons.chevron_left_rounded
                      : Icons.chevron_right_rounded,
                  color: const Color(0xFF64748B)),
              onTap: _showChangePasswordDialog,
            ),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            ListTile(
              leading: const Icon(Icons.privacy_tip_outlined,
                  color: Color(0xFF0F172A), size: 20),
              title: Text(isAr ? 'سياسة الخصوصية' : 'Privacy Policy',
                  style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.open_in_new,
                  color: Color(0xFF64748B), size: 16),
              onTap: () => _launchSupportUrl(AppConfig.privacyPolicyUrl),
            ),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            ListTile(
              leading: const Icon(Icons.description_outlined,
                  color: Color(0xFF0F172A), size: 20),
              title: Text(
                  isAr ? 'شروط الخدمة والاتفاقية' : 'Terms & Service Agreement',
                  style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.open_in_new,
                  color: Color(0xFF64748B), size: 16),
              onTap: () => _launchSupportUrl(AppConfig.termsUrl),
            ),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            ListTile(
              leading: const Icon(Icons.delete_forever_outlined,
                  color: Color(0xFFEF4444), size: 20),
              title: Text(isAr ? 'حذف الحساب نهائياً' : 'Delete Account',
                  style: const TextStyle(
                      color: Color(0xFFEF4444),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600)),
              onTap: _deleteAccount,
            ),
          ],
        ),
      ),
    );
  }

  // Support Card
  Widget _buildSupportCard(bool isAr) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: const Color(0xFFEDEEF1)),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _launchSupportUrl(
              'https://wa.me/${AppConfig.supportWhatsApp}',
            ),
            child: Row(
              children: [
                const Icon(Icons.chat_bubble_outline_rounded,
                    color: Colors.green, size: 20),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(isAr ? 'دعم الواتساب الفوري' : 'WhatsApp Support',
                          style: const TextStyle(
                              color: Colors.black,
                              fontSize: 13.5,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      const Text('+971 50 249 1034',
                          style:
                              TextStyle(color: Colors.black54, fontSize: 11)),
                    ],
                  ),
                ),
                const Icon(Icons.launch_rounded,
                    color: Color(0xFF8B8F96), size: 16),
              ],
            ),
          ),
          const Divider(color: Colors.black12, height: 24),
          InkWell(
            onTap: () => _launchSupportUrl(
              'mailto:${AppConfig.supportEmail}?subject=Technician%20Support',
            ),
            child: Row(
              children: [
                const Icon(Icons.email_outlined,
                    color: Color(0xFF111318), size: 20),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                          isAr ? 'البريد الإلكتروني للعمليات' : 'Email Support',
                          style: const TextStyle(
                              color: Colors.black,
                              fontSize: 13.5,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      const Text('support@kbi.services',
                          style:
                              TextStyle(color: Colors.black54, fontSize: 11)),
                    ],
                  ),
                ),
                const Icon(Icons.launch_rounded,
                    color: Color(0xFF8B8F96), size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Logout red button
  Widget _buildLogoutButton(bool isAr) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton.icon(
        onPressed: _showLogoutDialog,
        icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 18),
        label: Text(isAr ? 'تسجيل الخروج من الحساب' : 'Log Out',
            style: const TextStyle(
                color: Colors.red, fontWeight: FontWeight.bold, fontSize: 15)),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          side: const BorderSide(color: Colors.red, width: 1),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(16))),
        ),
      ),
    );
  }
}
