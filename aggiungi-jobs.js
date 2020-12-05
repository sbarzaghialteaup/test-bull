const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8089;

const Queue = require("bull");

let videoQueue;

function syncCreateQueue(resolve, reject) {
    const internalVideoQueue = new Queue("sam", {
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
        console.log("Connesso a redis");
        resolve(internalVideoQueue);
    });

    internalVideoQueue.client.on("error", (error) => {
        console.log("Disconnesso da redis", error);
        reject(error);
    });
}

function createQueue() {
    return new Promise(syncCreateQueue);
}

async function addJob(req, res) {
    console.log("Arrivata richiesta aggiunta job", req.params.jobName);

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

    app.get("/connect", (_req, res) => {
        videoQueue.client.connect();
        res.type("json").send(JSON.stringify(videoQueue.client.status));
    });
    app.get("/pause", (_req, res) => {
        videoQueue.pause();
        res.type("json").send("pausing...");
    });
    app.get("/resume", (_req, res) => {
        videoQueue.resume();
        res.type("json").send("resume...");
    });
    app.get("/addJob/:jobName", addJob);

    return new Promise((resolve, _reject) => {
        app.listen(PORT, () => {
            console.log(`Listening to port ...${PORT}`);
            resolve();
        });
    });
}

async function main() {
    let counter = 0;
    try {
        await initExpress();
        videoQueue = await createQueue();

        videoQueue.process(5, (job, done) => {
            setTimeout(() => {
                console.log("Processato job", job.data.jobName, (counter += 1));
                done();
            }, 5000);
        });
    } catch (error) {
        console.error("Errore-------", error);
        process.exit(4);
    }
}

main();
