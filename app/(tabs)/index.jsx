import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '.././Homescreen'; // Adjust the path as needed

const Drawer = createDrawerNavigator();

export default function App() {
  return (
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}  // Disables the default header
      >
        <Drawer.Screen name="Home" component={HomeScreen} />
      </Drawer.Navigator>
  );
}
