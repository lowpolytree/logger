const Logger = require("./logger");

const logger = new Logger('logs.json', 100 * 1024);

(async () => {
    try {
        // Reset the logs file
        const resetStatus = await logger.resetLogs();

        if (resetStatus === true) {
            console.log("Logs successfully reset");

            // Log some messages
            await logger.info("Scene started");
            await logger.info("Things are underway");
            await logger.warn("A potential issue occurred");
            await logger.error("An error occurred during execution");
            await logger.debug("Debugging information");
      
            // Fetch and display logs
            // const infoLogs = await logger.fetchLogsByLevel('info');
            // console.log('Info Logs:', infoLogs);

            const todayLogs = await logger.fetchLogsByDate('2024-09-16');
            console.log('Logs for today:', todayLogs);
        }
    } catch (error) {
        console.error("Failed to reset logs:", error.message);
    }
})();