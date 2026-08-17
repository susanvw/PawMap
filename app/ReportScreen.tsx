import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { API_URL } from './config';

type Species = 'Dog' | 'Cat' | 'Other';
type Coordinates = { latitude: number; longitude: number };

const SPECIES_OPTIONS: Species[] = ['Dog', 'Cat', 'Other'];

export default function ReportScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    captureLocation();
  }, []);

  async function captureLocation() {
    setLocationError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Location permission is required to report a found pet.');
      return;
    }
    const position = await Location.getCurrentPositionAsync();
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission is required to report a found pet.');
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

      if (!response.ok) {
        throw new Error(await response.text());
      }

      Alert.alert('Reported', 'Thanks for helping reunite this pet with their owner.');
      setPhotoUri(null);
      setSpecies(null);
      setComment('');
      captureLocation();
    } catch {
      Alert.alert('Could not submit report', 'Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = photoUri !== null && species !== null && location !== null && !submitting;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>I Found a Pet</Text>

      <Pressable style={styles.photoButton} onPress={takePhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoButtonText}>Take Photo</Text>
        )}
      </Pressable>

      <View style={styles.speciesRow}>
        {SPECIES_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.speciesButton, species === option && styles.speciesButtonSelected]}
            onPress={() => setSpecies(option)}
          >
            <Text
              style={[
                styles.speciesButtonText,
                species === option && styles.speciesButtonTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.comment}
        placeholder="Comment (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      {locationError && <Text style={styles.error}>{locationError}</Text>}

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={submit}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
    gap: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  photoButton: {
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speciesButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  speciesButtonSelected: {
    backgroundColor: '#2f6fed',
  },
  speciesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  speciesButtonTextSelected: {
    color: '#fff',
  },
  comment: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: '#c0392b',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2f6fed',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a9c0f5',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
