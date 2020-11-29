const Queue = require("bull");

const videoQueue = new Queue("video transcoding");

async function main() {
    for (let index = 0; index < 100000; index++) {
        // eslint-disable-next-line no-await-in-loop
        videoQueue.add({ video: "http://example.com/video1.mov", index });
    }
    console.log("Jobs Aggiunti");
    await videoQueue.close();
}

main();
