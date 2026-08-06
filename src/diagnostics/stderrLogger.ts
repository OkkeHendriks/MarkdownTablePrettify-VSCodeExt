import { ILogger } from "./logger";
import { BaseLogger } from "./baseLogger";

// MCP stdio reserves stdout for JSON-RPC messages, so diagnostics must use stderr.
export class StderrLogger extends BaseLogger implements ILogger {

    public logInfo(message: string): void {
        super.logIfEnabled(console.error, message);
    }

    public logError(error: string | Error): void {
        super.logIfEnabled(console.error, error);
    }
}
