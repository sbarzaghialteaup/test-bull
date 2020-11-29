const Queue = require("bull");

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

async function main(PARALLEL_JOBS) {
    console.log(`Number of logical CPUs: ${os.cpus().length}`);
    console.log(`CPU Speed: ${os.cpus()[0].speed}MHz`);
    console.log();

    videoQueue.process(PARALLEL_JOBS, (job, done) => {
        if (startTime === 0) {
            console.log(`Counting up to ${job.data.count} with ${PARALLEL_JOBS} parallel jobs`);
            startTimer();
        }
        count += 1;
        done();
        if (count === job.data.count) {
            const usedTime = getSecondsFromStart();
            endCpuUsage = os.cpus();
            const avgCPU = calculateUsedCPU(usedTime);
            console.log(
                `Count ${count} Parallel jobs ${PARALLEL_JOBS} ${usedTime.toLocaleString()} milliseconds - CPU ${avgCPU}%`
            );
            startTime = 0;
            count = 0;
        }
    });
}

main(Number(process.argv[2]));
