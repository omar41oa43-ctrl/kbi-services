import 'package:flutter/material.dart';

/// Keeps backend failures out of the authentication tree and lets the user retry.
class StartupGuard extends StatefulWidget {
  const StartupGuard({
    super.key,
    required this.initialize,
    required this.child,
  });

  final Future<void> Function() initialize;
  final Widget child;

  @override
  State<StartupGuard> createState() => _StartupGuardState();
}

class _StartupGuardState extends State<StartupGuard> {
  late Future<void> _initialization;

  @override
  void initState() {
    super.initState();
    _initialization = Future.sync(widget.initialize);
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<void>(
        future: _initialization,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done &&
              !snapshot.hasError) {
            return widget.child;
          }
          final isArabic =
              WidgetsBinding.instance.platformDispatcher.locale.languageCode ==
                  'ar';
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: ThemeData.dark(),
            home: Scaffold(
              body: SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: snapshot.hasError
                        ? Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.cloud_off, size: 48),
                              const SizedBox(height: 16),
                              Text(
                                isArabic
                                    ? 'تعذر بدء التطبيق. تحقق من الاتصال وحاول مرة أخرى.'
                                    : 'Unable to start the app. Check your connection and try again.',
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              FilledButton.icon(
                                onPressed: () => setState(() {
                                  _initialization =
                                      Future.sync(widget.initialize);
                                }),
                                icon: const Icon(Icons.refresh),
                                label:
                                    Text(isArabic ? 'إعادة المحاولة' : 'Retry'),
                              ),
                            ],
                          )
                        : const CircularProgressIndicator(),
                  ),
                ),
              ),
            ),
          );
        },
      );
}
