import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const kbiBlue = Color(0xFF2563EB);
const kbiBlueDark = Color(0xFF1D4ED8);
const kbiNavy = Color(0xFF0B1220);
const kbiCyan = Color(0xFF06B6D4);
const kbiGreen = Color(0xFF10B981);
const kbiOrange = Color(0xFFF59E0B);
const kbiRed = Color(0xFFEF4444);
const kbiLabel = Color(0xFF0F172A);
const kbiSecondaryLabel = Color(0xFF64748B);
const kbiGroupedBackground = Color(0xFFF4F7FB);
const kbiSeparator = Color(0x1F475569);

/// A platform-adaptive theme that keeps Cupertino typography, sizing, motion,
/// and color conventions while retaining Material widgets used by the app.
ThemeData buildKbiTheme({bool highContrast = false}) {
  final scheme = ColorScheme.fromSeed(
    seedColor: kbiBlue,
    brightness: Brightness.light,
    primary: highContrast ? const Color(0xFF0056B3) : kbiBlue,
    secondary: kbiGreen,
    surface: Colors.white,
    error: kbiRed,
  ).copyWith(
    onPrimary: Colors.white,
    onSurface: kbiLabel,
    surfaceContainerLowest: Colors.white,
    surfaceContainerLow: const Color(0xFFF9F9FB),
    surfaceContainer: const Color(0xFFF2F2F7),
    surfaceContainerHigh: const Color(0xFFEFEFF4),
    outline: highContrast ? const Color(0xFF636366) : kbiSeparator,
    outlineVariant:
        highContrast ? const Color(0xFF8E8E93) : const Color(0x143C3C43),
  );

  const baseTextTheme = TextTheme(
    displaySmall: TextStyle(
      color: kbiLabel,
      fontSize: 34,
      height: 1.12,
      fontWeight: FontWeight.w700,
      letterSpacing: -1.1,
    ),
    headlineMedium: TextStyle(
      color: kbiLabel,
      fontSize: 28,
      height: 1.15,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.8,
    ),
    headlineSmall: TextStyle(
      color: kbiLabel,
      fontSize: 22,
      height: 1.2,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.35,
    ),
    titleLarge: TextStyle(
      color: kbiLabel,
      fontSize: 20,
      height: 1.25,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.25,
    ),
    titleMedium: TextStyle(
      color: kbiLabel,
      fontSize: 17,
      height: 1.3,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.15,
    ),
    bodyLarge: TextStyle(
      color: kbiLabel,
      fontSize: 17,
      height: 1.42,
      fontWeight: FontWeight.w400,
    ),
    bodyMedium: TextStyle(
      color: kbiSecondaryLabel,
      fontSize: 15,
      height: 1.4,
      fontWeight: FontWeight.w400,
    ),
    bodySmall: TextStyle(
      color: kbiSecondaryLabel,
      fontSize: 13,
      height: 1.35,
      fontWeight: FontWeight.w400,
    ),
    labelLarge: TextStyle(
      fontSize: 17,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.15,
    ),
    labelMedium: TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.05,
    ),
  );

  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: kbiGroupedBackground,
    useMaterial3: true,
    materialTapTargetSize: MaterialTapTargetSize.padded,
    visualDensity: VisualDensity.standard,
    textTheme: baseTextTheme,
    primaryTextTheme: baseTextTheme,
    cupertinoOverrideTheme: const CupertinoThemeData(
      brightness: Brightness.light,
      primaryColor: kbiBlue,
      primaryContrastingColor: Colors.white,
      scaffoldBackgroundColor: kbiGroupedBackground,
      barBackgroundColor: Color(0xE6F8FAFC),
      textTheme: CupertinoTextThemeData(primaryColor: kbiBlue),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
      },
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: kbiLabel,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      surfaceTintColor: Colors.transparent,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      titleTextStyle: TextStyle(
        color: kbiLabel,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.15,
      ),
    ),
    cardTheme: CardThemeData(
      color: Color(0xFFFEFEFF),
      elevation: 0,
      margin: EdgeInsets.zero,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: kbiSeparator,
      thickness: 0.5,
      space: 0.5,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: const Color(0xFFFDFDFE),
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(26)),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Color(0xFFF9F9FB),
      surfaceTintColor: Colors.transparent,
      modalBackgroundColor: Color(0xFFF9F9FB),
      showDragHandle: true,
      dragHandleColor: Color(0x4D3C3C43),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: Color(0xE61C1C1E),
      contentTextStyle: TextStyle(color: Colors.white, fontSize: 15),
      behavior: SnackBarBehavior.floating,
      elevation: 0,
      insetPadding: EdgeInsets.fromLTRB(16, 0, 16, 16),
      shape: StadiumBorder(),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      hintStyle: const TextStyle(color: Color(0xFF8E8E93), fontSize: 16),
      border: OutlineInputBorder(
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        borderSide: BorderSide(color: kbiBlue, width: 1.5),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        borderSide: BorderSide(color: kbiRed),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: kbiBlue,
        foregroundColor: Colors.white,
        disabledBackgroundColor: const Color(0xFFD1D1D6),
        disabledForegroundColor: const Color(0xFF8E8E93),
        elevation: 0,
        minimumSize: const Size(44, 50),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kbiBlue,
        side:
            BorderSide(color: highContrast ? kbiBlue : const Color(0x33787880)),
        minimumSize: const Size(44, 50),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: kbiBlue,
        minimumSize: const Size(44, 44),
        textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: kbiBlue,
        minimumSize: const Size.square(44),
        tapTargetSize: MaterialTapTargetSize.padded,
      ),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: const WidgetStatePropertyAll(Colors.white),
      trackColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected)
            ? kbiGreen
            : const Color(0xFFAEAEB2),
      ),
      trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: kbiBlue),
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: WidgetStatePropertyAll(
        highContrast ? const Color(0xFF636366) : const Color(0x4D3C3C43),
      ),
      thickness: const WidgetStatePropertyAll(3),
      radius: const Radius.circular(999),
    ),
  );
}
