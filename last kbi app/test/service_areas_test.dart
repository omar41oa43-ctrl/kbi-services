import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/utils/service_areas.dart';

void main() {
  test('coverage offers every UAE emirate', () {
    expect(serviceAreaOptions([]), [
      'Abu Dhabi',
      'Dubai',
      'Sharjah',
      'Ajman',
      'Umm Al Quwain',
      'Ras Al Khaimah',
      'Fujairah',
    ]);
    for (final emirate in uaeEmirates) {
      expect(serviceAreaLabel(emirate, isArabic: true), isNot(emirate));
      expect(serviceAreaLabel(emirate, isArabic: false), emirate);
    }
  });
  test('saved legacy areas remain editable without duplicate emirates', () {
    final selected = ['Mussafah', 'Dubai', 'Mussafah'];
    expect(serviceAreaOptions(selected), [...uaeEmirates, 'Mussafah']);
    expect(selected, ['Mussafah', 'Dubai', 'Mussafah']);
    expect(serviceAreaLabel('Mussafah', isArabic: true), 'Mussafah');
  });
}
