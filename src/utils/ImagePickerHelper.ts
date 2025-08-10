// utils/ImagePickerHelper.ts
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';

// Install: npm install react-native-image-picker
// For iOS: Add camera and photo library permissions to Info.plist
// For Android: Add camera and storage permissions to AndroidManifest.xml

interface ImagePickerResult {
  uri: string | null;
  error?: string;
}

export class ImagePickerHelper {
  // Request Android permissions
  static async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      return (
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Show image picker options
  static async showImagePicker(): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Profile Picture',
        'Choose how you want to select your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => this.openCamera(resolve),
          },
          {
            text: 'Photo Library',
            onPress: () => this.openImageLibrary(resolve),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ uri: null }),
          },
        ],
        { cancelable: true }
      );
    });
  }

  // Open camera
  private static async openCamera(callback: (result: ImagePickerResult) => void) {
    const hasPermission = await this.requestAndroidPermissions();
    if (!hasPermission) {
      callback({ uri: null, error: 'Camera permission denied' });
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      this.handleImagePickerResponse(response, callback);
    });
  }

  // Open image library
  private static async openImageLibrary(callback: (result: ImagePickerResult) => void) {
    const hasPermission = await this.requestAndroidPermissions();
    if (!hasPermission) {
      callback({ uri: null, error: 'Storage permission denied' });
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      this.handleImagePickerResponse(response, callback);
    });
  }

  // Handle image picker response
  private static handleImagePickerResponse(
    response: ImagePickerResponse,
    callback: (result: ImagePickerResult) => void
  ) {
    if (response.didCancel) {
      callback({ uri: null });
      return;
    }

    if (response.errorMessage) {
      console.error('ImagePicker Error:', response.errorMessage);
      callback({ uri: null, error: response.errorMessage });
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      if (asset.uri) {
        callback({ uri: asset.uri });
        return;
      }
    }

    callback({ uri: null, error: 'No image selected' });
  }

  // Validate image URI (basic check)
  static isValidImageUri(uri: string): boolean {
    if (!uri) return false;
    
    // Check if it's a valid URI format
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUri = uri.toLowerCase();
    
    return imageExtensions.some(ext => lowerUri.includes(ext)) || 
           uri.startsWith('file://') || 
           uri.startsWith('content://') ||
           uri.startsWith('http://') ||
           uri.startsWith('https://');
  }

  // Get file size (if needed for validation)
  static async getImageSize(uri: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      if (!uri) {
        resolve(null);
        return;
      }

      // This is a basic implementation
      // For more advanced use cases, you might want to use a library like react-native-image-size
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = uri;
    });
  }
}

// Export default for easier imports
export default ImagePickerHelper;