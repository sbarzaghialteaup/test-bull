const app = require("express")();
const { router } = require("bull-board");

const Queue = require("bull");
const { setQueues } = require("bull-board");

const PORT = process.env.PORT || 8090;
const REDIS_URI = process.env.REDIS_URI || "redis://127.0.0.1:6379";

const videoQueues = new Map();

async function main() {
    console.log(REDIS_URI);
    for (let index = 0; index < 100; index++) {
        let customerName = `cliente-${index}-handlingMoved`;
        // eslint-disable-next-line no-await-in-loop
        videoQueues.set(customerName, new Queue(customerName, REDIS_URI));

        videoQueues.get(customerName).client.on("ready", () => {
            console.log("Connesso a redis", customerName);
        });
        videoQueues.get(customerName).client.on("error", (error) => {
            console.log("Errore connessione a redis", customerName, error);
        });

        customerName = `cliente-${index}-residentTimes`;
        // eslint-disable-next-line no-await-in-loop
        videoQueues.set(customerName, new Queue(customerName));

        customerName = `cliente-${index}-alarms`;
        // eslint-disable-next-line no-await-in-loop
        videoQueues.set(customerName, new Queue(customerName));
    }

    // eslint-disable-next-line no-restricted-syntax
    try {
        setQueues([videoQueues.values()]);
    } catch (error) {
        console.error(error);
    }

    app.use("/", router);

    app.listen(PORT, () => {
        console.log(`Listening to port ...${PORT}`);
    });
}

main();
