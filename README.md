# Welcome to your Altimeter app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Connect Ardruino Mega with BMP180

   | BMP180 Pin | Arduino Mega 2560 Pin |
   |------------|-----------------------|
   | **VCC**    | **5V or 3.3V**        |
   | **GND**    | **GND**               |
   | **SCL**    | **SCL (Pin 21)**      |
   | **SDA**    | **SDA (Pin 20)**      |

2. Open Ardruino_Code.ino with Ardruino IDE and upload in Ardruino Mega

3. Install dependencies

   ```bash
   npm install
   ```
4. Start python
   
    ```bash
   python .\arduino_bridge.py
   ```

5. Tunnel local host via nrgx
   ```bash
   nrgx.exe http 8080
   ```    
6. Start the app in a different terminal

   ```bash
    npm start
   ```

7. In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).
