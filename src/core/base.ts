import { BaseConstructorOptions, BaseInterface, ApiRequestBody, FetchOptions, FetchResponse } from "@/src/types/base";
import { fetch } from "undici";

abstract class Base implements BaseInterface {
    private readonly baseUrl: string;
    private readonly headers: Record<string, string>;
    private readonly baseJson: ApiRequestBody;
    public debug: boolean;
    public authenticated: boolean;
    private readonly game: string;
    
    constructor(options: BaseConstructorOptions) {
        this.baseUrl = 'https://production-dot-turborillanet.appspot.com/';
        this.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MadSkillsMX/4544 CFNetwork/1408.0.4 Darwin/22.5.0'
        }
        this.debug = options.debug || false;
        this.authenticated = false;
        this.game = options.game;

        this.baseJson = {
            "version": "1.0",
            "game": `${options.game}-release`,
            "gameVersion": "2.35.4544",
            "platform": "ios",
            "language": "EN",
            "data": {
                "userId": options.userId,
            }
        };

        if (options.password) {
            this.baseJson.data['password'] = options.password;
            this.authenticated = true;
        }

        if (options.baseJson) {
            this.baseJson = Object.assign(this.baseJson, options.baseJson);
        }
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

    log(...args: any[]) {
        if (!this.debug) return;
        return console.log(`[MadSkills Wrapper] (${this.game})`, ...args);
    }

    error(message: string) {
        this.log(message);
        return Promise.reject(`${message} ❌`);
    }

    encodeJson(json: ApiRequestBody) {
        return encodeURIComponent(JSON.stringify(json));
    }

    mergeJson(json: Record<string, string>) {
        return {
            ...this.baseJson,
            ...json,
        }
    }
}

export default Base;