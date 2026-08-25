import 'package:flutter/material.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (context, index) {
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'KBI-00000${index + 1}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Chip(
                        label: Text(
                        index == 0 ? 'Pending' : index == 1 ? 'In Progress' : 'Completed',
                        style: const TextStyle(color: Colors.white),
                        ),
                        backgroundColor: index == 0
                            ? const Color(0xFFF59E0B)
                            : index == 1
                                ? const Color(0xFF06B6D4)
                                : const Color(0xFF10B981),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('iPhone 15 Pro'),
                  const SizedBox(height: 4),
                  Text(
                    'Screen Replacement',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
