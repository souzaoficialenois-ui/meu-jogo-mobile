/**
 * Instructions for Android Configuration
 * 
 * To ensure the soft keyboard does not resize or push your app UI off-screen on Android,
 * you need to modify your AndroidManifest.xml when using Capacitor, Cordova, or standard Android WebView.
 * 
 * 1. Open your Android project.
 * 2. Locate the file: android/app/src/main/AndroidManifest.xml
 * 3. Inside the <activity> tag for your MainActivity, add or change the `windowSoftInputMode` attribute:
 * 
 *    android:windowSoftInputMode="adjustNothing"
 * 
 * If you encounter issues with `adjustNothing`, an alternative fallback is:
 *    android:windowSoftInputMode="stateHidden|adjustNothing"
 * 
 * This guarantees the Android System UI will render the keyboard overlapping your Canvas and DOM without calculating layout resize events.
 */
