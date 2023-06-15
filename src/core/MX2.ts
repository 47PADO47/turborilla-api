import { AbstractConstructorOptions, FetchOptions, FetchResponse } from "@/types/base";
import Base from "./base";
import { fetch } from "undici";

class MX2 extends Base {
    constructor(options: AbstractConstructorOptions) {
        super({
            ...options,
            gameVersion: 2,
        });
    }

    async fetch<T>(options: FetchOptions): Promise<T & FetchResponse> {

        this.log(`fetch (/${options.path}) - ${this.authenticated ? 'User 🔐' : 'Guest 🌐'}`);

        const json = this.encodeJson(this.mergeJson(options.body || {}));
        const response = await fetch(`${this.baseUrl}${options.path}`, {
            headers: this.headers,
            body: `json=${json}`,
            method: 'POST',
        });

        const data = await response.json()
            .catch(() => this.error('could not parse json')) as T & FetchResponse;

        if (data.result !== 'SUCCESS' || data.errorMessage.length > 0) return this.error(`${data.errorMessage} (${data.result})`);
        if (!response.ok) return this.error(`Response not ok (${response.status} - ${response.statusText})`);

        return data;
    }
}

export default MX2;