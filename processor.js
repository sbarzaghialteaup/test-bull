module.exports = (job, done) => {
    for (let index = 0; index < 2000000; index++) {}

    if (job.data.index === 0) {
        done(null, { started: true });
        return;
    }
    if (job.data.index === job.data.count - 1) {
        console.log("FINE    ", new Date());
        done(null, { finished: true });
        return;
    }
    done();
};
