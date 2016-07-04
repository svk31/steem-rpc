var expect = require("expect.js");

const options = {
    // user: "username",
    // pass: "password",
    url: "ws://127.0.0.1:8090",
    apis: ["market_history_api"]
};

var Api = require("../src/index")(options);

describe("Market API", function ()  {
    this.timeout(10000);
    // Connect once for all tests // ws://localhost:8090
    it("Get market_history_api", function(done) {
        Api.get().initPromise.then(function(res) {
            expect(res[0]).to.equal("connected to market_history_api");
            done();
        }).catch(done)
    });

    it("get_order_book", function(done) {
        return Api.get().market_history_api().exec("get_order_book", [5])
            .then(function(response) {
                expect(response.bids.length).to.be.greaterThan(0);
                expect(response.asks.length).to.be.greaterThan(0);
                done();
            }).catch(done);
    });

    it("get_trade_history", function(done) {
        let startDateShort = new Date();
        let endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);

        return Api.get().market_history_api().exec("get_trade_history", [
            startDateShort.toISOString().slice(0, -5),
            endDate.toISOString().slice(0, -5),
            5
        ])
            .then(function(response) {
                expect(response.length).to.equal(5);
                done();
            }).catch(done);
    });


    it("get_market_history_buckets", function(done) {
        return Api.get().market_history_api().exec("get_market_history_buckets", [
        ])
        .then(function(response) {
            expect(response.length).to.be.greaterThan(0);
            done();
        }).catch(done);
    });

    it("get_market_history", function(done) {
        let startDateShort = new Date();
        let endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);

        return Api.get().market_history_api().exec("get_market_history", [
            300,
            startDateShort.toISOString().slice(0, -5),
            endDate.toISOString().slice(0, -5)
        ])
        .then(function(response) {
            expect(response.length).to.be.greaterThan(0);
            done();
        }).catch(done);
    });


});
