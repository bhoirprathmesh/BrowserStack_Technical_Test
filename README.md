# Real-Time Log Watcher

A simple system to mimic `tail -f` functionality for a remote append-only log file using:

- Server-Sent Events (SSE) for real-time push updates 
- A web client that displays the last 10 lines on load and updates live

---

## 🔧 Problem Statement

Build a system that:

1. **Monitors a remote log file** (on the same machine as the server).
2. **Streams real-time updates** to a web-based client.
3. **Displays the last 10 lines** on client load.
4. **Pushes new lines as they are appended**, without reloading or resending the entire file.
5. **Supports multiple clients simultaneously.**

### Constraints

- No off-the-shelf tailing libraries.
- No full-file retransmits.
- Real-time pushing (no polling).
- Single initial load of the client.
