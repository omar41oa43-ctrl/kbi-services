import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:kbi_technician_app/main.dart' as app;
import 'package:kbi_technician_app/src/utils/bank_utils.dart';

const email = String.fromEnvironment('TEST_EMAIL');
const password = String.fromEnvironment('TEST_PASSWORD');

Future<void> settle(WidgetTester tester, [int seconds = 3]) async {
  final end = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('account login, saved bank card, and main tabs', (tester) async {
    expect(email, isNotEmpty);
    expect(password, isNotEmpty);
    // Exercise the app disclosure without an iOS permission sheet obscuring
    // the Wallet capture. GPS is verified by its separate integration test.
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove('background_location_disclosure_accepted');
    final onError = FlutterError.onError;
    await app.main();
    FlutterError.onError = onError;
    await settle(tester, 5);
    final welcome = find.byKey(const Key('welcome-primary-action'));
    if (welcome.evaluate().isNotEmpty) {
      await tester.tap(welcome);
      await settle(tester);
    }
    final fields = find.byType(TextField);
    expect(fields, findsNWidgets(2));
    await tester.enterText(fields.at(0), email);
    await tester.enterText(fields.at(1), password);
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();
    final signIn = find.text('Sign in');
    await tester.ensureVisible(signIn.last);
    await tester.tap(signIn.last);
    await settle(tester, 10);
    for (var attempt = 0; attempt < 3; attempt++) {
      final notNow = find.text('Not now');
      if (notNow.evaluate().isEmpty) break;
      await tester.tap(notNow.last);
      await settle(tester, 2);
    }
    expect(FirebaseAuth.instance.currentUser?.email, email);
    expect(find.text('Wallet'), findsWidgets);
    expect(tester.takeException(), isNull);
    final uid = FirebaseAuth.instance.currentUser!.uid;
    final profile = await FirebaseFirestore.instance
        .collection('technicians')
        .doc(uid)
        .get();
    expect(profile.exists, isTrue);
    final raw = profile.data()?['bank_details'];
    final bank =
        raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{};
    debugPrint('ACCOUNT CHECK: bank details present=${bank.isNotEmpty}');
    final hasCompleteBank = isValidUaeIban(bank['iban']?.toString() ?? '') &&
        (bank['bank_name']?.toString().isNotEmpty ?? false) &&
        (bank['account_holder']?.toString().isNotEmpty ?? false);
    if (hasCompleteBank) {
      await tester.tap(find.text('Profile').last);
      await settle(tester, 4);
      final bankSection = find.text('Bank Account & Payouts');
      await tester.ensureVisible(bankSection);
      await tester.tap(bankSection);
      await settle(tester, 1);
      final edit = find.text('Edit bank details');
      await tester.ensureVisible(edit);
      await tester.tap(edit);
      await settle(tester);
      expect(find.text('Save bank details'), findsOneWidget);
      await tester.ensureVisible(find.text('Save bank details'));
      await tester.tap(find.text('Save bank details'));
      await settle(tester, 2);
      expect(find.text('Bank details saved successfully.'), findsOneWidget);
      final saved = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      final savedBank = saved.data()?['bank_details'] as Map;
      expect(savedBank['bank_name'] == bank['bank_name'], isTrue);
      expect(savedBank['account_holder'] == bank['account_holder'], isTrue);
      expect(
          savedBank['iban'] == normalizeIban(bank['iban'].toString()), isTrue);
      debugPrint(
          'ACCOUNT CHECK: bank form saved successfully with original details');
    }
    await tester.tap(find.text('Wallet').last);
    await settle(tester, 6);
    final card = find.byKey(const Key('wallet-bank-details'));
    await tester.ensureVisible(card);
    expect(card, findsOneWidget);
    final iban = bank['iban']?.toString() ?? '';
    if (isValidUaeIban(iban) &&
        (bank['bank_name']?.toString().isNotEmpty ?? false) &&
        (bank['account_holder']?.toString().isNotEmpty ?? false)) {
      expect(
          find.descendant(
              of: card, matching: find.text(bank['bank_name'].toString())),
          findsOneWidget);
      expect(find.descendant(of: card, matching: find.text(maskIban(iban))),
          findsOneWidget);
      expect(
          find.descendant(
              of: card, matching: find.text(bank['account_holder'].toString())),
          findsOneWidget);
    } else {
      expect(find.text('Add bank details in Profile'), findsOneWidget);
    }
    expect(tester.takeException(), isNull);
    for (final tab in ['Orders', 'Inbox', 'Profile', 'Home', 'Wallet']) {
      await tester.tap(find.text(tab).last);
      await settle(tester, 4);
      expect(tester.takeException(), isNull,
          reason: '$tab must render without errors');
      expect(find.textContaining('permission-denied'), findsNothing);
      expect(find.text('Wallet data could not be loaded.'), findsNothing);
      if (tab == 'Orders') {
        for (final filter in ['Today', 'Upcoming', 'Completed', 'Active']) {
          await tester.tap(find.text(filter).first);
          await settle(tester, 1);
          expect(tester.takeException(), isNull);
        }
        final search = find.descendant(
            of: find.byType(CupertinoSearchTextField),
            matching: find.byType(EditableText));
        await tester.enterText(search, 'no-such-order-wallet-check');
        await settle(tester, 1);
        expect(find.text('No matching orders'), findsOneWidget);
        await tester.enterText(search, '');
        FocusManager.instance.primaryFocus?.unfocus();
        await settle(tester, 1);
        debugPrint('ACCOUNT CHECK: order filters and search passed');
      }
      if (tab == 'Wallet') {
        for (final filter in ['Paid', 'Pending', 'All']) {
          final target = find.text(filter).last;
          await tester.ensureVisible(target);
          await tester.tap(target);
          await settle(tester, 1);
          expect(tester.takeException(), isNull);
        }
        await tester.ensureVisible(card);
        debugPrint('ACCOUNT CHECK: wallet filters passed');
      }
      debugPrint('ACCOUNT CHECK: $tab passed');
    }
    await settle(tester, 3);
  });
}
