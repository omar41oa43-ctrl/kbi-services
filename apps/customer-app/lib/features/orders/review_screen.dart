import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class ReviewScreen extends StatefulWidget {
  final String orderId;
  const ReviewScreen({super.key, required this.orderId});

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  int _serviceRating = 5;
  int _technicianRating = 5;
  final _commentController = TextEditingController();
  bool _isSubmitting = false;

  Future<void> _submitReview() async {
    setState(() => _isSubmitting = true);
    final client = ApiClient();
    final response = await client.post(
      '/api/customer/orders/${widget.orderId}/review',
      {
        'serviceRating': _serviceRating,
        'technicianRating': _technicianRating,
        'comment': _commentController.text,
        'imageUrl': '',
      },
    );
    setState(() => _isSubmitting = false);

    if (response['success'] == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thank you! Review saved successfully.')),
      );
      context.go('/orders');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Write Review'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/orders'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'How was your repair experience?',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your review helps us maintain professional standards.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textMutedDark, fontSize: 13),
            ),
            const SizedBox(height: 32),
            
            // Service Rating Stars
            const Text('Rate Our Service', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starNum = index + 1;
                final isSelected = starNum <= _serviceRating;
                return IconButton(
                  icon: Icon(
                    isSelected ? Icons.star : Icons.star_border,
                    color: isSelected ? AppTheme.warning : AppTheme.textMutedDark,
                    size: 36,
                  ),
                  onPressed: () => setState(() => _serviceRating = starNum),
                );
              }),
            ),
            const SizedBox(height: 24),
            
            // Technician Rating Stars
            const Text('Rate Your Technician', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starNum = index + 1;
                final isSelected = starNum <= _technicianRating;
                return IconButton(
                  icon: Icon(
                    isSelected ? Icons.star : Icons.star_border,
                    color: isSelected ? AppTheme.warning : AppTheme.textMutedDark,
                    size: 36,
                  ),
                  onPressed: () => setState(() => _technicianRating = starNum),
                );
              }),
            ),
            const SizedBox(height: 32),
            
            // Comments Field
            const Text('Comments / Notes', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
            const SizedBox(height: 12),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Share your feedback about the repair...',
              ),
            ),
            const SizedBox(height: 24),
            
            // Mock Image Upload Widget
            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Review photo attached successfully.')),
                );
              },
              icon: const Icon(Icons.add_a_photo_outlined, color: AppTheme.primaryAccent),
              label: const Text('Add Photos of Repaired Device', style: TextStyle(color: AppTheme.textPrimaryDark)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.borderDark),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 40),
            
            // Submit Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitReview,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit Review', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }
}
