const Queue = require("bull");
const { log } = require("console");

const os = require("os");

const videoQueue = new Queue("video transcoding");
let startTime = 0;
let count = 0;

let startCpuUsage = {};
let endCpuUsage = {};

function startTimer() {
    startCpuUsage = os.cpus();
    startTime = new Date();
}

function getSecondsFromStart() {
    const now = new Date();
    return now - startTime;
}

function calculateUsedCPU(usedTime) {
    const CPUsUsage = [];

    for (let cpu = 0; cpu < os.cpus().length; cpu++) {
        const cpuUsage = {
            index: cpu,
            user: (endCpuUsage[cpu].times.user - startCpuUsage[cpu].times.user) / 10,
        };

        cpuUsage.userPerc = Math.trunc((100 * cpuUsage.user) / usedTime);

        CPUsUsage.push(cpuUsage);
    }

    const totalCpu = CPUsUsage.reduce(
        (accumulator, currentValue) => accumulator + currentValue.userPerc,
        0
    );

    return totalCpu / CPUsUsage.length;
}

function start() {
    console.log(`Counting up to ${job.data.count} with ${PARALLEL_JOBS} parallel jobs`);
    startTimer();
}

function end() {
    const usedTime = getSecondsFromStart();
    endCpuUsage = os.cpus();
    const avgCPU = calculateUsedCPU(usedTime);
    console.log(
        `Count ${count} Parallel jobs ${PARALLEL_JOBS} ${usedTime.toLocaleString()} milliseconds - CPU ${avgCPU}%`
    );
    startTime = 0;
    count = 0;
}

async function main(PARALLEL_JOBS, useThreads) {
    console.log(`Number of logical CPUs: ${os.cpus().length}`);
    console.log(`CPU Speed: ${os.cpus()[0].speed}MHz`);
    console.log();

    if (useThreads === "x") {
        videoQueue.process(PARALLEL_JOBS, "/home/sbarzaghi/test/test-bull/processor.js");

        videoQueue.on("completed", (job, result) => {
            if (result.started) {
                start();
            }
            if (result.finished) {
                end();
            }
        });
    } else {
        videoQueue.process(PARALLEL_JOBS, (job, done) => {
            count += 1;
            done();
            if (startTime === 0) {
                start();
            }
            if (count === job.data.count) {
                end;
            }
        });
    }
}

main(Number(process.argv[2]), process.argv[3]);
