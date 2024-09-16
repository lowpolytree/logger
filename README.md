# Logger

A simple, scalable logger class for Node.js applications that appends log entries to a file, supports log rotation, and allows fetching logs by level or date.

## Features

- Logs messages with timestamp, log level, and message.
- Supports log levels: `info`, `warn`, `error`, and `debug`.
- Automatically rotates the log file when it reaches a specified size (default: 1MB).
- Fetch logs by log level or by date.
- Efficient log writing and reading using streams.
