import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class TrackingScreen extends StatefulWidget {
  final String orderId;
  const TrackingScreen({super.key, required this.orderId});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  // Live simulation variables
  double _techLat = 24.4930;
  double _techLng = 54.4010;
  final double _custLat = 24.4962;
  final double _custLng = 54.4074;
  
  int _simulationStep = 0;
  String _etaText = '8 mins';
  String _distanceText = '1.2 km';
  String _currentStateText = 'Technician Assigned';

  Timer? _timer;

  final List<Map<String, dynamic>> _timelineSteps = [
    {'name': 'Order Created', 'description': 'Request received by KBI', 'isDone': true},
    {'name': 'Reviewed', 'description': 'Device category verified', 'isDone': true},
    {'name': 'Quote Sent', 'description': 'Price estimates generated', 'isDone': true},
    {'name': 'Approved', 'description': 'Customer approved quote', 'isDone': true},
    {'name': 'Technician Assigned', 'description': 'Ahmed Technician on job', 'isDone': true},
    {'name': 'On The Way', 'description': 'Technician heading to your site', 'isDone': false},
    {'name': 'Arrived', 'description': 'Technician reached destination', 'isDone': false},
    {'name': 'Repair Started', 'description': 'Work in progress', 'isDone': false},
    {'name': 'Completed', 'description': 'Repair finished, invoice ready', 'isDone': false},
  ];

  @override
  void initState() {
    super.initState();
    _startTrackingSimulation();
  }

  void _startTrackingSimulation() {
    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted) return;
      setState(() {
        _simulationStep++;
        
        // Move tech coordinate closer to customer coordinate
        if (_simulationStep == 1) {
          _techLat = 24.4940;
          _techLng = 54.4030;
          _etaText = '5 mins';
          _distanceText = '800 m';
          _currentStateText = 'On The Way';
          _timelineSteps[5]['isDone'] = true; // Mark On The Way as done
        } else if (_simulationStep == 2) {
          _techLat = 24.4955;
          _techLng = 54.4060;
          _etaText = '2 mins';
          _distanceText = '300 m';
          _timelineSteps[6]['isDone'] = true; // Mark Arrived as done
        } else if (_simulationStep >= 3) {
          _techLat = _custLat;
          _techLng = _custLng;
          _etaText = 'Arrived';
          _distanceText = '0 m';
          _currentStateText = 'Arrived';
          _timelineSteps[7]['isDone'] = true; // Mark Repair Started as done
          _timer?.cancel();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Repair'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/orders'),
        ),
      ),
      body: Column(
        children: [
          // Google Map Simulation Panel
          Expanded(
            flex: 4,
            child: Container(
              color: AppTheme.surfaceDark,
              child: Stack(
                children: [
                  // Mock Map background and path representation
                  Center(
                    child: Opacity(
                      opacity: 0.15,
                      child: Icon(Icons.map, size: 240, color: AppTheme.textPrimaryDark),
                    ),
                  ),
                  // Mock Customer Destination Pin
                  Positioned(
                    top: 100,
                    right: 80,
                    child: Column(
                      children: const [
                        Icon(Icons.location_on, color: Colors.red, size: 40),
                        Text('You', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  // Mock Technician Pin (Progressive)
                  AnimatedPositioned(
                    duration: const Duration(seconds: 3),
                    curve: Curves.easeInOut,
                    top: _simulationStep == 0
                        ? 220
                        : _simulationStep == 1
                            ? 170
                            : _simulationStep == 2
                                ? 120
                                : 100,
                    left: _simulationStep == 0
                        ? 60
                        : _simulationStep == 1
                            ? 140
                            : _simulationStep == 2
                                ? 220
                                : 260,
                    child: Column(
                      children: const [
                        Icon(Icons.directions_car_filled, color: Colors.indigoAccent, size: 36),
                        Text('Technician', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  // Floating tracking details card
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Card(
                      color: AppTheme.backgroundDark.withOpacity(0.95),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_currentStateText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimaryDark)),
                                const SizedBox(height: 4),
                                Text('Ahmed Technician • ID: tech-1 • (${_techLat.toStringAsFixed(3)}, ${_techLng.toStringAsFixed(3)})', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 11)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(_etaText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.primaryAccent)),
                                Text(_distanceText, style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Timeline progress panel (Task 7)
          Expanded(
            flex: 3,
            child: Container(
              decoration: const BoxDecoration(
                color: AppTheme.backgroundDark,
                border: Border(top: BorderSide(color: AppTheme.borderDark, width: 1)),
              ),
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _timelineSteps.length,
                itemBuilder: (context, index) {
                  final step = _timelineSteps[index];
                  final isDone = step['isDone'];
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        children: [
                          Icon(
                            isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                            color: isDone ? AppTheme.success : AppTheme.borderDark,
                            size: 20,
                          ),
                          if (index < _timelineSteps.length - 1)
                            Container(
                              height: 30,
                              width: 2,
                              color: isDone ? AppTheme.success : AppTheme.borderDark,
                            ),
                        ],
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              step['name'],
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isDone ? FontWeight.bold : FontWeight.normal,
                                color: isDone ? AppTheme.textPrimaryDark : AppTheme.textMutedDark,
                              ),
                            ),
                            Text(
                              step['description'],
                              style: const TextStyle(fontSize: 11, color: AppTheme.textMutedDark),
                            ),
                            const SizedBox(height: 12),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
