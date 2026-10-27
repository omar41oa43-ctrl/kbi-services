import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// The only non-semantic brand colours used throughout the technician app.
/// Shades are created with opacity, rather than introducing unrelated blues.
const kbiBrand = Color(0xFF1ECBC7);
const kbiWhite = Color(0xFFFFFFFF);
const kbiBlack = Color(0xFF081218);
const kbiSurface = Color(0xFF0F1C24);
const kbiSurfaceRaised = Color(0xFF142630);
const kbiSurfaceMuted = Color(0xFF1B333D);

// Kept as aliases so existing screens inherit the KBI palette consistently.
const kbiBlue = kbiBrand;
const kbiBlueDark = kbiBlack;
const kbiNavy = kbiBlack;
const kbiCyan = kbiBrand;
const kbiGreen = kbiBrand;
const kbiSuccess = Color(0xFF4ADE80);
const kbiOnBrand = Color(0xFF081218);
const kbiOrange = Color(0xFFFBBF24);
const kbiRed = Color(0xFFF87171);
const kbiLabel = kbiWhite;
const kbiSecondaryLabel = Color(0xFFADC0C7);
const kbiGroupedBackground = kbiBlack;
const kbiSeparator = Color(0xFF263943);

/// A platform-adaptive theme that keeps Cupertino typography, sizing, motion,
/// and color conventions while retaining Material widgets used by the app.
ThemeData buildKbiTheme({bool highContrast = false}) {
  final scheme = ColorScheme.fromSeed(
    seedColor: kbiBlue,
    brightness: Brightness.dark,
    primary: kbiBrand,
    secondary: kbiBrand,
    surface: kbiSurface,
    error: kbiRed,
  ).copyWith(
    onPrimary: kbiBlack,
    onSurface: kbiLabel,
    surfaceContainerLowest: kbiBlack,
    surfaceContainerLow: kbiSurface,
    surfaceContainer: kbiSurfaceRaised,
    surfaceContainerHigh: kbiSurfaceMuted,
    outline: kbiSeparator,
    outlineVariant: const Color(0x1F1ECBC7),
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
      brightness: Brightness.dark,
      primaryColor: kbiBlue,
      primaryContrastingColor: kbiBlack,
      scaffoldBackgroundColor: kbiGroupedBackground,
      barBackgroundColor: Color(0xF2030405),
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
      systemOverlayStyle: SystemUiOverlayStyle.light,
      titleTextStyle: TextStyle(
        color: kbiLabel,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.15,
      ),
    ),
    cardTheme: CardThemeData(
      color: kbiSurfaceRaised,
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
      backgroundColor: kbiSurfaceRaised,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(26)),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: kbiSurfaceRaised,
      surfaceTintColor: Colors.transparent,
      modalBackgroundColor: kbiSurfaceRaised,
      showDragHandle: true,
      dragHandleColor: Color(0x668CFEFA),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: kbiSurfaceRaised,
      contentTextStyle: TextStyle(color: Colors.white, fontSize: 15),
      behavior: SnackBarBehavior.floating,
      elevation: 0,
      insetPadding: EdgeInsets.fromLTRB(16, 0, 16, 16),
      shape: StadiumBorder(),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kbiSurfaceRaised,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      hintStyle: const TextStyle(color: kbiSecondaryLabel, fontSize: 16),
      labelStyle: const TextStyle(color: kbiSecondaryLabel),
      floatingLabelStyle: const TextStyle(color: kbiBrand),
      prefixIconColor: kbiSecondaryLabel,
      suffixIconColor: kbiSecondaryLabel,
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
        foregroundColor: kbiBlack,
        disabledBackgroundColor: const Color(0xFF20373A),
        disabledForegroundColor: const Color(0x99FFFFFF),
        elevation: 0,
        minimumSize: const Size(44, 50),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
        textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kbiBrand,
        foregroundColor: kbiOnBrand,
        minimumSize: const Size(44, 50),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: kbiSurface,
      indicatorColor: kbiBrand.withValues(alpha: 0.16),
      iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? kbiBrand
                : kbiSecondaryLabel,
          )),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected)
              ? kbiBrand
              : Colors.transparent),
      checkColor: const WidgetStatePropertyAll(kbiOnBrand),
      side: const BorderSide(color: kbiSecondaryLabel),
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: kbiBrand,
      selectionColor: kbiBrand.withValues(alpha: 0.25),
      selectionHandleColor: kbiBrand,
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kbiBlue,
        side: BorderSide(color: highContrast ? kbiBlue : kbiSeparator),
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
            : const Color(0xFF617578),
      ),
      trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: kbiBlue),
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: WidgetStatePropertyAll(
        highContrast ? const Color(0xFF8CFEFA) : const Color(0x661ECBC7),
      ),
      thickness: const WidgetStatePropertyAll(3),
      radius: const Radius.circular(999),
    ),
  );
}
