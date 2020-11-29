module.exports = (job, done) => {
    if (job.data.index === 0) {
        done(null, { started: true });
        return;
    }
    if (job.data.index === job.data.count - 1) {
        done(null, { finished: true });
        return;
    }
    done();
};
