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

const PARALLEL_JOBS = 8;
videoQueue.process(PARALLEL_JOBS, (job, done) => {
    if (startTime === 0) {
        startTimer();
    }
    count += 1;
    done();
    if (count === job.data.count) {
        const usedTime = getSecondsFromStart();
        console.log(
            `Count ${count} Parallel jobs ${PARALLEL_JOBS} ${usedTime.toLocaleString()} milliseconds`
        );
        startTime = 0;
        count = 0;
    }
});
