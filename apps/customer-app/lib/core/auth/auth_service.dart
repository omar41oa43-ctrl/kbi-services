import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'phone': phone,
  };
}

class AuthService {
  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  
  bool get isAuthenticated => _currentUser != null;

  Future<bool> login(String email, String password) async {
    await Future.delayed(const Duration(seconds: 1));
    _currentUser = UserModel(
      id: 'cust-1',
      name: 'John Doe',
      email: email,
      phone: '0501234567',
    );
    return true;
  }

  Future<bool> signup(String name, String phone, String email, String password) async {
    await Future.delayed(const Duration(seconds: 1));
    _currentUser = UserModel(
      id: 'cust-1',
      name: name,
      email: email,
      phone: phone,
    );
    return true;
  }

  Future<bool> signInWithGoogle() async {
    await Future.delayed(const Duration(seconds: 1));
    _currentUser = UserModel(
      id: 'cust-1',
      name: 'Google User',
      email: 'google@example.com',
      phone: '0501112222',
    );
    return true;
  }

  Future<bool> signInWithApple() async {
    await Future.delayed(const Duration(seconds: 1));
    _currentUser = UserModel(
      id: 'cust-1',
      name: 'Apple User',
      email: 'apple@example.com',
      phone: '0503334444',
    );
    return true;
  }

  Future<void> logout() async {
    _currentUser = null;
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService());
