import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

String normalizeJobStatus(Object? value) =>
    (value ?? '').toString().trim().toLowerCase().replaceAll('_', ' ');

/// The single source of truth for how a job status is shown to a technician.
String jobStatusLabel(Object? value) {
  final s = normalizeJobStatus(value);
  return switch (s) {
    'assigned' || 'pending' || 'pending acceptance' => 'Pending Acceptance',
    'accepted' => 'Accepted',
    'on the way' || 'en route' => 'On The Way',
    'arrived' => 'Arrived',
    'in progress' || 'repairing' || 'inspection' => 'In Progress',
    'completed' => 'Completed',
    'rejected' => 'Rejected',
    'cancelled' => 'Cancelled',
    '' => 'Unknown',
    _ => (value ?? '').toString(),
  };
}

/// Status progression step index (0 to 4) for active flow:
/// 0: Pending Acceptance
/// 1: Accepted
/// 2: On The Way
/// 3: Arrived
/// 4: In Progress
/// 5: Completed
int jobStatusStepIndex(Object? value) {
  final s = normalizeJobStatus(value);
  return switch (s) {
    'assigned' || 'pending' || 'pending acceptance' => 0,
    'accepted' => 1,
    'on the way' || 'en route' => 2,
    'arrived' => 3,
    'in progress' || 'repairing' || 'inspection' => 4,
    'completed' => 5,
    _ => 0,
  };
}

/// Color theme for status badges and indicators
Color jobStatusColor(Object? value) {
  final s = normalizeJobStatus(value);
  return switch (s) {
    'completed' => const Color(0xFF10B981), // Emerald
    'in progress' || 'repairing' || 'inspection' => const Color(0xFF6366F1), // Indigo
    'on the way' || 'en route' || 'arrived' => const Color(0xFF06B6D4), // Cyan
    'accepted' => const Color(0xFF3B82F6), // Blue
    'assigned' || 'pending' || 'pending acceptance' => const Color(0xFFF59E0B), // Amber
    'rejected' || 'cancelled' => const Color(0xFFEF4444), // Red
    _ => const Color(0xFF64748B), // Slate
  };
}

/// Next logical status action title
String? jobNextActionTitle(Object? value) {
  final s = normalizeJobStatus(value);
  return switch (s) {
    'assigned' || 'pending' || 'pending acceptance' => 'Accept Job',
    'accepted' => 'Start Trip (On The Way)',
    'on the way' || 'en route' => 'Mark as Arrived',
    'arrived' => 'Start Working (In Progress)',
    'in progress' || 'repairing' || 'inspection' => 'Complete Job',
    _ => null,
  };
}

/// Next logical target status in database
String? jobNextStatusKey(Object? value) {
  final s = normalizeJobStatus(value);
  return switch (s) {
    'assigned' || 'pending' || 'pending acceptance' => 'accepted',
    'accepted' => 'on the way',
    'on the way' || 'en route' => 'arrived',
    'arrived' => 'in progress',
    'in progress' || 'repairing' || 'inspection' => 'completed',
    _ => null,
  };
}

/// Appointment time for a job card.
String jobTimeLabel(Map<String, dynamic> data) {
  final explicit = (data['appointmentTime'] ?? data['scheduledTime'] ?? '')
      .toString()
      .trim();
  if (explicit.isNotEmpty) return explicit;

  final date = jobDate(data);
  if (date == null) return 'Time not set';
  final local = date.toLocal();
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '$hour:$minute';
}

/// True while a job is actively being worked (accepted through in progress).
bool isJobActive(Object? status) => const {
      'accepted',
      'on the way',
      'en route',
      'arrived',
      'in progress',
      'repairing',
      'inspection',
    }.contains(normalizeJobStatus(status));

DateTime? jobDate(Map<String, dynamic> data) {
  for (final key in const [
    'appointmentDate',
    'scheduledAt',
    'createdAt',
    'updatedAt',
    'date',
  ]) {
    final parsed = _parseDate(data[key]);
    if (parsed != null) return parsed;
  }
  return null;
}

bool isSameCalendarDay(DateTime value, DateTime reference) =>
    value.year == reference.year &&
    value.month == reference.month &&
    value.day == reference.day;

bool isSameLocalDay(DateTime? value, DateTime reference) =>
    value != null && isSameCalendarDay(value.toLocal(), reference.toLocal());

bool isInCurrentWeek(DateTime? value, [DateTime? reference]) {
  if (value == null) return false;
  final now = reference ?? DateTime.now();
  final start = DateTime(now.year, now.month, now.day)
      .subtract(Duration(days: now.weekday - DateTime.monday));
  final end = start.add(const Duration(days: 7));
  return !value.isBefore(start) && value.isBefore(end);
}

int jobPriorityRank(Object? value) =>
    switch ((value ?? '').toString().toLowerCase()) {
      'critical' || 'urgent' => 4,
      'high' => 3,
      'normal' || 'medium' => 2,
      'low' => 1,
      _ => 0,
    };

int priorityRank(Object? value) => jobPriorityRank(value);

DateTime? _parseDate(Object? value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'today') return DateTime.now();
    return DateTime.tryParse(value);
  }
  return null;
}
