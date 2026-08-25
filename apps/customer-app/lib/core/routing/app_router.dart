import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/authentication/login_screen.dart';
import '../../features/authentication/signup_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/booking/booking_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/tracking/tracking_screen.dart';
import '../../features/payments/payment_screen.dart';
import '../../features/warranty/warranty_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/support/chat_screen.dart';
import '../../features/orders/review_screen.dart';
import '../auth/auth_service.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authService = ref.watch(authServiceProvider);

  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/book',
        builder: (context, state) => const BookingScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/tracking/:orderId',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          return TrackingScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/payment/:orderId',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          final amount = double.tryParse(state.uri.queryParameters['amount'] ?? '0') ?? 0.0;
          return PaymentScreen(orderId: orderId, amount: amount);
        },
      ),
      GoRoute(
        path: '/chat/:orderId',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          return ChatScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/review/:orderId',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          return ReviewScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/warranty',
        builder: (context, state) => const WarrantyScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
    redirect: (context, state) {
      final loggedIn = authService.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/signup';

      if (!loggedIn && !isLoggingIn) return '/login';
      if (loggedIn && isLoggingIn) return '/';
      return null;
    },
  );
});
