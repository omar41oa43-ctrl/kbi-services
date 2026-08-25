import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  
  // Default to localhost for development, can be configured for production
  ApiClient({this.baseUrl = 'http://10.0.2.2:3000'}); // Android Emulator localhost IP

  // Mock data flag for local demo if API cannot be reached
  bool useMockFallback = true;

  Future<Map<String, dynamic>> get(String path) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl$path'), headers: {
        'Content-Type': 'application/json',
      });
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
      if (useMockFallback) {
        return _getMockResponse(path);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$path'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to post data: ${response.statusCode}');
      }
    } catch (e) {
      if (useMockFallback) {
        return _getMockResponse(path, body: body);
      }
      rethrow;
    }
  }

  Map<String, dynamic> _getMockResponse(String path, {Map<String, dynamic>? body}) {
    print('ApiClient: Using Mock Fallback for $path');
    
    // GET /api/customer/orders
    if (path == '/api/customer/orders' && body == null) {
      return {
        'success': true,
        'orders': [
          {
            'id': 'mock-order-1',
            'orderNumber': 'KBI-000001',
            'status': 'PENDING',
            'createdAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
            'description': 'My iPhone 15 does not charge.',
            'devices': [
              {
                'category': 'Smartphone',
                'brand': 'Apple',
                'model': 'iPhone 15 Pro',
                'issue': 'Charging port issue'
              }
            ]
          },
          {
            'id': 'mock-order-2',
            'orderNumber': 'KBI-000002',
            'status': 'COMPLETED',
            'createdAt': DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
            'description': 'Laptop cleaning and battery replacement',
            'devices': [
              {
                'category': 'Laptop',
                'brand': 'Dell',
                'model': 'XPS 13',
                'issue': 'Battery swelling'
              }
            ]
          }
        ]
      };
    }
    
    // GET /api/customer/orders/[id]
    if (path.startsWith('/api/customer/orders/')) {
      final parts = path.split('/');
      final orderId = parts.last;
      
      if (path.endsWith('/approve-quote')) {
        return {
          'success': true,
          'order': {'id': orderId, 'status': 'APPROVED'}
        };
      }
      
      if (path.endsWith('/payment')) {
        return {
          'success': true,
          'payment': {'id': 'pay-mock-1', 'amount': body?['amount'] ?? 450.0, 'status': 'COMPLETED'},
          'invoice': {'id': 'inv-mock-1', 'invoiceNumber': 'INV-MOCK-${DateTime.now().toIso8601String().substring(0, 10)}'}
        };
      }

      if (path.endsWith('/review')) {
        return {
          'success': true,
          'review': {'id': 'rev-mock-1', 'serviceRating': body?['serviceRating'] ?? 5}
        };
      }

      return {
        'success': true,
        'order': {
          'id': orderId,
          'orderNumber': 'KBI-000001',
          'status': 'QUOTED',
          'createdAt': DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
          'updatedAt': DateTime.now().subtract(const Duration(minutes: 30)).toIso8601String(),
          'description': 'My iPhone 15 does not charge.',
          'address': 'Al Reem Island, Abu Dhabi',
          'latitude': 24.4962,
          'longitude': 54.4074,
          'devices': [
            {
              'id': 'dev-mock-1',
              'category': 'Smartphone',
              'brand': 'Apple',
              'model': 'iPhone 15 Pro',
              'issue': 'Charging port issue'
            }
          ],
          'quotes': [
            {
              'id': 'quote-mock-1',
              'repairCost': 250.00,
              'partsCost': 150.00,
              'laborCost': 100.00,
              'discount': 50.00,
              'finalPrice': 450.00,
              'notes': 'Charging port assembly needs replacement'
            }
          ],
          'technician': {
            'id': 'tech-mock-1',
            'available': true,
            'rating': 4.8,
            'latitude': 24.4930,
            'longitude': 54.4010,
            'user': {
              'name': 'Ahmed Technician',
              'phone': '0551234567'
            }
          },
          'statusHistory': [
            {'id': 'sh-1', 'status': 'PENDING', 'changedAt': DateTime.now().subtract(const Duration(hours: 3)).toIso8601String()},
            {'id': 'sh-2', 'status': 'REVIEWING', 'changedAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String()},
            {'id': 'sh-3', 'status': 'QUOTED', 'changedAt': DateTime.now().subtract(const Duration(hours: 1)).toIso8601String()},
          ]
        }
      };
    }

    // POST /api/customer/orders
    if (path == '/api/customer/orders') {
      return {
        'success': true,
        'orderId': 'mock-new-order-id',
        'orderNumber': 'KBI-${(100000 + (DateTime.now().millisecond * 100))}'
      };
    }

    // GET /api/customer/warranty
    if (path == '/api/customer/warranty') {
      return {
        'success': true,
        'warranties': [
          {
            'id': 'warr-mock-1',
            'startDate': DateTime.now().subtract(const Duration(days: 30)).toIso8601String(),
            'endDate': DateTime.now().add(const Duration(days: 60)).toIso8601String(),
            'status': 'ACTIVE',
            'notes': 'iPhone 15 Pro Screen Warranty',
            'order': {
              'orderNumber': 'KBI-000001',
              'devices': [
                {
                  'brand': 'Apple',
                  'model': 'iPhone 15 Pro',
                }
              ]
            }
          }
        ]
      };
    }

    return {'success': false, 'error': 'Unknown route'};
  }
}
