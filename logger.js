const fs = require("fs");
const path = require("path");
const readline = require("readline");

class Logger {
  constructor(logFilePath = "logs.json", maxFileSize = 1 * 1024 * 1024) {
    // 1 MB max file size
    if (Logger.instance) {
      return Logger.instance;
    }

    this.logFilePath = path.join(__dirname, logFilePath);
    this.maxFileSize = maxFileSize;
    this.stream = null;
    Logger.instance = this;

    // Initialize the log file if it doesn't exist and create a write stream
    this._initializeLogFile();

    return this;
  }

  _initializeLogFile() {
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "");
    }

    this.stream = fs.createWriteStream(this.logFilePath, { flags: "a" });
  }

  async _rotateLogs() {
    const stats = await fs.promises.stat(this.logFilePath);
    if (stats.size >= this.maxFileSize) {
      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const rotatedLogFile = this.logFilePath.replace(
        "logs.json",
        `logs-${timestamp}.json`
      );

      this.stream.end(); // Close the current stream
      await fs.promises.rename(this.logFilePath, rotatedLogFile); // Rename the log file
      this.stream = fs.createWriteStream(this.logFilePath, { flags: "a" }); // Recreate the stream
    }
  }

  // Appends a new log entry to the log file as a JSON object on a new line
  async log(message, level = "info") {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: message,
    };

    await this._rotateLogs(); // Check if log rotation is needed

    const logString = JSON.stringify(logEntry) + "\n"; // Each log entry on a new line
    //this.stream.write(logString); // Append the log to the file
    return new Promise((resolve, reject) => {
      this.stream.write(logString, (err) => {
        if (err) {
          return reject(err); // Reject the promise if there's an error
        }
        resolve(); // Resolve the promise when the write is complete
      });
    });
  }

  // Reads logs line by line without loading the entire file into memory
  async readLogs() {
    const fileStream = fs.createReadStream(this.logFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // Recognize all instances of CR LF ('\r\n') as a single line break
    });

    const logs = [];

    for await (const line of rl) {
      try {
        logs.push(JSON.parse(line)); // Parse each line as JSON
      } catch (err) {
        console.error("Error parsing log line:", line, err);
      }
    }

    return logs;
  }

  async resetLogs() {
    return new Promise((resolve, reject) => {
      this.stream.end(() => {
        // Close the current stream
        fs.promises
          .writeFile(this.logFilePath, "") // Clear the file
          .then(() => {
            this.stream = fs.createWriteStream(this.logFilePath, { flags: "a", }); // Recreate the stream
            resolve(true); // Return true for success
          })
          .catch((err) => reject(new Error(`Error resetting logs: ${err}`))); // Throw an error on failure
      });
    });
  }

  async fetchLogsByLevel(level) {
    const logs = await this.readLogs();
    return logs
      .filter((log) => log.level === level.toUpperCase()) // Filter logs by level
      .map((log) => `${log.timestamp} -- ${log.message}`); // Return formatted output: timestamp -- message
  }

  async fetchLogsByDate(dateString) {
    const logs = await this.readLogs();
    const targetDate = new Date(dateString).toISOString().slice(0, 10); // Extract 'YYYY-MM-DD'

    //console.log('Target date:', targetDate); // Log the target date for comparison

    return logs
      .filter((log) => {
        const logDate = new Date(log.timestamp).toISOString().slice(0, 10); // Extract 'YYYY-MM-DD' from the log timestamp
        //console.log('Log date:', logDate, 'Timestamp:', log.timestamp); // Log the log date and timestamp
        return logDate === targetDate;
      }) // Filter logs by date
      .map((log) => `${log.timestamp} -- ${log.message}`); // Return formatted output: timestamp -- message
}


  // Convenience methods for logging different levels
  error(message) {
    this.log(message, "error");
  }
  info(message) {
    this.log(message, "info");
  }
  debug(message) {
    this.log(message, "debug");
  }
  warn(message) {
    this.log(message, "warn");
  }
}

module.exports = Logger;
