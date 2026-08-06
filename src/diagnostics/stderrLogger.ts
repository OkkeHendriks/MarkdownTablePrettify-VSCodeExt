import { ILogger } from "./logger";
import { BaseLogger } from "./baseLogger";

export class StderrLogger extends BaseLogger implements ILogger {

    public logInfo(message: string): void {
        super.logIfEnabled(console.error, message);
    }

    public logError(error: string | Error): void {
        super.logIfEnabled(console.error, error);
    }
}
