import '../theme.dart';
import 'package:flutter/material.dart';

const _ink = kbiLabel;
const _muted = kbiSecondaryLabel;
const _accent = kbiBrand;
const _border = kbiSeparator;

/// A compact selection field with a searchable, transactional multi-select list.
/// Dismissing the list leaves the saved choices unchanged.
class ServiceMultiSelect extends StatelessWidget {
  const ServiceMultiSelect({
    super.key,
    required this.options,
    required this.selected,
    required this.labelFor,
    required this.onChanged,
    required this.isArabic,
    this.enabled = true,
  });

  final List<String> options;
  final List<String> selected;
  final String Function(String) labelFor;
  final ValueChanged<List<String>> onChanged;
  final bool isArabic;
  final bool enabled;

  Future<void> _open(BuildContext context) async {
    FocusScope.of(context).unfocus();
    final result = await showDialog<List<String>>(
      context: context,
      builder: (_) => _ServicePicker(
        options: options,
        initial: selected,
        labelFor: labelFor,
        isArabic: isArabic,
      ),
    );
    if (context.mounted && result != null) onChanged(result);
  }

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        enabled: enabled,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            key: const Key('service-selection-field'),
            onTap: enabled ? () => _open(context) : null,
            borderRadius: BorderRadius.circular(14),
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: isArabic ? 'اختر تخصصاتك' : 'Select your services',
                labelStyle: const TextStyle(color: _muted, fontSize: 13),
                prefixIcon: const Icon(Icons.handyman_outlined,
                    color: _accent, size: 20),
                suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded,
                    color: _muted),
                filled: true,
                fillColor: kbiSurfaceRaised,
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: _border)),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: _border)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              ),
              child: Text(selected.map(labelFor).join(isArabic ? '، ' : ', '),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style:
                      const TextStyle(color: _ink, fontSize: 14, height: 1.4)),
            ),
          ),
        ),
      );
}

class _ServicePicker extends StatefulWidget {
  const _ServicePicker(
      {required this.options,
      required this.initial,
      required this.labelFor,
      required this.isArabic});
  final List<String> options;
  final List<String> initial;
  final String Function(String) labelFor;
  final bool isArabic;

  @override
  State<_ServicePicker> createState() => _ServicePickerState();
}

class _ServicePickerState extends State<_ServicePicker> {
  late final Set<String> _selected = {...widget.initial};
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final isAr = widget.isArabic;
    final filtered = widget.options
        .where((option) =>
            widget.labelFor(option).toLowerCase().contains(_search) ||
            option.toLowerCase().contains(_search))
        .toList();
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Dialog(
        backgroundColor: kbiSurfaceRaised,
        surfaceTintColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.72,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(children: [
                      Expanded(
                          child: Text(
                              isAr
                                  ? 'التخصصات والخدمات'
                                  : 'Services & specializations',
                              style: const TextStyle(
                                  color: _ink,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 18))),
                      IconButton(
                          tooltip: isAr ? 'إلغاء' : 'Cancel',
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded, color: _muted)),
                    ]),
                    Text(
                        isAr
                            ? 'يمكنك اختيار أكثر من تخصص • ${_selected.length} محدد'
                            : 'Choose one or more • ${_selected.length} selected',
                        style: const TextStyle(
                            color: _muted, fontSize: 12.5, height: 1.5)),
                    const SizedBox(height: 16),
                    TextField(
                      key: const Key('service-search'),
                      onChanged: (value) =>
                          setState(() => _search = value.trim().toLowerCase()),
                      style: const TextStyle(color: _ink, fontSize: 14),
                      decoration: InputDecoration(
                        hintText:
                            isAr ? 'ابحث عن تخصص...' : 'Search services...',
                        hintStyle: const TextStyle(color: _muted),
                        prefixIcon:
                            const Icon(Icons.search_rounded, color: _muted),
                        filled: true,
                        fillColor: kbiSurfaceRaised,
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _border)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _border)),
                        focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _accent)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                        child: filtered.isEmpty
                            ? Center(
                                child: Text(
                                    isAr
                                        ? 'لا توجد نتائج مطابقة'
                                        : 'No matching services',
                                    style: const TextStyle(color: _muted)))
                            : ListView.separated(
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 4),
                                itemBuilder: (context, index) {
                                  final option = filtered[index];
                                  return CheckboxListTile(
                                    value: _selected.contains(option),
                                    activeColor: _accent,
                                    checkColor: kbiOnBrand,
                                    side: const BorderSide(color: _muted),
                                    controlAffinity:
                                        ListTileControlAffinity.leading,
                                    contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 4),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12)),
                                    tileColor: _selected.contains(option)
                                        ? kbiSurfaceMuted
                                        : null,
                                    title: Text(widget.labelFor(option),
                                        style: const TextStyle(
                                            color: _ink, fontSize: 14)),
                                    onChanged: (value) => setState(() {
                                      if (value == true) {
                                        _selected.add(option);
                                      } else {
                                        _selected.remove(option);
                                      }
                                    }),
                                  );
                                },
                              )),
                    const SizedBox(height: 12),
                    FilledButton(
                      key: const Key('apply-services'),
                      onPressed: _selected.isEmpty
                          ? null
                          : () => Navigator.pop(
                              context,
                              widget.options
                                  .where(_selected.contains)
                                  .toList()),
                      style: FilledButton.styleFrom(
                          backgroundColor: _accent,
                          foregroundColor: kbiOnBrand,
                          minimumSize: const Size.fromHeight(48)),
                      child: Text(isAr ? 'تأكيد الاختيار' : 'Apply selection'),
                    ),
                  ]),
            ),
          ),
        ),
      ),
    );
  }
}
