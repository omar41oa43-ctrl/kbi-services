/// Canonical values shared with registration and persisted in service_areas.
const uaeEmirates = <String>[
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

/// Keep previously saved neighbourhoods visible so they can still be removed.
List<String> serviceAreaOptions(Iterable<String> selected) => {
      ...uaeEmirates,
      ...selected.where((area) => area.trim().isNotEmpty)
    }.toList();

String serviceAreaLabel(String area, {required bool isArabic}) {
  if (!isArabic) return area;
  return const {
        'Abu Dhabi': 'أبوظبي',
        'Dubai': 'دبي',
        'Sharjah': 'الشارقة',
        'Ajman': 'عجمان',
        'Umm Al Quwain': 'أم القيوين',
        'Ras Al Khaimah': 'رأس الخيمة',
        'Fujairah': 'الفجيرة',
      }[area] ??
      area;
}
