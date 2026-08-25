import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  final String orderId;
  const ChatScreen({super.key, required this.orderId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<Map<String, dynamic>> _messages = [
    {
      'sender': 'tech',
      'message': 'Hello! I am assigned to your repair request KBI-000001. I am heading to your location now.',
      'time': '10:00 AM'
    },
  ];

  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({
        'sender': 'customer',
        'message': text,
        'time': '10:02 AM',
      });
    });

    _textController.clear();
    _scrollToBottom();

    // Simulated reply from technician
    Timer(const Duration(seconds: 2), () {
      if (!mounted) return;
      setState(() {
        _messages.add({
          'sender': 'tech',
          'message': 'Received! I will be there in about 5 minutes. Thank you.',
          'time': '10:03 AM',
        });
      });
      _scrollToBottom();
    });
  }

  void _sendImage() {
    setState(() {
      _messages.add({
        'sender': 'customer',
        'message': '📷 Image Attachment Sent',
        'time': '10:03 AM',
        'isImage': true,
      });
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text('Ahmed Technician', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Active Repair • Online', style: TextStyle(fontSize: 11, color: AppTheme.success)),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/orders'),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16.0),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isCustomer = msg['sender'] == 'customer';
                return Align(
                  alignment: isCustomer ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isCustomer ? AppTheme.primaryAccent : AppTheme.surfaceDark,
                      border: Border.all(color: isCustomer ? Colors.transparent : AppTheme.borderDark),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: isCustomer ? const Radius.circular(16) : Radius.zero,
                        bottomRight: isCustomer ? Radius.zero : const Radius.circular(16),
                      ),
                    ),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (msg['isImage'] == true)
                          Row(
                            children: const [
                              Icon(Icons.image, color: Colors.white, size: 20),
                              SizedBox(width: 8),
                              Text('Sent Photo', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ],
                          )
                        else
                          Text(
                            msg['message'],
                            style: const TextStyle(color: AppTheme.textPrimaryDark, fontSize: 14),
                          ),
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Text(
                            msg['time'],
                            style: TextStyle(color: AppTheme.textMutedDark.withOpacity(0.6), fontSize: 10),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Input bar
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.surfaceDark,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.photo_outlined, color: AppTheme.primaryAccent),
                  onPressed: _sendImage,
                ),
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: AppTheme.primaryAccent),
                  onPressed: _sendMessage,
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
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
