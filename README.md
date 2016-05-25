[![npm version](https://badge.fury.io/js/steem-rpc.svg)](https://badge.fury.io/js/steem-rpc)

## steem-rpc

A simple websocket wrapper enabling RPC communication with the steem client `steemd` for node.js and browsers.

## Installation
An npm library might be made available once the library matures. For now, clone the repo, do npm install, then require/import the library.

```
git clone https://github.com/svk31/steem-rpc
cd steem-rpc
npm install
```

## Usage
By default the library will connect to Steemit's public websocket api at wss://steemit.com/ws. If you'd like to use another server, simply pass it in the options object:

```
const options = {
	url: "ws://localhost:9090"
}
```

The library needs to initialize a connection and retrieve some api references before it is ready to be used. A simple init and use case can be seen in example/example.js and can be launched with `npm run example`

```
const client = require("../index");

const options = {
	// user: "username",
	// pass: "password",
	// url: "ws://localhost:9090",
	// debug: false
};

var Api = new client(options);

Api.get().initPromise.then(response => {
	console.log("Api ready:", response);

	Api.get().dbApi().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
	})
});


```

This library borrows heavily from [James Calfee](https://github.com/jcalfee)'s websocket RPC implementation for the [Bitshares GUI](https://github.com/cryptonomex/graphene-ui/) which can be found here: https://github.com/cryptonomex/graphene-ui/tree/master/dl/src/rpc_api


### Available api commands

There's a handy "shortcut" api call that will get you a global state object:

```
get_state(string route)
```

You can call this with an empty string, or with a category like `trending`.

```
Api.get().dbApi().exec("get_state", ["trending"]).then(response => {
	console.log("get_state", response);
})
```

The following api calls are currently available from the steemd database api:

```
      // State
      // Blocks and transactions
      get_block_header(uint32_t block_num);
      get_block(uint32_t block_num);

      // Globals
      get_config();
      get_dynamic_global_properties();

      // Keys
      get_key_references( vector<public_key_type> key );

      // Accounts
      get_accounts( vector< string > names );
      get_account_references( account_id_type account_id );
      lookup_account_names(const vector<string>& account_names);
      lookup_accounts(const string& lower_bound_name, uint32_t limit);
      get_account_count();

      // Witnesses
      get_witnesses(const vector<witness_id_type>& witness_ids);
      get_witness_by_account( string account_name );
      lookup_witness_accounts(const string& lower_bound_name, uint32_t limit);
      get_witness_count()const;

      // Market
      get_order_book( uint32_t limit );

      // Authority / validation
      get_transaction_hex(const signed_transaction& trx);
      get_required_signatures( const signed_transaction& trx, const flat_set<public_key_type>& available_keys );
      get_potential_signatures( const signed_transaction& trx );
      verify_authority( const signed_transaction& trx );
      verify_account_authority( const string& name_or_id, const flat_set<public_key_type>& signers );
```

