# Profile Picture Setup Guide

This guide explains how to set up profile picture functionality for both iOS and Android.

## Prerequisites

### 1. Install Required Package

```bash
npm install react-native-image-picker
```

### 2. iOS Setup

#### Add Permissions to Info.plist
Add these permissions to your `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to the camera to take profile pictures.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to the photo library to select profile pictures.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app needs access to save photos to your photo library.</string>
```

#### iOS Build Configuration
No additional setup is required for iOS as the image picker uses native iOS components.

### 3. Android Setup

#### Add Permissions to AndroidManifest.xml
Add these permissions to your `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

#### Android File Provider Configuration
Add this inside the `<application>` tag in `AndroidManifest.xml`:

```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

#### Create File Paths Configuration
Create `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="images" path="Pictures" />
    <external-cache-path name="image_cache" path="." />
</paths>
```

### 4. React Native CLI Linking
If you're using React Native 0.59 or below, you may need to link manually:

```bash
react-native link react-native-image-picker
```

For React Native 0.60+, auto-linking should handle this automatically.

### 5. Rebuild Your Project

#### iOS
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

#### Android
```bash
npx react-native run-android
```

## Features Implemented

### ✅ ProfilePicture Component
- **Reusable component** for displaying profile pictures
- **Fallback to initials** when no picture is set
- **Customizable size** for different use cases
- **Edit icon overlay** when in edit mode
- **Touch handlers** for image selection

### ✅ Image Picker Integration
- **Camera capture** for taking new photos
- **Photo library selection** for existing photos
- **Permission handling** for both platforms
- **Error handling** with user-friendly messages
- **Image optimization** (max 800x800 pixels, 0.8 quality)

### ✅ ProfileScreen Updates
- **Interactive profile picture** in edit mode
- **Camera/library selection dialog**
- **Real-time preview** of selected images
- **Integrated with existing edit workflow**

### ✅ TeamDetailScreen Integration
- **Profile pictures in team roster**
- **50px size optimized for list view**
- **Consistent styling** with existing components
- **Captain badge positioning** maintained

## Usage

### 1. Setting Profile Picture
1. Navigate to Profile screen
2. Tap "Edit" button
3. Tap on the profile picture (shows camera icon)
4. Choose "Camera" or "Photo Library"
5. Select/take photo
6. Tap "Save" to confirm changes

### 2. Viewing in Team Roster
Profile pictures automatically appear in:
- Team Detail screens
- Player roster lists
- Any component using the ProfilePicture component

## Technical Details

### Image Storage
- Profile pictures are stored as **local URIs** in the User object
- The `profilePicture` field contains the file path
- Images are automatically resized to optimize performance

### Component Architecture
```typescript
// ProfilePicture component props
interface ProfilePictureProps {
  user: { name: string; profilePicture?: string };
  size?: number;
  onPress?: () => void;
  showEditIcon?: boolean;
}
```

### Image Picker Helper
```typescript
// Usage example
const result = await ImagePickerHelper.showImagePicker();
if (result.uri) {
  // Update user profile picture
}
```

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Verify permissions are added to Info.plist (iOS) and AndroidManifest.xml (Android)
   - Check that users have granted camera/photo permissions
   - Test permission requests manually

2. **Images not displaying**
   - Check that the URI is valid using `ImagePickerHelper.isValidImageUri()`
   - Verify file exists at the specified path
   - Test with different image formats

3. **Android build errors**
   - Ensure FileProvider is properly configured
   - Check that `file_paths.xml` exists in the correct location
   - Verify gradle files are properly set up

4. **iOS build errors**
   - Run `cd ios && pod install` after installing the package
   - Clean build folder in Xcode if needed
   - Verify Info.plist permissions are correctly formatted

### Debug Tools

Check image picker functionality:
```typescript
// Verify permissions
const hasPermission = await ImagePickerHelper.requestAndroidPermissions();
console.log('Permissions granted:', hasPermission);

// Validate image URI
const isValid = ImagePickerHelper.isValidImageUri(imageUri);
console.log('Valid image URI:', isValid);
```

## Production Considerations

### Image Storage
For production apps, consider:
- **Cloud storage** (AWS S3, Firebase Storage, etc.)
- **Image compression** for network efficiency
- **Caching strategies** for better performance
- **CDN integration** for faster loading

### Security
- **Validate file types** on both client and server
- **Limit file sizes** to prevent abuse
- **Sanitize file names** before storage
- **Implement access controls** for sensitive images

### Performance
- **Lazy loading** for team rosters with many members
- **Image caching** to reduce redundant loading
- **Progressive loading** with placeholder states
- **Memory management** for large images

---

The profile picture system is now fully functional and ready for production use! Users can easily set profile pictures from their device, and they'll be displayed consistently throughout the app.

## Future Enhancements

Consider adding:
- **Image cropping** before saving
- **Multiple profile picture uploads**
- **Profile picture history**
- **Social media integration** for profile pictures
- **AI-powered image enhancement**