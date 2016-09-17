var expect = require("expect.js");
var status;
const options = {
    // user: "username",
    // pass: "password",
    apis: ["database_api", "market_history_api", "network_broadcast_api"],
    debug: true,
    statusCallback: function(e) {status = e;}
};

var {Client} = require("../src/index");
var Api = Client.get(options, true);

describe("Db API", function ()  {
    this.timeout(10000);
    // Connect once for all tests //

    before(function() {
        return Api.initPromise;
    });

    beforeEach(function() {
        return Api.connect();
    });

    afterEach(function() {
        Api.close();
    });

    it("Get dynamic global object", function(done) {
        return Api.database_api().exec("get_dynamic_global_properties", [])
            .then(function(response) {
                expect(response.id).to.equal("2.0.0");
                done();
            }).catch(done);
    });

    it("Get trending state", function(done) {
        return Api.database_api().exec("get_state", ["trending"])
            .then(function(response) {
                done();
            }).catch(done);
    })

    it("Get block", function(done) {
        return Api.database_api().exec("get_block", [1])
            .then(function(response) {
                expect(response.previous).to.equal("0000000000000000000000000000000000000000");
                done();
            }).catch(done);
    })

    it("Get witness count", function(done) {
        return Api.database_api().exec("get_witness_count", [])
            .then(function(response) {
                expect(response).to.be.a('number');
                expect(response).to.be.above(0);
                done();
            }).catch(done);
    })

    it("Get order book", function(done) {
        return Api.database_api().exec("get_order_book", [10])
            .then(function(response) {
                expect(response.asks).to.be.an('array');
                expect(response.bids).to.be.an('array');
                done();
            }).catch(done);
    })

    it("Status callback", function() {
        expect(status).to.equal("open");
        Api.close();
        expect(status).to.equal("closed");
    });

    // it("Test timeout and reconnect", function(done) {
    //     console.log("api", Api.network_broadcast_api().apiId);
    //     this.timeout(70000);
    //     setTimeout(function() {
    //         console.log("api", Api.network_broadcast_api().apiId);
    //         done();
    //     }, 65000)
    // })
    //
    // it("Get potential signatures", function(done) {
    //
    //     return Api.database_api().exec("get_potential_signatures", [])
    //         .then(function(response) {
    //             console.log("Potential sigs:", response);
    //         })
    // });

});
