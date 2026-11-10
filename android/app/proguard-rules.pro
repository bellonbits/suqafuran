# ProGuard & R8 optimization rules for Suqafuran (Capacitor Android)

# 1. Preserve Capacitor Core & Bridge
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# 2. Preserve all Capacitor Plugins and annotated PluginMethods
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# 3. Preserve JavaScript Interface methods on WebViews
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 4. Preserve Cordova plugin compatibility classes
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# 5. Preserve MainActivity and custom app classes
-keep class com.suqafuran.app.MainActivity { *; }

# 6. Keep stacktrace line numbers for Play Console crash vitals and symbol mapping
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
