const options = {
    // user: "username",
    // pass: "password",
    apis: ["database_api", "follow_api"]
};

const {Client} = require("../src/index.js");
var Api = Client.get(options, true);

Api.initPromise.then(response => {
    console.log("response:", response);

    Api.follow_api().exec("get_followers", ["rainman", "", "blog", 100]).then(function(response){
      console.log("followers", response);
    });

});
