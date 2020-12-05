const app = require("express")();
const { router } = require("bull-board");

const Queue = require("bull");
const { setQueues } = require("bull-board");

const PORT = process.env.PORT || 8090;

const videoQueues = new Map();

async function main() {
    for (let index = 0; index < 100; index++) {
        const customerName = `cliente-${index}`;
        // eslint-disable-next-line no-await-in-loop
        videoQueues.set(customerName, new Queue(customerName));
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const videoQueue of videoQueues.values()) {
        setQueues([videoQueue]);
    }

    app.use("/", router);

    app.listen(PORT, () => {
        console.log(`Listening to port ...${PORT}`);
    });
}

main();
