class SteemApi {

	constructor(wsRpc, apiName) {
		this.wsRpc = wsRpc;
		this.apiName = apiName;
	}

	init() {
		return this.wsRpc.getApiByName(this.apiName).then( response => {
			this.apiId = response;
			return this;
		})
	}

	exec(method, params) {
		return this.wsRpc.call([this.apiId, method, params]).catch(error => {
			console.error("SteemApi error:", method, params, JSON.stringify(error));
			throw new Error("SteemApi error:" + method + params + JSON.stringify(error))
		})
	}
}

module.exports = SteemApi;
