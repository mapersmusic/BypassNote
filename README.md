# BypassNote

<div align="center">
  <img src="assets/icon.png" alt="icon" width="200" />
</div>

## Overview

<div align="center">
  <img src="BypassNoteMobile.jpg" alt="BypassNoteMobile" width="200" />
</div>

![BypassNote UI](BypassNoteDesktop.png)

## Build web app

```sh
npm install

npm run build-proto
```

## Build app for android

> [!Important] 
> the android app is built from the web app. so, you need to build it before the android app

```sh
npx cap add android

npx cap sync

npx capacitor-assets generate

npx cap sync
```

Configure your Android SDK with the `ANDROID_SDK_ROOT` environment variable.

Example on Windows (replace `<your-user>` with your Windows username):

```powershell
setx ANDROID_SDK_ROOT "C:\Users\<your-user>\AppData\Local\Android\Sdk"
```

Then run:

```sh
npx cap run

npx cap build android
```

---

## Build desktop app with Tauri

This project includes Tauri configuration for building desktop applications (Windows, macOS, Linux).

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.90 or later, installed with `rustup`)
- [Node.js](https://nodejs.org/) (20 or later)
- Platform dependencies: WebView2 on Windows, Xcode Command Line Tools on macOS, and `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` and `patchelf` on Linux

Install the JavaScript dependencies once:

```bash
npm install
```

### Running the app

The protobuf files are generated automatically before each dev run and build.

#### Development mode
```bash
npm run dev
```

#### Production build
```bash
npm run build
```

Installers are written to `src-tauri/target/release/bundle/` (`msi`/`nsis` on Windows, `dmg`/`app` on macOS, `appimage`/`deb` on Linux).

### Project structure

```text
src-tauri/
  Cargo.toml          # Rust/Tauri application
  build.rs
  tauri.conf.json     # Tauri configuration
  capabilities/       # Window permissions
  icons/              # Generated app icons
  src/main.rs
www/                  # Frontend loaded by Tauri (frontendDist)
```

### Regenerating icons

Icons are generated from `assets/icon.png`:

```bash
npm run icons
```

### Building for all platforms

The GitHub Actions workflow automatically builds for Windows, macOS, and Linux. You can also build locally:

```bash
# Windows
npm run build -- --target x86_64-pc-windows-msvc

# macOS
npm run build -- --target universal-apple-darwin

# Linux
npm run build -- --target x86_64-unknown-linux-gnu
```