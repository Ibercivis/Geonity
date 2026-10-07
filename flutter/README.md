# Geonity

A Flutter mobile application for geolocated observations and project management.

## Features

- Project browsing and management
- Interactive map with geolocated observations
- User profiles and authentication
- Bottom navigation with Projects, Map, and Profile sections

## Getting Started

### Prerequisites

- Flutter SDK (3.10.4 or higher)
- Android Studio or VS Code with Flutter extension
- Android SDK or iOS development environment

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── main.dart           # App entry point
├── screens/            # Screen widgets
│   └── home_screen.dart
├── widgets/            # Reusable widgets
├── services/           # API and data services
└── models/             # Data models
```

## Development

### Hot Reload

Flutter supports hot reload for rapid development. Save your files to see changes instantly.

### Building for Production

**Android:**
```bash
flutter build apk --release
```

**iOS:**
```bash
flutter build ios --release
```

## Dependencies

- `http` - HTTP client for API calls
- `shared_preferences` - Local storage
- `provider` - State management
- `go_router` - Navigation
- `cupertino_icons` - iOS-style icons

## License

See the [`LICENSE`](../LICENSE) at the repository root (MIT).

