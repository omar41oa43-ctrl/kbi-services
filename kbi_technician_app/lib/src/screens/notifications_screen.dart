import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _markingAllRead = false;

  Future<void> _markAllAsRead(List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) async {
    setState(() {
      _markingAllRead = true;
    });
    try {
      final batch = FirebaseFirestore.instance.batch();
      for (final d in docs) {
        if (d.data()['isRead'] != true) {
          batch.update(d.reference, {'isRead': true});
        }
      }
      await batch.commit();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read.')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error marking as read: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _markingAllRead = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: DefaultTabController(
        length: 3,
        child: Scaffold(
          backgroundColor: const Color(0xFF070A0E),
          appBar: AppBar(
            backgroundColor: const Color(0xFF0E131B),
            elevation: 0,
            title: const Text(
              'Notifications',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
            ),
            bottom: TabBar(
              indicatorColor: Colors.cyanAccent,
              labelColor: Colors.cyanAccent,
              unselectedLabelColor: Colors.white38,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              tabs: const [
                Tab(text: 'Jobs'),
                Tab(text: 'Payments'),
                Tab(text: 'System'),
              ],
            ),
          ),
          body: uid == null
              ? const Center(child: Text('Not logged in', style: TextStyle(color: Colors.white)))
              : StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: FirebaseFirestore.instance
                      .collection('notifications')
                      .where('userId', isEqualTo: uid)
                      .orderBy('createdAt', descending: true)
                      .snapshots(),
                  builder: (context, snap) {
                    final docs = snap.data?.docs ?? [];
                    final unreadCount = docs.where((d) => d.data()['isRead'] != true).length;

                    return Column(
                      children: [
                        if (docs.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            color: const Color(0xFF0E131B),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '$unreadCount Unread Notification(s)',
                                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                                ),
                                _markingAllRead
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.cyanAccent),
                                      )
                                    : TextButton.icon(
                                        onPressed: unreadCount > 0 ? () => _markAllAsRead(docs) : null,
                                        icon: const Icon(Icons.done_all_outlined, size: 16),
                                        label: const Text('Mark all read', style: TextStyle(fontSize: 12)),
                                        style: TextButton.styleFrom(
                                          foregroundColor: Colors.cyanAccent,
                                          disabledForegroundColor: Colors.white12,
                                        ),
                                      ),
                              ],
                            ),
                          ),
                        Expanded(
                          child: TabBarView(
                            children: [
                              _buildNotificationList(docs, 'job'),
                              _buildNotificationList(docs, 'payment'),
                              _buildNotificationList(docs, 'system'),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ),
      ),
    );
  }

  Widget _buildNotificationList(List<QueryDocumentSnapshot<Map<String, dynamic>>> allDocs, String filterType) {
    // Filter docs by category
    final filtered = allDocs.where((d) {
      final category = (d.data()['category'] ?? '').toString().toLowerCase();
      if (filterType == 'job') return category == 'job' || category == 'offer' || category == '';
      if (filterType == 'payment') return category == 'payment' || category == 'payout';
      return category == 'system' || category == 'admin';
    }).toList();

    if (filtered.isEmpty) {
      return _buildEmptyState(filterType);
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final d = filtered[index];
        final data = d.data();
        final title = (data['title'] ?? 'Notification').toString();
        final body = (data['body'] ?? '').toString();
        final isRead = data['isRead'] == true;
        final timestamp = data['createdAt'] as Timestamp?;
        final String dateStr = timestamp != null
            ? DateTime.fromMillisecondsSinceEpoch(timestamp.millisecondsSinceEpoch).toString().substring(0, 16)
            : 'Recent';

        return _buildNotificationItem(title, body, isRead, dateStr, d.reference);
      },
    );
  }

  Widget _buildNotificationItem(String title, String body, bool isRead, String date, DocumentReference ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isRead ? const Color(0xFF0E131B) : const Color(0xFF161E2A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isRead ? const Color(0xFF1E2633) : Colors.cyanAccent.withOpacity(0.3),
          width: isRead ? 1.0 : 1.2,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isRead ? Colors.white.withOpacity(0.04) : Colors.cyanAccent.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isRead ? Icons.notifications_none_outlined : Icons.notifications_active_outlined,
            color: isRead ? Colors.white54 : Colors.cyanAccent,
            size: 20,
          ),
        ),
        title: Text(
          title,
          style: TextStyle(
            color: Colors.white,
            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
            fontSize: 14,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              body,
              style: const TextStyle(color: Colors.white54, fontSize: 12, height: 1.3),
            ),
            const SizedBox(height: 6),
            Text(
              date,
              style: const TextStyle(color: Colors.white24, fontSize: 10),
            ),
          ],
        ),
        onTap: () {
          if (!isRead) {
            ref.update({'isRead': true});
          }
        },
      ),
    );
  }

  Widget _buildEmptyState(String filterType) {
    String message = 'No new job offers or schedule updates';
    if (filterType == 'payment') message = 'No payment clearances or payout alerts';
    if (filterType == 'system') message = 'No system notifications or admin messages';

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_off_outlined, size: 48, color: Colors.white24),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(color: Colors.white38, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
