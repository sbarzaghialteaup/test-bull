const Queue = require("bull");

const options = {
    limiter: {
        max: 10000,
        duration: 1000,
    },
};
const videoQueue = new Queue("video transcoding");

videoQueue.process(5, (job, done) => {
    console.log(`done ${job.data.index}`);
    done();
});

async function main() {
    // for (let index = 0; index < 100000; index++) {
    //     // eslint-disable-next-line no-await-in-loop
    //     videoQueue.add({ video: "http://example.com/video1.mov", index });
    // }
    // console.log("Jobs Aggiunti");
}

main();
