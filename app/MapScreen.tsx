import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from './config';
import { colors } from './theme';

type FoundPet = {
  id: number;
  species: string;
  photoUrl: string;
  comment: string | null;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
};

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function buildMapHtml(pets: FoundPet[]) {
  const markers = pets.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude }));
  const center = pets.length > 0 ? [pets[0].latitude, pets[0].longitude] : [0, 0];
  const zoom = pets.length > 0 ? 13 : 2;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${center[0]}, ${center[1]}], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    var markers = ${JSON.stringify(markers)};
    markers.forEach(function (m) {
      var marker = L.marker([m.lat, m.lng]).addTo(map);
      marker.on('click', function () {
        window.ReactNativeWebView.postMessage(String(m.id));
      });
    });
  </script>
</body>
</html>
`;
}

export default function MapScreen({ active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<FoundPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPet, setSelectedPet] = useState<FoundPet | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  const loadPets = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch(`${API_URL}/found-pets`);
      if (!response.ok) throw new Error(String(response.status));
      setPets(await response.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh whenever the tab is shown so new reports appear.
  useEffect(() => {
    if (active) loadPets();
  }, [active, loadPets]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [selectedPet]);

  if (loading) {
    return (
      <View style={styles.centered} accessibilityLabel="Loading map">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && pets.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.stateTitle}>Couldn’t load the map</Text>
        <Text style={styles.stateBody}>Check your connection and try again.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            loadPets();
          }}
          accessibilityRole="button"
          accessibilityLabel="Retry loading the map"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: buildMapHtml(pets) }}
        onMessage={(event) => {
          const petId = Number(event.nativeEvent.data);
          setSelectedPet(pets.find((p) => p.id === petId) ?? null);
        }}
      />

      {error && (
        <View style={[styles.banner, { top: insets.top + 8 }]} accessibilityLiveRegion="polite">
          <Text style={styles.bannerText}>Couldn’t refresh — showing the last loaded reports.</Text>
        </View>
      )}

      {!error && pets.length === 0 && (
        <View style={[styles.banner, { top: insets.top + 8 }]}>
          <Text style={styles.bannerText}>No pets reported yet.</Text>
        </View>
      )}

      <Modal
        visible={selectedPet !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPet(null)}
      >
        {selectedPet && (
          <View style={styles.details}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsSpecies} accessibilityRole="header">
                {selectedPet.species}
              </Text>
              <Pressable
                onPress={() => setSelectedPet(null)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>
            {photoFailed ? (
              <View style={[styles.detailsPhoto, styles.photoFallback]}>
                <Text style={styles.stateBody}>Photo unavailable</Text>
              </View>
            ) : (
              <Image
                source={{ uri: `${API_URL}${selectedPet.photoUrl}` }}
                style={styles.detailsPhoto}
                onError={() => setPhotoFailed(true)}
                accessibilityLabel={`Photo of the found ${selectedPet.species.toLowerCase()}`}
              />
            )}
            {selectedPet.comment && <Text style={styles.detailsComment}>{selectedPet.comment}</Text>}
            <Text style={styles.detailsTimestamp}>
              Reported {timeAgo(selectedPet.createdAt)} ·{' '}
              {new Date(selectedPet.createdAt).toLocaleString()}
            </Text>
            <Pressable
              style={[styles.closeButton, { marginBottom: insets.bottom }]}
              onPress={() => setSelectedPet(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: colors.background,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  stateBody: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bannerText: {
    color: colors.onPrimary,
    fontSize: 14,
  },
  details: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeX: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  detailsPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSpecies: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  detailsComment: {
    fontSize: 16,
    color: colors.text,
  },
  detailsTimestamp: {
    fontSize: 14,
    color: colors.textMuted,
  },
  closeButton: {
    marginTop: 'auto',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
