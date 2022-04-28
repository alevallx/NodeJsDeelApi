/* eslint-disable no-undef */
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');

chai.should();
chai.use(chaiHttp);

before(function(done){
    console.log('---------\n-- INIT TEST => Routes.Get \n------------');
    // app.then(value =>{
    //     request = value;
    //     done();
    // });
    done();
});

after(function(done){
    console.log('---------\n-- END TEST => Routes.Get \n------------');
    done();
});

describe('GET contracts/:id', function(){
    it('1 - succesfull response', function(done){
        const contractId = 6;
        const profileId = 7;

        chai.request(app)
            .get('/contracts/' + contractId)
            .set('profile_id',profileId)
            .end((err, result) => {
                result.should.have.status(200);
                Array.isArray(result.body.result);
                done();
            });
    });
});

describe('GET contracts/:id', function(){
    it('2 - No contract id found', function(done){
        const contractId = 999;
        const profileId = 7;

        chai.request(app)
            .get('/contracts/' + contractId)
            .set('profile_id',profileId)
            .end((err, result) => {
                result.should.have.status(404);
                !Array.isArray(result.body.result);
                done();
            });
    });
});

describe('GET admin/best-clients', function(){
    it('3 - succesfull response with default limit', function(done){
        const startDate = '2020-08-10';
        const endDate = '2020-08-20';

        chai.request(app)
            .get('/admin/best-clients?start=' + startDate + '&end=' + endDate)
            .end((err, result) => {
                result.should.have.status(200);
                Array.isArray(result.body.result);
                result.body.should.have.length(2);
                done();
            });
    });
});

describe('GET admin/best-clients', function(){
    it('4 - Error parameter endDate not sent', function(done){
        const startDate = '2020-08-10';

        chai.request(app)
            .get('/admin/best-clients?start=' + startDate )
            .end((err, result) => {
                result.should.have.status(404);
                done();
            });
    });
});

describe('GET admin/best-clients', function(){
    it('5 - Error too high range of dates', function(done){
        const startDate = '9020-08-10';
        const endDate = '9020-08-20';

        chai.request(app)
            .get('/admin/best-clients?start=' + startDate + '&end=' + endDate)
            .end((err, result) => {
                result.should.have.status(200);
                result.body.should.have.length(0);
                done();
            });
    });
});



