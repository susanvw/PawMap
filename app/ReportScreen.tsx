import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { API_URL } from './config';
import { colors } from './theme';

type Species = 'Dog' | 'Cat' | 'Other';
type Coordinates = { latitude: number; longitude: number };
type LocationState = 'loading' | 'ready' | 'denied' | 'error';

const SPECIES_OPTIONS: Species[] = ['Dog', 'Cat', 'Other'];

export default function ReportScreen({ onViewMap }: { onViewMap: () => void }) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    captureLocation();
  }, []);

  async function captureLocation() {
    setLocation(null);
    setLocationState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationState('ready');
    } catch {
      setLocationState('error');
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera access needed',
        'PawMap needs the camera to photograph the pet you found. You can turn it on in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function submit() {
    if (!photoUri || !species || !location) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('species', species);
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
      if (comment.trim()) {
        formData.append('comment', comment.trim());
      }
      formData.append('photo', {
        uri: photoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(`${API_URL}/found-pets`, {
        method: 'POST',
        body: formData,
      });

      if (response.status >= 400 && response.status < 500) {
        Alert.alert('Could not submit report', 'Something in the report was rejected. Please check the photo and details and try again.');
        return;
      }
      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSubmitted(true);
    } catch {
      Alert.alert('Could not submit report', 'We couldn’t reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reportAnother() {
    setPhotoUri(null);
    setSpecies(null);
    setComment('');
    setSubmitted(false);
    captureLocation();
  }

  const canSubmit = photoUri !== null && species !== null && location !== null && !submitting;

  const missing: string[] = [];
  if (!photoUri) missing.push('a photo');
  if (!species) missing.push('the species');
  if (locationState === 'loading') missing.push('your location (still locating…)');
  else if (!location) missing.push('your location');

  if (submitted) {
    return (
      <View style={[styles.container, styles.confirmation, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.confirmationTitle}>Thank you!</Text>
        <Text style={styles.confirmationBody}>
          Your report is on the map. Thanks for helping reunite this pet with their owner.
        </Text>
        <Pressable
          style={styles.submitButton}
          onPress={onViewMap}
          accessibilityRole="button"
          accessibilityLabel="View on map"
        >
          <Text style={styles.submitButtonText}>View on map</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={reportAnother}
          accessibilityRole="button"
          accessibilityLabel="Report another pet"
        >
          <Text style={styles.secondaryButtonText}>Report another pet</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title} accessibilityRole="header">
          I Found a Pet
        </Text>

        <Pressable
          style={styles.photoButton}
          onPress={takePhoto}
          accessibilityRole="button"
          accessibilityLabel={photoUri ? 'Retake photo' : 'Take photo'}
        >
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <View style={styles.retakeBadge}>
                <Text style={styles.retakeBadgeText}>Tap to retake</Text>
              </View>
            </>
          ) : (
            <Text style={styles.photoButtonText}>Take Photo</Text>
          )}
        </Pressable>

        <View style={styles.speciesRow} accessibilityRole="radiogroup">
          {SPECIES_OPTIONS.map((option) => {
            const selected = species === option;
            return (
              <Pressable
                key={option}
                style={[styles.speciesButton, selected && styles.speciesButtonSelected]}
                onPress={() => setSpecies(option)}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ checked: selected }}
              >
                <Text style={[styles.speciesButtonText, selected && styles.speciesButtonTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={styles.comment}
          placeholder="Comment (optional)"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Comment, optional"
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <View style={styles.locationRow} accessibilityLiveRegion="polite">
          {locationState === 'loading' && (
            <>
              <ActivityIndicator size="small" />
              <Text style={styles.locationText}>Getting your location…</Text>
            </>
          )}
          {locationState === 'ready' && (
            <Text style={styles.locationText}>📍 Using your current location</Text>
          )}
          {locationState === 'denied' && (
            <View style={styles.locationProblem}>
              <Text style={styles.error}>
                Location access is needed so we can pin where the pet was found.
              </Text>
              <View style={styles.locationActions}>
                <Pressable
                  onPress={() => Linking.openSettings()}
                  accessibilityRole="button"
                  accessibilityLabel="Open Settings"
                >
                  <Text style={styles.link}>Open Settings</Text>
                </Pressable>
                <Pressable
                  onPress={captureLocation}
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <Text style={styles.link}>Try again</Text>
                </Pressable>
              </View>
            </View>
          )}
          {locationState === 'error' && (
            <View style={styles.locationProblem}>
              <Text style={styles.error}>We couldn’t find your location.</Text>
              <Pressable
                onPress={captureLocation}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={styles.link}>Try again</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.privacy}>
          The photo, your comment and the location will be visible to everyone on the map.
        </Text>

        {!canSubmit && !submitting && missing.length > 0 && (
          <Text style={styles.hint}>Still needed: {missing.join(', ')}.</Text>
        )}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit report"
          accessibilityState={{ disabled: !canSubmit, busy: submitting }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  photoButton: {
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  retakeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  retakeBadgeText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speciesButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  speciesButtonSelected: {
    backgroundColor: colors.primary,
  },
  speciesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  speciesButtonTextSelected: {
    color: colors.onPrimary,
  },
  comment: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  locationProblem: {
    alignItems: 'center',
    gap: 8,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 24,
  },
  link: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  privacy: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  submitButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  confirmation: {
    justifyContent: 'center',
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  confirmationBody: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 8,
  },
});
