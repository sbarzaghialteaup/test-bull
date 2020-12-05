const express = require("express");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8089;

const Queue = require("bull");
const reconnectRedisNow = false;

const videoQueue = new Queue("sam", {
    redis: {
        enableOfflineQueue: false,
        retryStrategy(times) {
            const maxMilliseconds = 1000 * 60 * 2;
            const randomWait = Math.floor(Math.random() * 1000);

            const delay = Math.min(times * 50000 + randomWait, maxMilliseconds);
            console.log(` Reconnecting after ${delay} milliseconds`);

            return delay;
        },
    },
});

function createQueue() {
    videoQueue.client.on("ready", () => {
        console.log("Connesso a redis");
    });

    videoQueue.client.on("error", (error) => {
        console.log("Disconnesso da redis", error);
    });

    return videoQueue;
}

async function addJob(req, res) {
    console.log("Arrivata richiesta aggiunta job", req.params.jobName);

    if (videoQueue.client.status !== "ready") {
        console.log("Lo stato di redis è", videoQueue.client.status);
    }

    try {
        const job = await videoQueue.add({
            video: "http://example.com/video1.mov",
            index: 1,
            count: 1,
            jobName: req.params.jobName,
        });
        res.type("json").send(JSON.stringify(job));
        console.log("Aggiunto job", job.id);
    } catch (error) {
        console.log("Aggiunta di job rifiutata", error);
        console.log(videoQueue);
        res.status(500).send({ error: "Non è possibile aggiungere job in questo momento" });
    }
}

async function initExpress() {
    const app = express();
    app.use(bodyParser.json());

    app.get("/connect", (_req, _res) => {
        videoQueue.client.connect();
    });
    app.get("/addJob/:jobName", addJob);

    return new Promise((resolve, _reject) => {
        app.listen(PORT, () => {
            console.log(`Listening to port ...${PORT}`);
            resolve();
        });
    });
}

async function addJobs(jobs) {
    const promises = [];
    for (let index = 0; index < jobs; index++) {
        promises.push(
            videoQueue.add({ video: "http://example.com/video1.mov", index, count: jobs })
        );
    }

    const results = await Promise.allSettled(promises);
    console.log(`Jobs Aggiunti ${jobs}`);
}
async function main() {
    try {
        await initExpress();
        await createQueue();
    } catch (error) {
        console.error("Errore-------", error);
    }
}

main();
