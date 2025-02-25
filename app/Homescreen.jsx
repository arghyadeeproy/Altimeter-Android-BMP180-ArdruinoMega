import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const Header = ({ onRefresh }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Image
          style={styles.icon}
          source={require('./../assets/images/Menu.png')}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRefresh}>
        <Image
          style={styles.icon}
          source={require('./../assets/images/Refresh cw.png')}
        />
      </TouchableOpacity>
    </View>
  );
};

const AltitudeCircle = ({ altitude }) => {
  return (
    <View style={styles.altitudeCircle}>
      <Text style={styles.altitudeText}>
        {altitude !== null ? `${altitude}m` : 'Loading...'}
      </Text>
    </View>
  );
};

const LatLonDisplay = ({ latitude, longitude }) => {
  return (
    <View style={styles.latLonContainer}>
      <Text style={styles.latLonText}>
        Latitude : {latitude ? latitude.toFixed(6) : 'N/A'}
      </Text>
      <Text style={styles.latLonText}>
        Longitude : {longitude ? longitude.toFixed(6) : 'N/A'}
      </Text>
    </View>
  );
};

const AltitudeTimeGraph = ({ altitudeData }) => {
  const chartConfig = {
    backgroundGradientFrom: '#2c2c2c',
    backgroundGradientTo: '#2c2c2c',
    color: (opacity = 1) => `rgba(184, 221, 231, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  // Only show last 6 data points if we have more than 6
  const displayData = altitudeData.length > 6 
    ? altitudeData.slice(altitudeData.length - 6) 
    : altitudeData;

  const data = {
    labels: displayData.map((item, index) => `${index*30}s`),
    datasets: [
      {
        data: displayData.map(item => parseFloat(item)),
        color: (opacity = 1) => `rgba(184, 221, 231, ${opacity})`,
      }
    ]
  };

  return (
    <View style={styles.graphContainer}>
      <Text style={styles.graphTitle}>Altitude Over Time</Text>
      {altitudeData.length > 0 ? (
        <BarChart
          data={data}
          width={width - 40}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero={true}
          showValuesOnTopOfBars={true}
          withInnerLines={true}
          style={styles.chart}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Collecting altitude data...</Text>
        </View>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [altitude, setAltitude] = useState(null);
  const [altitudeHistory, setAltitudeHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('wss://cb91-115-187-57-201.ngrok-free.app');

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const timerRef = useRef(null);
  const lastAltitude = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Allow location permissions to use this feature.'
        );
      } else {
        getCurrentLocation();
      }
    })();
    connectWebSocket();

    // Set up timer to record altitude data every 30 seconds
    timerRef.current = setInterval(() => {
      if (lastAltitude.current !== null) {
        setAltitudeHistory(prev => [...prev, lastAltitude.current]);
        console.log('Added altitude to history:', lastAltitude.current);
      }
    }, 30000);

    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const connectWebSocket = () => {
    if (ws.current) ws.current.close();
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    try {
      ws.current = new WebSocket(serverUrl);
      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connection established');
      };
      ws.current.onmessage = (event) => {
        console.log("Received raw data:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.altitude !== undefined) {
            const altitudeValue = data.altitude.toFixed(2);
            setAltitude(altitudeValue);
            lastAltitude.current = altitudeValue; // Store the latest altitude
            console.log("Updated altitude:", altitudeValue);
          }
          if (data.error) {
            console.log('Arduino error:', data.error);
            Alert.alert('Sensor Error', data.error);
          }
        } catch (error) {
          console.log('Error parsing WebSocket data:', error, 'Raw data:', event.data);
        }
      };
      ws.current.onerror = (error) => {
        console.log('WebSocket error:', error);
      };
      ws.current.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket connection closed', event.code, event.reason);
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };
    } catch (error) {
      console.log('Error creating WebSocket:', error);
      reconnectTimeout.current = setTimeout(connectWebSocket, 3000);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to get location.');
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Header onRefresh={getCurrentLocation} />
        <Image
          style={styles.mountainImage}
          source={require('./../assets/images/image 1.png')}
        />
        <AltitudeCircle altitude={altitude} />
        <LatLonDisplay latitude={latitude} longitude={longitude} />
        <View style={[
          styles.connectionIndicator, 
          { backgroundColor: isConnected ? '#4caf50' : '#f44336' }
        ]}>
          <Text style={styles.connectionText}>
            {isConnected ? 'Connected to Arduino' : 'Not connected to Arduino'}
          </Text>
        </View>
        <View style={styles.serverUrlContainer}>
          <TextInput
            style={styles.serverUrlInput}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="WebSocket URL"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => connectWebSocket()}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>
        
        {/* Altitude vs Time Graph */}
        <AltitudeTimeGraph altitudeData={altitudeHistory} />
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#1d1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1d1a1a',
    alignItems: 'center',
    paddingBottom: 30,
  },
  header: {
    height: 50,
    width: width - 20,
    marginTop: 10,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  icon: {
    width: 30,
    height: 30,
  },
  mountainImage: {
    marginTop: 30,
    width: 78,
    height: 38,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  altitudeCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#B8DDE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  altitudeText: {
    fontSize: 48,
    color: '#000',
    fontWeight: 'bold',
  },
  latLonContainer: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
    width: 300,
    height: 100,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  latLonText: {
    color: '#fff',
    fontSize: 16,
  },
  connectionIndicator: {
    marginTop: 20,
    padding: 8,
    borderRadius: 5,
    width: 300,
    alignItems: 'center',
  },
  connectionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  serverUrlContainer: {
    flexDirection: 'row',
    marginTop: 20,
    width: 300,
  },
  serverUrlInput: {
    flex: 3,
    backgroundColor: '#2c2c2c',
    color: 'white',
    padding: 10,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  graphContainer: {
    marginTop: 30,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 15,
    width: width - 40,
  },
  graphTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#B8DDE7',
    fontSize: 16,
  },
});