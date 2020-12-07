const app = require("express")();
const { router } = require("bull-board");

const Queue = require("bull");
const { setQueues, BullAdapter } = require("bull-board");

const PORT = process.env.PORT || 8090;
const REDIS_URI = process.env.REDIS_URI || "redis://127.0.0.1:6379";

const videoQueues = new Map();

function createQueue(customerName) {
    const queue = new Queue(customerName, REDIS_URI);

    videoQueues.set(customerName, queue);

    queue.client.on("ready", () => {
        console.log("Connesso a redis", customerName);
    });
    queue.client.on("error", (error) => {
        console.log("Errore connessione a redis", customerName, error);
    });
}
async function main() {
    console.log(REDIS_URI);
    for (let index = 0; index < 100; index++) {
        createQueue(`cliente-${index}-handlingMoved`);
        createQueue(`cliente-${index}-residentTimes`);
        createQueue(`cliente-${index}-alarms`);
    }

    try {
        // eslint-disable-next-line no-restricted-syntax
        for (const queue of videoQueues.values()) {
            setQueues([new BullAdapter(queue)]);
        }
    } catch (error) {
        console.error(error);
    }

    app.use("/", router);

    app.listen(PORT, () => {
        console.log(`Listening to port ...${PORT}`);
    });
}

main();
