import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_URL } from './config';

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

export default function MapScreen() {
  const [pets, setPets] = useState<FoundPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<FoundPet | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/found-pets`)
      .then((response) => response.json())
      .then(setPets)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
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

      <Modal
        visible={selectedPet !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPet(null)}
      >
        {selectedPet && (
          <View style={styles.details}>
            <Image source={{ uri: `${API_URL}${selectedPet.photoUrl}` }} style={styles.detailsPhoto} />
            <Text style={styles.detailsSpecies}>{selectedPet.species}</Text>
            {selectedPet.comment && <Text style={styles.detailsComment}>{selectedPet.comment}</Text>}
            <Text style={styles.detailsTimestamp}>
              {new Date(selectedPet.createdAt).toLocaleString()}
            </Text>
            <Pressable style={styles.closeButton} onPress={() => setSelectedPet(null)}>
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
  },
  details: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    gap: 12,
    backgroundColor: '#fff',
  },
  detailsPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  detailsSpecies: {
    fontSize: 22,
    fontWeight: '700',
  },
  detailsComment: {
    fontSize: 16,
    color: '#333',
  },
  detailsTimestamp: {
    fontSize: 14,
    color: '#888',
  },
  closeButton: {
    marginTop: 'auto',
    backgroundColor: '#2f6fed',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
