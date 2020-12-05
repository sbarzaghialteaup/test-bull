const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8089;

const Queue = require("bull");

const videoQueues = new Map();

function createQueue(customerName) {
    return new Promise((resolve, reject) => {
        const internalVideoQueue = new Queue(customerName, {
            limiter: {
                max: 1000,
                duration: 1000,
                bounceBack: false,
                prefix: "ccc",
            },
            redis: {
                // enableOfflineQueue: false,
                retryStrategy(times) {
                    const maxMilliseconds = 1000 * 60 * 2;
                    const randomWait = Math.floor(Math.random() * 1000);

                    const delay = Math.min(times * 50000 + randomWait, maxMilliseconds);
                    console.log(` Reconnecting after ${delay} milliseconds`);

                    return delay;
                },
            },
        });

        internalVideoQueue.client.on("ready", () => {
            console.log("Connesso a redis", customerName);
            resolve(internalVideoQueue);
        });

        internalVideoQueue.client.on("error", (error) => {
            console.log("Disconnesso da redis", customerName, error);
            reject(error);
        });
    });
}

async function addJob(req, res) {
    console.log("Arrivata richiesta aggiunta job", req.params.jobName);

    const videoQueue = videoQueues.get(req.params.jobName);

    if (videoQueue.client.status !== "ready") {
        console.log("Lo stato di redis è", videoQueue.client.status);
        res.status(500).send({ error: "Non è possibile aggiungere job in questo momento" });
    }

    try {
        const job = await videoQueue.add(
            {
                video: "http://example.com/video1.mov",
                index: 1,
                count: 1,
                jobName: req.params.jobName,
            },
            { removeOnComplete: 1000 }
        );
        try {
            res.type("json").send(JSON.stringify(job));
        } catch (_error) {
            return;
        }
        console.log("Aggiunto job", job.id);
    } catch (error) {
        console.log("Aggiunta di job rifiutata", error);
        try {
            res.status(500).send({ error: "Non è possibile aggiungere job in questo momento" });
        } catch (_error) {}
    }
}

async function initExpress() {
    const app = express();
    app.use(bodyParser.json());

    app.get("/connect/:jobName", (req, res) => {
        const videoQueue = videoQueues.get(req.params.jobName);
        videoQueue.client.connect();
        res.type("json").send(JSON.stringify(videoQueue.client.status));
    });

    app.get("/pause/:jobName", (req, res) => {
        const videoQueue = videoQueues.get(req.params.jobName);
        videoQueue.pause();
        res.type("json").send(JSON.stringify("pausing"));
    });

    app.get("/resume/:jobName", (req, res) => {
        const videoQueue = videoQueues.get(req.params.jobName);
        videoQueue.resume();
        res.type("json").send(JSON.stringify("resume..."));
    });

    app.get("/addJob/:jobName", addJob);

    return new Promise((resolve, _reject) => {
        app.listen(PORT, () => {
            console.log(`Listening to port ...${PORT}`);
            resolve();
        });
    });
}

function processJob(job, done) {
    let counter = 0;
    setTimeout(() => {
        console.log("Processato job", job.data.jobName, (counter += 1));
        done();
    }, 5000);
}

async function main() {
    try {
        await initExpress();
        for (let index = 0; index < 100; index++) {
            const customerName = `cliente-${index}`;
            // eslint-disable-next-line no-await-in-loop
            videoQueues.set(customerName, await createQueue(customerName));
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const videoQueue of videoQueues.values()) {
            videoQueue.process(5, processJob);
        }
    } catch (error) {
        console.error("Errore-------", error);
        process.exit(4);
    }
}

main();
