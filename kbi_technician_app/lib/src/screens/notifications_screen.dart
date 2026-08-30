import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;

import '../theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _markingAllRead = false;
  Stream<QuerySnapshot<Map<String, dynamic>>>? _notificationsStream;

  @override
  void initState() {
    super.initState();
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      _notificationsStream = FirebaseFirestore.instance
          .collection('notifications')
          .where('userId', isEqualTo: uid)
          .snapshots();
    }
  }

  Future<void> _markAllAsRead(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) async {
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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read.')),
      );
    } catch (e) {
      if (!mounted) return;
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
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            toolbarHeight: 70,
            titleSpacing: 16,
            title: Text(
              isAr ? 'صندوق الوارد' : 'Inbox',
              style: Theme.of(context).textTheme.displaySmall,
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(50),
              child: Container(
                height: 38,
                margin: const EdgeInsets.fromLTRB(16, 2, 16, 10),
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.68),
                  borderRadius: BorderRadius.circular(13),
                  border: Border.all(color: Colors.white),
                ),
                child: TabBar(
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  labelColor: kbiLabel,
                  unselectedLabelColor: kbiSecondaryLabel,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  tabs: const [
                    Tab(text: 'Jobs'),
                    Tab(text: 'Payments'),
                    Tab(text: 'System'),
                  ],
                ),
              ),
            ),
          ),
          body: uid == null
              ? const Center(
                  child: Text('Not logged in',
                      style: TextStyle(color: Color(0xFF111318))))
              : StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: _notificationsStream,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: 5,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, __) => const SizedBox(
                          height: 82,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Color(0xFFE9EAED),
                              borderRadius:
                                  BorderRadius.all(Radius.circular(20)),
                            ),
                          ),
                        ),
                      );
                    }
                    if (snap.hasError) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Text(
                            'Notifications could not be loaded.\n${snap.error}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.black87),
                          ),
                        ),
                      );
                    }
                    final rawDocs = snap.data?.docs ?? [];
                    final docs = rawDocs.where((d) {
                      final data = d.data();
                      final target = (data['userId'] ??
                              data['technicianId'] ??
                              data['recipientId'] ??
                              '')
                          .toString();
                      return target.isEmpty ||
                          target == uid ||
                          data['broadcast'] == true;
                    }).toList()
                      ..sort((a, b) {
                        final aDate = (a.data()['createdAt'] as Timestamp?)
                                ?.millisecondsSinceEpoch ??
                            0;
                        final bDate = (b.data()['createdAt'] as Timestamp?)
                                ?.millisecondsSinceEpoch ??
                            0;
                        return bDate.compareTo(aDate);
                      });

                    final unreadCount =
                        docs.where((d) => d.data()['isRead'] != true).length;

                    return Column(
                      children: [
                        if (docs.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            color: Colors.transparent,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '$unreadCount unread',
                                  style: const TextStyle(
                                      color: Colors.black87, fontSize: 12),
                                ),
                                _markingAllRead
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2, color: kbiBlue),
                                      )
                                    : TextButton.icon(
                                        onPressed: unreadCount > 0
                                            ? () => _markAllAsRead(docs)
                                            : null,
                                        icon: const Icon(
                                            Icons.done_all_outlined,
                                            size: 16),
                                        label: const Text('Mark all read',
                                            style: TextStyle(fontSize: 12)),
                                        style: TextButton.styleFrom(
                                          foregroundColor: kbiBlue,
                                          disabledForegroundColor:
                                              Colors.black12,
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

  Widget _buildNotificationList(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> allDocs,
      String filterType) {
    // Filter docs by category
    final filtered = allDocs.where((d) {
      final data = d.data();
      final cat =
          (data['category'] ?? data['type'] ?? '').toString().toLowerCase();
      if (filterType == 'job') {
        return cat.contains('job') ||
            cat.contains('offer') ||
            cat.contains('order') ||
            cat.contains('dispatch') ||
            cat.isEmpty;
      }
      if (filterType == 'payment') {
        return cat.contains('pay') ||
            cat.contains('earn') ||
            cat.contains('payout');
      }
      return cat.contains('sys') ||
          cat.contains('admin') ||
          cat.contains('alert');
    }).toList();

    if (filtered.isEmpty) {
      return _buildEmptyState(filterType);
    }

    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final d = filtered[index];
        final data = d.data();
        final title = (data['title'] ?? 'Notification').toString();
        final body = (data['body'] ?? '').toString();
        final isRead = data['isRead'] == true;
        final timestamp = data['createdAt'] as Timestamp?;
        final String dateStr = timestamp != null
            ? DateFormat('d MMM yyyy, HH:mm')
                .format(timestamp.toDate().toLocal())
            : 'Time not provided';

        return _buildNotificationItem(
            title, body, isRead, dateStr, d.reference);
      },
    );
  }

  Widget _buildNotificationItem(String title, String body, bool isRead,
      String date, DocumentReference ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(
          color: isRead ? const Color(0xFFEDEEF1) : kbiBlue,
          width: isRead ? 1.0 : 1.2,
        ),
      ),
      // The ListTile needs its own Material inside the decorated Container,
      // otherwise its ink splashes paint behind the white background.
      child: Material(
        type: MaterialType.transparency,
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFFF1F2F4),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isRead ? CupertinoIcons.bell : CupertinoIcons.bell_fill,
              color: isRead ? kbiSecondaryLabel : kbiBlue,
              size: 20,
            ),
          ),
          title: Text(
            title,
            style: TextStyle(
              color: const Color(0xFF111318),
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
                style: const TextStyle(
                    color: Colors.black87, fontSize: 12, height: 1.3),
              ),
              const SizedBox(height: 6),
              Text(
                date,
                style: const TextStyle(color: Color(0xFF8B8F96), fontSize: 10),
              ),
            ],
          ),
          onTap: () {
            if (!isRead) {
              ref.update({'isRead': true});
            }
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState(String filterType) {
    String message = 'No new job offers or schedule updates';
    if (filterType == 'payment') {
      message = 'No payment clearances or payout alerts';
    }
    if (filterType == 'system') {
      message = 'No system notifications or admin messages';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.notifications_off_outlined,
              size: 48, color: Colors.black12),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(color: Colors.black54, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
