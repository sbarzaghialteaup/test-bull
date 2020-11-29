const Queue = require("bull");

const options = {
    limiter: {
        max: 10000,
        duration: 1000,
    },
};
const videoQueue = new Queue("video transcoding");
let startTime = 0;
let count = 0;

function startTimer() {
    startTime = new Date();
}

function getSecondsFromStart() {
    const now = new Date();
    return now - startTime;
}

videoQueue.process(8, (job, done) => {
    // console.log(`done ${job.data.index}`);
    if (startTime === 0) {
        startTimer();
    }
    count += 1;
    done();
});

// Will listen globally, to instances of this queue...
videoQueue.on("global:drained", async () => {
    const delayed = await videoQueue.getDelayedCount();
    if (startTime > 0 && delayed === 0) {
        const usedTime = getSecondsFromStart();
        console.log(`Count ${count} ${usedTime.toLocaleString()} milliseconds`);
        startTime = 0;
        count = 0;
    }
});
