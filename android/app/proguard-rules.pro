# Capacitor Proguard Rules

# Keep Capacitor Bridge and classes
-keep class com.getcapacitor.** { *; }

# Keep JavaScript interfaces so they don't get stripped by minification
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Cordova plugins and wrapper classes
-keep class org.apache.cordova.** { *; }
