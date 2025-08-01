# TOEIC Listening Practice

A modern React-based web application for practicing TOEIC listening skills with interactive audio exercises and transcript review.

## 🌟 Features

- Interactive audio player with playback controls
- Transcript viewer with synchronized text highlighting
- Dark/Light theme toggle
- Responsive design for all devices
- Multiple test sessions (Test_01 through Test_10)
- Modern UI with smooth animations

## 🚀 Live Demo

Visit the live application: [TOEIC Listening Practice](https://yourusername.github.io/toeic-listening-practice/)

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **CSS3** with CSS Variables for theming
- **ESLint** for code quality

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/toeic-listening-practice.git
cd toeic-listening-practice
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Build

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚀 Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Manual Deployment

You can also deploy manually using:

```bash
npm run deploy
```

### Setting up GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy on every push to the main branch

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AudioPlayer.tsx     # Audio playback component
│   ├── HomePage.tsx        # Home page component
│   ├── PracticePage.tsx    # Practice session component
│   ├── ThemeToggle.tsx     # Theme switcher component
│   ├── TranscriptRenderer.tsx # Transcript display component
│   └── HelpModal.tsx       # Help modal component
├── contexts/            # React contexts
│   └── ThemeContext.tsx    # Theme management context
├── assets/             # Static assets
└── App.tsx             # Main application component

public/
├── audios/             # Audio files (Test_01.mp3 - Test_10.mp3)
├── transcripts/        # Transcript JSON files
└── index.json          # Test sessions index
```

## 🎯 Usage

1. **Home Page**: Select a test session from the available options
2. **Practice Page**: 
   - Use the audio player to listen to the test
   - View synchronized transcripts
   - Navigate between different parts of the audio
   - Toggle between dark and light themes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Audio content for TOEIC practice
- React and Vite communities for excellent tooling
- Contributors and testers
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
#   e n v y i u 
 
 