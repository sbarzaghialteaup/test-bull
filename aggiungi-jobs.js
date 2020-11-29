const Queue = require("bull");

const videoQueue = new Queue("video transcoding");

async function main() {
    const jobs = Number(process.argv[2]);
    for (let index = 0; index < jobs; index++) {
        // eslint-disable-next-line no-await-in-loop
        videoQueue.add({ video: "http://example.com/video1.mov", index, count: jobs });
    }
    await videoQueue.close();
    console.log(`Jobs Aggiunti ${jobs}`);
}

main();
