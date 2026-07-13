# BypassNote Tauri Setup

This branch contains the Tauri configuration for the BypassNote desktop application.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.70 or later)
- [Node.js](https://nodejs.org/) (18 or later)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Rust if not already installed:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. Add Rust to your PATH:
   ```bash
   source $HOME/.cargo/env
   ```

## Running the App

### Development mode
```bash
npm run tauri dev
```

This will start the Tauri development server with hot reloading.

### Production build
```bash
npm run tauri build
```

This will create production builds for your current platform in the `src-tauri/target/release` directory.

## Project Structure

- `src-tauri/` - Rust source code and Tauri configuration
  - `main.rs` - Main Rust application entry point
  - `Cargo.toml` - Rust dependencies and package configuration
- `tauri.conf.json` - Tauri application configuration
- `package.json` - Node.js dependencies and scripts
- `www/` - Static web files (HTML, CSS, JS)

## Notes

- The Tauri configuration is set up to serve static files from the `www/` directory
- File system access is enabled for reading/writing files (needed for BypassNote functionality)
- The application window is configured with a default size of 1200x800

## Customizing

To customize the Tauri configuration:
1. Edit `tauri.conf.json` for application settings (window size, permissions, etc.)
2. Edit `src-tauri/main.rs` for custom Rust code and backend logic
3. Edit files in `www/` for the frontend application

## Building for Different Platforms

Tauri can build for Windows, macOS, and Linux from any platform. To build for all platforms:

```bash
npm run tauri build -- --target universal
```

Or specify a specific target:
```bash
npm run tauri build -- --target linux
npm run tauri build -- --target windows
npm run tauri build -- --target macos
```