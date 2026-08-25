import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class PaymentScreen extends StatefulWidget {
  final String orderId;
  final double amount;
  const PaymentScreen({super.key, required this.orderId, required this.amount});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedMethod = 'CREDIT_CARD';
  bool _isProcessing = false;
  Map<String, dynamic>? _paymentReceipt;

  Future<void> _processPayment() async {
    setState(() => _isProcessing = true);
    final client = ApiClient();
    final response = await client.post(
      '/api/customer/orders/${widget.orderId}/payment',
      {
        'amount': widget.amount,
        'method': _selectedMethod,
        'transactionId': 'TXN-${DateTime.now().millisecondsSinceEpoch}',
        'status': 'COMPLETED',
      },
    );
    setState(() {
      _isProcessing = false;
      if (response['success'] == true) {
        _paymentReceipt = response;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final showReceipt = _paymentReceipt != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(showReceipt ? 'Payment Receipt' : 'Checkout'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/orders'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: showReceipt ? _buildReceiptView() : _buildPaymentOptionsView(),
      ),
    );
  }

  Widget _buildPaymentOptionsView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Payment summary card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                const Text('Repair Service Total', style: TextStyle(color: AppTheme.textMutedDark, fontSize: 14)),
                const SizedBox(height: 8),
                Text(
                  'AED ${widget.amount.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
                ),
                const SizedBox(height: 8),
                Text('Order ID: ${widget.orderId}', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 12)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        const Text('Select Payment Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
        const SizedBox(height: 16),
        _buildMethodOption('CREDIT_CARD', 'Credit Card / Debit Card', Icons.credit_card),
        _buildMethodOption('APPLE_PAY', 'Apple Pay', Icons.phone_iphone),
        _buildMethodOption('GOOGLE_PAY', 'Google Pay', Icons.android),
        _buildMethodOption('CASH', 'Pay with Cash on Delivery', Icons.payments_outlined),
        const SizedBox(height: 40),
        ElevatedButton(
          onPressed: _isProcessing ? null : _processPayment,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryAccent,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _isProcessing
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : Text('Pay AED ${widget.amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildMethodOption(String value, String label, IconData icon) {
    final isSelected = _selectedMethod == value;
    return Card(
      color: isSelected ? AppTheme.primaryAccent.withOpacity(0.1) : AppTheme.surfaceDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isSelected ? AppTheme.primaryAccent : AppTheme.borderDark, width: 1.5),
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: isSelected ? AppTheme.primaryAccent : AppTheme.textMutedDark),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
        trailing: Radio<String>(
          value: value,
          groupValue: _selectedMethod,
          activeColor: AppTheme.primaryAccent,
          onChanged: (val) => setState(() => _selectedMethod = val!),
        ),
        onTap: () => setState(() => _selectedMethod = value),
      ),
    );
  }

  Widget _buildReceiptView() {
    final invoice = _paymentReceipt?['invoice'] ?? {};
    final payment = _paymentReceipt?['payment'] ?? {};
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.check_circle_outline, size: 72, color: AppTheme.success),
        const SizedBox(height: 16),
        const Text(
          'Payment Successful!',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
        ),
        const SizedBox(height: 8),
        Text(
          'Your invoice and receipt are generated below.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppTheme.textMutedDark, fontSize: 14),
        ),
        const SizedBox(height: 32),
        
        // Receipt Details Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('INVOICE / RECEIPT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryAccent)),
                const Divider(color: AppTheme.borderDark, height: 24),
                _buildReceiptRow('Invoice Number', invoice['invoiceNumber'] ?? 'INV-XXXXXX'),
                _buildReceiptRow('Transaction ID', payment['transactionId'] ?? 'TXN-XXXXXX'),
                _buildReceiptRow('Payment Method', payment['method'] ?? 'CREDIT_CARD'),
                _buildReceiptRow('Status', payment['status'] ?? 'COMPLETED'),
                const Divider(color: AppTheme.borderDark, height: 24),
                _buildReceiptRow('Amount Paid', 'AED ${payment['amount'] ?? widget.amount}', isBold: true),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: () => context.go('/orders'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.surfaceDark,
            side: const BorderSide(color: AppTheme.borderDark),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: const Text('Back to Orders', style: TextStyle(color: AppTheme.textPrimaryDark)),
        ),
      ],
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textMutedDark)),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: isBold ? AppTheme.success : AppTheme.textPrimaryDark,
            ),
          ),
        ],
      ),
    );
  }
}
