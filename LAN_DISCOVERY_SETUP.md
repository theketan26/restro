# LAN Device Discovery & Data Exchange System

This system enables seamless device discovery and data exchange between your Stackrise desktop application and mobile application on the same WiFi network.

## Architecture Overview

### Desktop Application (Tauri)
- **HTTP Server**: Runs on port 5173 with REST API endpoints
- **mDNS Service**: Broadcasts device presence on the network using `_stackrise._tcp` service type
- **Device Info**: Provides device identification, IP address, and capabilities
- **Data Endpoints**: Handles incoming and outgoing data exchange

### Mobile Application (Expo/React Native)
- **Device Discovery**: Scans local network to find Stackrise devices
- **Device Connection**: Communicates with discovered devices via HTTP
- **Data Exchange**: Sends/receives messages, files, and user data

## Setup Instructions

### Desktop Application Setup

1. **Build the Tauri application**:
   ```bash
   cd desktop
   npm run tauri dev
   ```

2. **Check server logs**:
   The HTTP server will start automatically and log:
   ```
   Starting HTTP server on 192.168.x.x:5173
   mDNS service registered: Your-Device-Name on 192.168.x.x:5173
   ```

### Mobile Application Setup

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install --force  # --force may be needed for compatibility
   ```

2. **Start the Expo development server**:
   ```bash
   npm start
   ```

3. **Run on your device**:
   - iOS: Press `i` and open with Expo Go
   - Android: Press `a` or scan QR code with Expo Go
   - Web: Press `w`

## Usage Guide

### Discovering Devices on Mobile

1. Open the device discovery screen
2. Tap **"🔍 Scan Network"** to scan for available devices
   - This scans the first 50 IPs on your network (fast scan)
   - For slower networks or if device isn't found, use manual addition
3. Or manually add a device by:
   - Tap **"➕ Add Device"**
   - Enter the desktop's IP address (e.g., 192.168.1.100)

### Exchanging Data

1. From the device list, tap a device to open data exchange
2. Choose an action:
   - **Send Message**: Send text data to the device
   - **Sync User Data**: Synchronize user information
   - View device details (ID, type, version, URL)

## API Reference

### Device Discovery

#### Endpoint: `GET /api/device/info`
Returns device information for discovery.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Desktop-Computer",
    "device_type": "Desktop",
    "ip_address": "192.168.1.100",
    "port": 5173,
    "version": "0.1.0"
  }
}
```

#### Endpoint: `GET /api/health`
Health check endpoint.

**Response**: `200 OK` with "OK" body

### Data Exchange

#### Endpoint: `POST /api/data/send`
Send data to a device.

**Request Body**:
```json
{
  "from_device": "device-id-here",
  "data_type": "message|file|user_sync|custom",
  "content": {
    "text": "Hello from mobile!",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "received",
    "message": "Data received from Mobile. Type: message"
  }
}
```

#### Endpoint: `GET /api/data/receive`
Check for pending data.

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "No pending data",
    "device_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Code Examples

### Mobile - Discovering Devices

```typescript
import { DeviceDiscovery } from './src/components/device-discovery';

export function App() {
  return (
    <DeviceDiscovery
      onDeviceSelected={(device) => {
        console.log('Device selected:', device);
      }}
    />
  );
}
```

### Mobile - Sending Data

```typescript
import { sendMessageToDevice } from './src/services/data-exchange';

async function sendGreeting(device, fromDeviceId) {
  try {
    const response = await sendMessageToDevice(
      device.base_url,
      fromDeviceId,
      'Hello from mobile!'
    );
    console.log('Response:', response);
  } catch (error) {
    console.error('Failed to send:', error);
  }
}
```

### Desktop - Handling Incoming Data

To customize how your desktop app handles incoming data, modify the `send_data` handler in [src/server.rs](../../desktop/src-tauri/src/server.rs#L82):

```rust
async fn send_data(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<DataPayload>,
) -> (StatusCode, Json<ApiResponse<DataResponse>>) {
    // Your custom logic here
    tracing::info!(
        "Received data from {}: {}",
        payload.from_device,
        payload.data_type
    );

    // Process based on data_type
    match payload.data_type.as_str() {
        "message" => {
            // Handle message
        }
        "user_sync" => {
            // Handle user data sync
        }
        "file" => {
            // Handle file transfer
        }
        _ => {
            // Handle other types
        }
    }

    (
        StatusCode::OK,
        Json(ApiResponse::ok(DataResponse {
            status: "received".to_string(),
            message: "Data processed".to_string(),
        })),
    )
}
```

## Customization Guide

### Extending Data Types

To add new data types for exchange:

1. **Define in mobile service** ([src/services/data-exchange.ts](../mobile/src/services/data-exchange.ts)):
   ```typescript
   export async function sendCustomData(
     deviceBaseUrl: string,
     fromDeviceId: string,
     customData: any
   ) {
     return sendDataToDevice(
       deviceBaseUrl,
       fromDeviceId,
       'custom_type',
       customData
     );
   }
   ```

2. **Handle in desktop server** ([src-tauri/src/server.rs](../../desktop/src-tauri/src/server.rs)):
   ```rust
   match payload.data_type.as_str() {
       "custom_type" => {
           // Process custom data
       }
       _ => {}
   }
   ```

### Adding More Devices

The system can handle multiple devices. Each device:
- Has a unique ID (UUID)
- Registers on mDNS with its hostname
- Responds to HTTP requests on port 5173
- Can send/receive data independently

### Custom Network Configuration

Modify network parameters in:
- **Desktop**: [src-tauri/src/server.rs](../../desktop/src-tauri/src/server.rs) - Change `SERVER_PORT`
- **Mobile**: [src/services/device-discovery.ts](../mobile/src/services/device-discovery.ts) - Adjust `DISCOVERY_PORT` and scan range

## Troubleshooting

### Devices not discovered

1. **Verify network connectivity**:
   - Both devices on same WiFi network
   - Check firewall isn't blocking port 5173

2. **Check desktop app is running**:
   - Look for mDNS registration in logs
   - Server should be listening on `0.0.0.0:5173`

3. **Try manual addition**:
   - Note the desktop app's IP address
   - Use "Add Device" on mobile to manually enter it

### Network scanning is slow

- Current implementation scans first 50 IPs
- For full scan, modify `scanNetworkRange(1, 254)` in [use-device-discovery.ts](../mobile/src/hooks/use-device-discovery.ts)
- Add progress callback for UI feedback

### Data not reaching device

1. Check device IP and port are correct
2. Verify device is still running
3. Check logs on both applications
4. Ensure data payload is valid JSON

## Architecture Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│                    WiFi Network (LAN)                       │
└─────────────────────────────────────────────────────────────┘
                           ↑
              ┌────────────┼────────────┐
              │            │            │
         ┌────────┐    ┌────────┐  ┌────────┐
         │Desktop │    │Mobile  │  │Device N│
         │        │    │        │  │        │
         │┌──────┐│    │┌──────┐│  │        │
         ││HTTP  ││    ││Client ││  │        │
         ││5173  ││    ││Services││  │        │
         │└──────┘│    │└──────┘│  │        │
         │┌──────┐│    │┌──────┐│  │        │
         ││mDNS  ││    ││Device ││  │        │
         ││Advert││←───→│Discover││  │        │
         │└──────┘│    │└──────┘│  │        │
         └────────┘    └────────┘  └────────┘
```

## Performance Considerations

- **Network scan**: ~3-5 seconds for first 50 IPs
- **Device discovery**: Minimal overhead with mDNS
- **Data transfer**: Limited by network bandwidth
- **Concurrent connections**: HTTP server can handle multiple simultaneous requests

## Security Notes

- Currently operates on trusted LAN only
- No encryption for data in transit
- For production, consider adding:
  - TLS/HTTPS for data encryption
  - Device authentication/pairing
  - Data validation and sanitization
  - Rate limiting on API endpoints

## Future Enhancements

- [ ] mDNS service browser integration for auto-discovery
- [ ] Background sync capabilities
- [ ] Persistent device pairing
- [ ] Data queue for offline scenarios
- [ ] File transfer optimization
- [ ] Compression for large payloads
- [ ] End-to-end encryption
- [ ] Device groups and multi-casting
