import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/widgets/stable_profile_image.dart';

const _redPixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';

void main() {
  testWidgets('retains the decoded image while parent status rebuilds',
      (tester) async {
    Widget build(String status) => MaterialApp(
          home: Column(
            children: [
              Text(status),
              const StableProfileImage(
                source: _redPixel,
                width: 48,
                height: 48,
                fallback: Icon(Icons.person),
              ),
            ],
          ),
        );

    await tester.pumpWidget(build('available'));
    final firstProvider = tester.widget<Image>(find.byType(Image)).image;

    await tester.pumpWidget(build('busy'));
    final secondProvider = tester.widget<Image>(find.byType(Image)).image;

    expect(identical(firstProvider, secondProvider), isTrue);
  });
}
