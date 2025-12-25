<div align="center">

# Ursly

### One Interface. All Your Storage.

**Cloud-native virtual file system built with Rust. Connect S3, Azure, GCS, NAS — browse them all from one place.**

<!-- Build & Test Status -->

[![CI](https://img.shields.io/github/actions/workflow/status/stonyp90/ursly/ci.yml?branch=main&label=CI&logo=github&style=flat-square)](https://github.com/stonyp90/ursly/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/stonyp90/ursly/test.yml?branch=main&label=Tests&logo=jest&style=flat-square)](https://github.com/stonyp90/ursly/actions/workflows/test.yml)
[![codecov](https://img.shields.io/codecov/c/github/stonyp90/ursly?logo=codecov&style=flat-square)](https://codecov.io/gh/stonyp90/ursly)

<!-- Release & Downloads -->

[![Release](https://img.shields.io/github/v/release/stonyp90/ursly?logo=github&style=flat-square)](https://github.com/stonyp90/ursly/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/stonyp90/ursly/total?logo=github&style=flat-square)](https://github.com/stonyp90/ursly/releases)

<!-- Tech Stack -->

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-dea584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-ffc131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app/)

<!-- License & Community -->

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Discord](https://img.shields.io/discord/1234567890?color=5865F2&label=Discord&logo=discord&logoColor=white&style=flat-square)](https://discord.gg/cree8)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/stonyp90/ursly/pulls)

<br />

[**Download**](https://github.com/stonyp90/ursly/releases/latest) &bull; [Website](https://ursly.io) &bull; [Documentation](./agents.md) &bull; [Discord](https://discord.gg/cree8)

</div>

---

## The Problem

Your files are everywhere. S3 for archives. Azure for production. NAS for local renders. Four different tools. Four different UIs. Scattered files, wasted time.

**Ursly fixes this.** One native app that connects to all your storage. Browse S3 buckets next to your local files. Drag files between providers. Search everything with AI. No cloud lock-in.

---

## Download

| Platform    | Download                                                                                            | Requirements                      |
| ----------- | --------------------------------------------------------------------------------------------------- | --------------------------------- |
| **macOS**   | [ursly-vfs.dmg](https://github.com/stonyp90/ursly/releases/latest/download/ursly-vfs.dmg)           | macOS 11+ (Apple Silicon & Intel) |
| **Windows** | [ursly-vfs.msi](https://github.com/stonyp90/ursly/releases/latest/download/ursly-vfs.msi)           | Windows 10/11                     |
| **Linux**   | [ursly-vfs.AppImage](https://github.com/stonyp90/ursly/releases/latest/download/ursly-vfs.AppImage) | glibc 2.31+                       |

---

## Screenshots

<p align="center">
  <img src="website/screenshots/vfs-file-browser.png" alt="Ursly VFS - Unified File Browser" width="800" />
</p>

<p align="center"><em>All your storage in one view — S3, Azure, GCS, NAS, local drives</em></p>

<p align="center">
  <img src="website/screenshots/vfs-shortcuts.png" alt="Ursly VFS - Keyboard Shortcuts" width="600" />
</p>

<p align="center"><em>Keyboard-first design — every action has a shortcut</em></p>

---

## Features

| Feature                      | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| **Multi-Cloud VFS**          | Connect S3, GCS, Azure Blob, SMB, NFS, SFTP, WebDAV, FSx for ONTAP   |
| **AI-Powered Search**        | Semantic search with Ollama running locally — no API costs           |
| **Cross-Provider Transfers** | Drag files between any storage provider                              |
| **Seamless Tier Migration**  | Move files between hot/warm/cold tiers in one click                  |
| **Keyboard-First**           | Full keyboard navigation, Vim-style bindings, customizable shortcuts |
| **Whisper Transcription**    | Transcribe videos in 99 languages, search by what was said           |
| **Live System Metrics**      | GPU, CPU, RAM monitoring with native Rust APIs                       |
| **Fully Customizable**       | Dark/light modes, 10 accent colors, layout presets                   |

---

## Quick Start

### Download the App (Recommended)

1. Download from [Releases](https://github.com/stonyp90/ursly/releases/latest)
2. Install and launch
3. Add your storage sources
4. Start browsing

### Build from Source

```bash
# Clone the repository
git clone https://github.com/stonyp90/ursly.git
cd ursly

# Install dependencies
npm install

# Run the VFS desktop app
cd apps/vfs-desktop
npm run tauri dev
```

---

## Storage Backends

| Provider                 | Status    | Features                                     |
| ------------------------ | --------- | -------------------------------------------- |
| **AWS S3**               | Supported | Transfer acceleration, versioning, lifecycle |
| **Google Cloud Storage** | Supported | Multi-region, bucket policies                |
| **Azure Blob Storage**   | Supported | Hot/cool/archive tiers                       |
| **FSx for ONTAP**        | Supported | NVMe cache, Fabric Pool tiering              |
| **SMB/CIFS**             | Supported | Windows shares, Active Directory             |
| **NFS**                  | Supported | NFSv3/v4, Unix permissions                   |
| **SFTP**                 | Supported | Key-based authentication                     |
| **WebDAV**               | Supported | HTTP-based file access                       |
| **Local**                | Supported | Direct filesystem with caching               |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Ursly VFS Desktop (Tauri + Rust)               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React UI  │  File Browser  │  Search  │  System Metrics  │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Rust Core (Native Performance)               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ VFS Engine  │ Storage SDK │ AI Search   │ GPU Metrics     │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         Storage Layer                           │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────────┐  │
│  │  S3   │ Azure │  GCS  │  NFS  │  SMB  │ SFTP  │   Local   │  │
│  └───────┴───────┴───────┴───────┴───────┴───────┴───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technologies                       |
| ------------ | ---------------------------------- |
| **Desktop**  | Tauri 2.0, Rust, wgpu              |
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **AI/ML**    | Ollama, Whisper, LLaMA 3           |
| **Build**    | Nx Monorepo, Vite                  |

---

## Project Structure

```
apps/
├── vfs-desktop/      # Tauri VFS desktop app (main product)
├── api/              # NestJS REST API (for team features)
├── web/              # React web dashboard
└── grpc/             # Ollama gRPC bridge

libs/
├── agent-core/       # Context window management
├── audit-logger/     # Type-safe audit logging
└── shared/           # Shared types and utilities

website/              # Landing page (ursly.io)
```

---

## Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Commit: `git commit -m 'feat: add my feature'`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

### Development Guidelines

- All new code requires tests
- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Run `npm run lint` before committing
- Update documentation for new features

---

## Roadmap

- [ ] Adobe Premiere Pro UXP plugin
- [ ] DaVinci Resolve integration
- [ ] VS Code extension
- [ ] S3 Glacier Deep Archive support
- [ ] Real-time collaboration
- [ ] Team sync features

---

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

This ensures the software remains open source and any modifications must also be open source. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with amazing open source projects:

- [Tauri](https://tauri.app/) — Desktop app framework
- [Ollama](https://ollama.ai/) — Local LLM inference
- [Whisper](https://github.com/openai/whisper) — Speech recognition
- [Rust](https://www.rust-lang.org/) — Systems programming

---

<div align="center">

**[ursly.io](https://ursly.io)** &bull; [Download](https://github.com/stonyp90/ursly/releases/latest) &bull; [Discord](https://discord.gg/cree8) &bull; [GitHub](https://github.com/stonyp90/ursly)

</div>
