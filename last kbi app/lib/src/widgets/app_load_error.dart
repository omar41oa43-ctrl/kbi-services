import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../theme.dart';

class AppLoadError extends StatelessWidget {
  final String title;
  final bool isArabic;
  final VoidCallback onRetry;

  const AppLoadError(
      {super.key,
      required this.title,
      required this.onRetry,
      this.isArabic = false});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(CupertinoIcons.wifi_exclamationmark,
                color: kbiSecondaryLabel, size: 36),
            const SizedBox(height: 16),
            Text(title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
                isArabic
                    ? 'تحقق من اتصالك وحاول مرة أخرى.'
                    : 'Check your connection and try again.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: kbiSecondaryLabel)),
            const SizedBox(height: 16),
            OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(CupertinoIcons.refresh),
                label: Text(isArabic ? 'إعادة المحاولة' : 'Try again')),
          ]),
        ),
      ),
    );
  }
}
