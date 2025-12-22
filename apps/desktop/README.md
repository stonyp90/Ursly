# Ursly.io Desktop - GPU Metrics Monitor

A cross-platform desktop application built with [Tauri 2.0](https://v2.tauri.app/) that monitors GPU metrics while running AI models.

## Features

- **Real-time GPU Monitoring**: Track GPU utilization, memory usage, temperature, power consumption, and clock speeds
- **Multi-GPU Support**: Monitor all available GPUs simultaneously
- **System Metrics**: CPU, memory, network, and disk usage monitoring
- **Model Control**: Start and stop Ollama models directly from the app
- **Process Tracking**: View AI-related processes and their resource usage
- **Performance Charts**: Historical performance visualization with live updates
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust + Tauri 2.0
- **GPU Metrics**: NVML (NVIDIA), Metal (macOS), DirectX (Windows), wgpu (fallback)
- **System Metrics**: sysinfo crate
- **Charts**: Recharts

## Prerequisites

1. **Rust**: Install from [rustup.rs](https://rustup.rs/)
2. **Node.js**: v18 or later
3. **Tauri CLI**: `npm install -g @tauri-apps/cli`
4. **Platform-specific dependencies**:
   - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev`
   - **macOS**: Xcode Command Line Tools
   - **Windows**: Visual Studio Build Tools with C++ workload

## Development

```bash
# Navigate to desktop app
cd apps/desktop

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev
```

## Build

```bash
# Build for current platform
npm run tauri:build

# The installer will be in src-tauri/target/release/bundle/
```

## GPU Support

### NVIDIA GPUs
Enable NVIDIA metrics by building with the `nvidia` feature:

```bash
cargo build --release --features nvidia
```

Requires NVIDIA drivers and CUDA toolkit installed.

### AMD/Intel GPUs
Basic detection via wgpu. Full metrics coming soon.

### Apple Silicon
Metal-based metrics for M-series chips.

## Architecture

```
apps/desktop/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── styles/            # CSS styles
│   ├── types.ts           # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands.rs    # IPC commands
│   │   ├── gpu.rs         # GPU metrics collection
│   │   ├── system.rs      # System metrics
│   │   ├── lib.rs         # Library entry
│   │   └── main.rs        # Binary entry
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
└── package.json           # Node dependencies
```

## IPC Commands

| Command | Description |
|---------|-------------|
| `get_gpu_info` | Get information about all detected GPUs |
| `get_gpu_metrics` | Get current metrics for a specific GPU |
| `get_system_info` | Get system information (OS, CPU, memory) |
| `get_all_metrics` | Get combined metrics for dashboard |
| `start_model` | Start an Ollama model |
| `stop_model` | Stop the currently running model |
| `get_model_status` | Get status of running model |

## Events

| Event | Description |
|-------|-------------|
| `gpu-metrics` | Real-time GPU metrics updates (1s interval) |

## License

MIT - See [LICENSE](../../LICENSE)

