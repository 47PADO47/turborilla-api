import { BaseConstructorOptions, BaseInterface, BaseJson, FetchOptions } from "@/src/types/base";

abstract class Base implements BaseInterface {
    private readonly baseUrl: string;
    private readonly headers: Record<string, string>;
    private readonly baseJson: BaseJson;
    public debug: boolean;
    public authenticated: boolean;
    public readonly gameVersion: number;
    
    constructor(options: BaseConstructorOptions) {
        this.baseUrl = 'https://production-dot-turborillanet.appspot.com/';
        this.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'MadSkillsMX/4544 CFNetwork/1408.0.4 Darwin/22.5.0'
        }
        this.debug = options.debug || false;
        this.authenticated = false;
        this.gameVersion = options.gameVersion;

        this.baseJson = {
            "version": "1.0",
            "game": `madskillsmotocross${options.gameVersion}-release`,
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
    }

    async fetch<T>(_options: FetchOptions): Promise<T> {
        throw new Error('Not implemented');
    };

    log(...args: any[]) {
        if (!this.debug) return;
        return console.log(`[MadSkillsMx${this.gameVersion}]`, ...args);
    }

    error(message: string) {
        this.log(message);
        return Promise.reject(`${message} ❌`);
    }
}

export default Base;