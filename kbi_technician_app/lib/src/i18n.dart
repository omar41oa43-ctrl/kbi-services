import 'package:flutter/widgets.dart';

String t(BuildContext context, String key) {
  final locale = Localizations.localeOf(context).languageCode;
  return _dict[locale]?[key] ?? _dict['en']?[key] ?? key;
}

const Map<String, Map<String, String>> _dict = {
  'en': {
    'login': 'Login',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'name': 'Name',
    'phone': 'Phone',
    'skills': 'Skills',
    'submit': 'Submit',
    'logout': 'Log out',
    'jobs': 'Jobs',
    'earnings': 'Earnings',
    'profile': 'Profile',
    'pending_approval_title': 'Approval Pending',
    'pending_approval_body': 'Your account is waiting for admin approval.',
    'subscription_required_title': 'Subscription Required',
    'subscription_required_body': 'Your subscription is inactive. Contact admin to activate.',
    'assigned_jobs': 'Assigned Jobs',
    'accept': 'Accept',
    'reject': 'Reject',
    'details': 'Details',
    'update_location': 'Update Location',
    'language': 'Language',
    'english': 'English',
    'arabic': 'Arabic',
    'error': 'Error',
  },
  'ar': {
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'name': 'الاسم',
    'phone': 'رقم الهاتف',
    'skills': 'المهارات',
    'submit': 'إرسال',
    'logout': 'تسجيل الخروج',
    'jobs': 'الطلبات',
    'earnings': 'الأرباح',
    'profile': 'الملف الشخصي',
    'pending_approval_title': 'بانتظار الموافقة',
    'pending_approval_body': 'حسابك بانتظار موافقة الإدارة.',
    'subscription_required_title': 'الاشتراك مطلوب',
    'subscription_required_body': 'اشتراكك غير نشط. تواصل مع الإدارة لتفعيله.',
    'assigned_jobs': 'الطلبات المسندة',
    'accept': 'قبول',
    'reject': 'رفض',
    'details': 'تفاصيل',
    'update_location': 'تحديث الموقع',
    'language': 'اللغة',
    'english': 'الإنجليزية',
    'arabic': 'العربية',
    'error': 'خطأ',
  },
};

