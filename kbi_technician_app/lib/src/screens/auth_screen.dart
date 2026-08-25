import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../i18n.dart';

class AuthScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const AuthScreen({super.key, required this.onLocaleChanged, required this.locale});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _isLogin = true;
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = FirebaseAuth.instance;
      if (_isLogin) {
        await auth.signInWithEmailAndPassword(email: _email.text.trim(), password: _password.text);
      } else {
        await auth.createUserWithEmailAndPassword(email: _email.text.trim(), password: _password.text);
      }
    } on FirebaseAuthException catch (e) {
      setState(() {
        _error = e.message ?? 'Auth error';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('KBI Technician'),
          actions: [
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: widget.locale.languageCode,
                dropdownColor: const Color(0xFF0B0F14),
                items: const [
                  DropdownMenuItem(value: 'en', child: Text('EN')),
                  DropdownMenuItem(value: 'ar', child: Text('AR')),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  widget.onLocaleChanged(Locale(v));
                },
              ),
            ),
            const SizedBox(width: 12),
          ],
        ),
        body: Center(
          child: SingleChildScrollView(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Text(_isLogin ? t(context, 'login') : t(context, 'register'), style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 12),
                            TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: t(context, 'email'))),
                            const SizedBox(height: 10),
                            TextField(controller: _password, obscureText: true, decoration: InputDecoration(labelText: t(context, 'password'))),
                            if (_error != null) ...[
                              const SizedBox(height: 10),
                              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                            ],
                            const SizedBox(height: 14),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: _loading ? null : _submit,
                                child: _loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : Text(t(context, 'submit')),
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextButton(
                              onPressed: _loading
                                  ? null
                                  : () => setState(() {
                                        _isLogin = !_isLogin;
                                      }),
                              child: Text(_isLogin ? t(context, 'register') : t(context, 'login')),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

