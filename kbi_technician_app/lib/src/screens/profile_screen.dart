import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../i18n.dart';
import '../services/technician_service.dart';

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
  bool _notificationToggled = true;

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final isAr = widget.locale.languageCode == 'ar';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF070A0E),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0E131B),
          elevation: 0,
          title: Text(
            t(context, 'profile'),
            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
          ),
          centerTitle: true,
        ),
        body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: TechnicianService.instance.watchMyTechDoc(),
          builder: (context, techSnap) {
            final techData = techSnap.data?.data();
            final String techName = techData?['name'] ?? user?.displayName ?? 'Ahmed Technician';
            final String techEmail = techData?['email'] ?? user?.email ?? 'ahmed@kbi.ae';
            final String techPhone = techData?['phone'] ?? '+971509999999';
            final String experience = (techData?['experienceYears'] ?? '5').toString();
            final double rating = (techData?['rating'] is num) ? (techData?['rating'] as num).toDouble() : 4.9;
            final skills = (techData?['skills'] as List?)?.map((e) => e.toString()).toList() ?? ['Laptop Repair', 'Smartphone Repair'];

            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 100), // extra padding at the bottom for the floating navigation bar
              child: Column(
                children: [
                  // PROFILE AVATAR WITH VERIFICATION BADGE
                  Stack(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.cyanAccent, width: 2),
                        ),
                        child: const CircleAvatar(
                          radius: 50,
                          backgroundColor: Color(0xFF1E2633),
                          child: Text('🔧', style: TextStyle(fontSize: 44)),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.cyanAccent,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check, color: Colors.black, size: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // NAME & EMAIL
                  Text(
                    techName,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    techEmail,
                    style: const TextStyle(color: Colors.white38, fontSize: 12),
                  ),
                  const SizedBox(height: 24),

                  // STATS CARD ROW
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E131B),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF1E2633)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem('Rating', '⭐ ${rating.toStringAsFixed(1)}'),
                        _buildDivider(),
                        _buildStatItem('Experience', '$experience Yrs'),
                        _buildDivider(),
                        _buildStatItem('Status', 'Active'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // SKILLS CHIPS SECTION
                  Align(
                    alignment: isAr ? Alignment.centerRight : Alignment.centerLeft,
                    child: const Text(
                      'SPECIALIZED SKILLS',
                      style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: skills.map((s) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF161E2A),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF1E2633)),
                      ),
                      child: Text(s, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    )).toList(),
                  ),
                  const SizedBox(height: 28),

                  // SETTINGS LIST TILES
                  Align(
                    alignment: isAr ? Alignment.centerRight : Alignment.centerLeft,
                    child: const Text(
                      'SETTINGS & SECURITY',
                      style: TextStyle(color: Colors.white30, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                  ),
                  const SizedBox(height: 10),

                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E131B),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF1E2633)),
                    ),
                    child: Column(
                      children: [
                        // Language Selection
                        ListTile(
                          leading: const Icon(Icons.language_outlined, color: Colors.cyanAccent, size: 20),
                          title: Text(t(context, 'change_language'), style: const TextStyle(color: Colors.white70, fontSize: 14)),
                          subtitle: Text(isAr ? 'العربية' : 'English', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                          trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white30),
                          onTap: () {
                            if (isAr) {
                              widget.onLocaleChanged(const Locale('en'));
                            } else {
                              widget.onLocaleChanged(const Locale('ar'));
                            }
                          },
                        ),
                        const Divider(color: Color(0xFF1E2633), height: 1),
                        
                        // Push Notification Toggle
                        ListTile(
                          leading: const Icon(Icons.notifications_active_outlined, color: Colors.cyanAccent, size: 20),
                          title: const Text('Push Notifications', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          subtitle: const Text('Receive immediate order offers & updates', style: TextStyle(color: Colors.white38, fontSize: 11)),
                          trailing: Switch(
                            value: _notificationToggled,
                            activeColor: Colors.cyanAccent,
                            onChanged: (v) {
                              setState(() {
                                _notificationToggled = v;
                              });
                            },
                          ),
                        ),
                        const Divider(color: Color(0xFF1E2633), height: 1),

                        // Payout bank account details preview
                        ListTile(
                          leading: const Icon(Icons.account_balance_outlined, color: Colors.cyanAccent, size: 20),
                          title: const Text('Payout Bank Account', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          subtitle: Text(
                            techData?['bankName'] != null
                                ? '${techData?['bankName']} (IBAN: ...${(techData?['iban'] ?? '').toString().replaceAll(' ', '').substring((techData?['iban'] ?? '').toString().length > 4 ? (techData?['iban'] ?? '').toString().length - 4 : 0)})'
                                : 'Bank Transfer payout method configured',
                            style: const TextStyle(color: Colors.white38, fontSize: 11),
                          ),
                          trailing: const Icon(Icons.lock_outline, color: Colors.white30, size: 16),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // LOGOUT BUTTON
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A1215),
                      foregroundColor: Colors.redAccent,
                      elevation: 0,
                      minimumSize: const Size.fromHeight(50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Color(0xFF331E21)),
                      ),
                    ),
                    onPressed: () async {
                      await FirebaseAuth.instance.signOut();
                    },
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: Text(t(context, 'logout'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white38, fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 24,
      color: const Color(0xFF1E2633),
    );
  }
}
