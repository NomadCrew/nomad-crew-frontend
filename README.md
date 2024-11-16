# NomadCrew - Frontend

## Overview

This repository contains the frontend code for NomadCrew, a mobile-first application designed for group travel coordination. Built with React Native and Expo, it provides a seamless experience across iOS and Android platforms.

## Features

- User Authentication & Profile Management
- Trip Planning & Management
- Live Location Sharing
- Expense Tracking & Splitting
- Real-time Chat & Media Sharing
- Offline Support
- Cross-platform Compatibility

## Tech Stack

- **Framework**: React Native
- **Development Platform**: Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Maps**: React Native Maps
- **Testing**: Jest & React Native Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

1. **Prerequisites**
   - Node.js 18+
   - npm/yarn
   - Expo CLI
   - iOS Simulator/Android Emulator

2. **Installation**
   ```bash
   # Clone repository
   git clone https://github.com/NomadCrew/nomad-crew-frontend.git
   
   # Install dependencies
   npm install
   
   # Start development server
   npm start
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure environment variables
   EXPO_PUBLIC_API_URL=your_api_url
   EXPO_PUBLIC_MAPS_API_KEY=your_maps_key
   ```

## Development Guidelines

- Follow React Native best practices
- Use TypeScript for type safety
- Implement responsive designs using React Native Paper
- Write unit tests for components
- Use Expo's development client for custom native modules

## Project Structure
```
nomad-crew-frontend/
├── app/                     # Expo Router screens
├── components/              # Reusable components
├── hooks/                   # Custom React hooks
├── services/               # API and business logic
├── store/                  # State management
├── theme/                  # Styling and theming
└── utils/                  # Helper functions
```

## Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Check types
npm run typescript
```

## Deployment

- **Development**: Automatic builds via GitHub Actions
- **Testing**: Preview builds for pull requests
- **Production**: App store submissions via EAS Build

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push branch (`git push origin feature/new-feature`)
5. Open pull request

## Contributors

<!-- CONTRIBUTORS-START -->
<!-- CONTRIBUTORS-END -->

## Community

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Updates**: [Join our Slack](https://join.slack.com/t/slack-les9847/shared_invite/zt-2a0dqjzvk-YLC9TQFBExNnPFsH9yAB6g)

## License

Apache License - See LICENSE file for details