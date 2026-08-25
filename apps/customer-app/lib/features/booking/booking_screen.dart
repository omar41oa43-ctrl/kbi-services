import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  int _currentStep = 0;
  
  // Form variables
  String _selectedCategory = 'Smartphone';
  String _selectedBrand = 'Apple';
  String _selectedModel = '';
  final _issueController = TextEditingController();
  final _addressController = TextEditingController();
  String _selectedDate = '';
  String _selectedTime = '';
  
  // AI Diagnosis Variables
  final _aiPromptController = TextEditingController();
  String _aiDiagnosticResult = '';
  String _aiTimeEstimate = '';
  String _aiPriceEstimate = '';
  bool _isAiDiagnosing = false;

  final List<String> _categories = ['Smartphone', 'Laptop', 'Printer', 'TV', 'Gaming Console', 'CCTV'];
  final Map<String, List<String>> _brands = {
    'Smartphone': ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Google'],
    'Laptop': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus'],
    'Printer': ['HP', 'Canon', 'Epson', 'Brother'],
    'TV': ['Samsung', 'LG', 'Sony', 'TCL'],
    'Gaming Console': ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo Switch'],
    'CCTV': ['Hikvision', 'Dahua', 'Ring', 'Eufy'],
  };

  void _runAiDiagnosis() {
    final prompt = _aiPromptController.text.toLowerCase().trim();
    if (prompt.isEmpty) return;

    setState(() {
      _isAiDiagnosing = true;
      _aiDiagnosticResult = '';
    });

    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _isAiDiagnosing = false;
        
        if (prompt.contains('charge') || prompt.contains('power') || prompt.contains('battery')) {
          _aiDiagnosticResult = 'Charging Port failure or battery degradation';
          _aiTimeEstimate = '30 - 45 mins';
          _aiPriceEstimate = 'AED 150 - 350';
          _selectedCategory = 'Smartphone';
          _selectedBrand = 'Apple';
          _selectedModel = 'iPhone 15';
        } else if (prompt.contains('screen') || prompt.contains('crack') || prompt.contains('broken')) {
          _aiDiagnosticResult = 'Cracked Display Glass replacement required';
          _aiTimeEstimate = '45 - 60 mins';
          _aiPriceEstimate = 'AED 250 - 550';
          _selectedCategory = 'Smartphone';
          _selectedBrand = 'Apple';
          _selectedModel = 'iPhone 15';
        } else if (prompt.contains('slow') || prompt.contains('boot') || prompt.contains('windows')) {
          _aiDiagnosticResult = 'Slow OS. Recommend SSD Upgrade or clean OS installation';
          _aiTimeEstimate = '2 - 3 hours';
          _aiPriceEstimate = 'AED 200 - 400';
          _selectedCategory = 'Laptop';
          _selectedBrand = 'Dell';
          _selectedModel = 'XPS 13';
        } else {
          _aiDiagnosticResult = 'General hardware issue detected';
          _aiTimeEstimate = '1 - 2 hours';
          _aiPriceEstimate = 'AED 100 - 300';
        }
        
        _issueController.text = 'AI Diagnosis: $_aiDiagnosticResult. Prompt: "${_aiPromptController.text}"';
      });
    });
  }

  Future<void> _submitBooking() async {
    final client = ApiClient();
    final response = await client.post('/api/customer/orders', {
      'customerName': 'John Doe', // Linked to mock user
      'phone': '0501234567',
      'email': 'john@example.com',
      'address': _addressController.text.isNotEmpty ? _addressController.text : 'Default Abu Dhabi Address',
      'description': _issueController.text,
      'latitude': 24.4962,
      'longitude': 54.4074,
      'devices': [
        {
          'category': _selectedCategory,
          'brand': _selectedBrand,
          'model': _selectedModel.isNotEmpty ? _selectedModel : 'Generic Model',
          'issue': _issueController.text,
        }
      ]
    });

    if (response['success'] == true && mounted) {
      final orderNumber = response['orderNumber'];
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Order Created Successfully! Tracking ID: $orderNumber')),
      );
      context.go('/orders');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book a Repair'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: Column(
        children: [
          // Progressive Stepper Bar
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
            color: AppTheme.surfaceDark,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(4, (index) {
                final isCurrent = index == _currentStep;
                final isPassed = index < _currentStep;
                return Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: isCurrent
                          ? AppTheme.primaryAccent
                          : isPassed
                              ? AppTheme.success
                              : AppTheme.borderDark,
                      child: Text(
                        '${index + 1}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                    if (index < 3)
                      Container(
                        height: 2,
                        width: 40,
                        color: isPassed ? AppTheme.success : AppTheme.borderDark,
                      ),
                  ],
                );
              }),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: IndexedStack(
                index: _currentStep,
                children: [
                  // STEP 1: AI Assistant & Device Category
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // AI Diagnostic Card
                      Card(
                        color: AppTheme.surfaceDark,
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.psychology, color: AppTheme.primaryAccent),
                                  SizedBox(width: 8),
                                  Text(
                                    '🤖 Smart AI Diagnosis Assistant',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Describe your issue in plain words to get automated estimates instantly.',
                                style: TextStyle(fontSize: 12, color: AppTheme.textMutedDark),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _aiPromptController,
                                decoration: const InputDecoration(
                                  hintText: 'e.g., iPhone screen is cracked and won\'t turn on',
                                ),
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: _runAiDiagnosis,
                                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryAccent),
                                child: _isAiDiagnosing
                                    ? const SizedBox(
                                        height: 16,
                                        width: 16,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Text('Diagnose Problem', style: TextStyle(color: Colors.white)),
                              ),
                              if (_aiDiagnosticResult.isNotEmpty) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.backgroundDark,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.borderDark),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Diagnostic: $_aiDiagnosticResult', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                                      const SizedBox(height: 4),
                                      Text('Estimated Time: $_aiTimeEstimate', style: const TextStyle(color: AppTheme.textMutedDark)),
                                      Text('Estimated Price: $_aiPriceEstimate', style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Device selection
                      const Text('Select Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedCategory = val!;
                            _selectedBrand = _brands[_selectedCategory]!.first;
                          });
                        },
                      ),
                    ],
                  ),

                  // STEP 2: Brand, Model & Problem Details
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Select Brand', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedBrand,
                        items: _brands[_selectedCategory]!.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                        onChanged: (val) => setState(() => _selectedBrand = val!),
                      ),
                      const SizedBox(height: 20),
                      const Text('Device Model', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      TextField(
                        onChanged: (val) => setState(() => _selectedModel = val),
                        decoration: const InputDecoration(hintText: 'e.g., iPhone 15 Pro, XPS 13 9310'),
                      ),
                      const SizedBox(height: 20),
                      const Text('Describe Problem', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _issueController,
                        maxLines: 3,
                        decoration: const InputDecoration(hintText: 'Describe details of the issue...'),
                      ),
                    ],
                  ),

                  // STEP 3: Location and Photos (Mock Google Map & Camera Upload)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Service Location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _addressController,
                        decoration: const InputDecoration(
                          hintText: 'Enter your home/office address',
                          prefixIcon: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Mock Google Map UI Representation
                      Container(
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceDark,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderDark),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Icon(Icons.map_outlined, size: 64, color: AppTheme.textMutedDark.withOpacity(0.3)),
                            const Positioned(
                              bottom: 12,
                              child: Text('📍 Map Location Pinned (Mock Google Maps SDK)', style: TextStyle(fontSize: 12, color: AppTheme.textMutedDark)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text('Upload Photos (Optional)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Photo uploaded successfully!')),
                          );
                        },
                        icon: const Icon(Icons.camera_alt_outlined),
                        label: const Text('Add Image from Camera / Gallery'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.surfaceDark,
                          foregroundColor: AppTheme.textPrimaryDark,
                          side: const BorderSide(color: AppTheme.borderDark),
                        ),
                      ),
                    ],
                  ),

                  // STEP 4: Appointment & Confirmation
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Choose Appointment Date', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                setState(() => _selectedDate = 'Tomorrow, July 11');
                              },
                              icon: const Icon(Icons.calendar_today_outlined),
                              label: Text(_selectedDate.isEmpty ? 'Select Date' : _selectedDate),
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.surfaceDark),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const Text('Choose Appointment Time', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        children: ['09:00 AM', '12:00 PM', '03:00 PM', '06:00 PM'].map((t) {
                          final isSel = _selectedTime == t;
                          return ChoiceChip(
                            label: Text(t),
                            selected: isSel,
                            selectedColor: AppTheme.primaryAccent,
                            onSelected: (val) => setState(() => _selectedTime = t),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                      const Divider(color: AppTheme.borderDark),
                      const SizedBox(height: 12),
                      const Text('Booking Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                      const SizedBox(height: 8),
                      Text('Device: $_selectedBrand $_selectedModel ($_selectedCategory)'),
                      Text('Date: ${_selectedDate.isNotEmpty ? _selectedDate : 'Not Selected'}'),
                      Text('Time: ${_selectedTime.isNotEmpty ? _selectedTime : 'Not Selected'}'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Stepper Navigation Buttons
          Container(
            padding: const EdgeInsets.all(20.0),
            color: AppTheme.surfaceDark,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentStep > 0)
                  OutlinedButton(
                    onPressed: () => setState(() => _currentStep--),
                    child: const Text('Back'),
                  )
                else
                  const SizedBox(),
                ElevatedButton(
                  onPressed: () {
                    if (_currentStep < 3) {
                      setState(() => _currentStep++);
                    } else {
                      _submitBooking();
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryAccent),
                  child: Text(_currentStep < 3 ? 'Continue' : 'Submit Request', style: const TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _issueController.dispose();
    _addressController.dispose();
    _aiPromptController.dispose();
    super.dispose();
  }
}
