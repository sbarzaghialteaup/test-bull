const app = require("express")();
const { router } = require("bull-board");

const Queue = require("bull");
const { setQueues } = require("bull-board");

const PORT = process.env.PORT || 8090;

const videoQueue = new Queue("sam");

async function main() {
    setQueues([videoQueue]);

    app.use("/", router);

    app.listen(PORT, () => {
        console.log(`Listening to port ...${PORT}`);
    });
}

main();
