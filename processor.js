module.exports = (job, done) => {
    console.log(`done ${job.data.index}`);
    done();
};
