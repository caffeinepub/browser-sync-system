import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ClientSyncState {
    url: string;
    position: Cursor;
    syncEnabled: boolean;
}
export interface Cursor {
    x: number;
    y: number;
}
export type ClientId = bigint;
export interface backendInterface {
    createSession(): Promise<string>;
    disconnectClient(sessionId: string, clientId: ClientId): Promise<void>;
    getClientCount(sessionId: string): Promise<bigint>;
    getSessionInfo(sessionId: string): Promise<{
        masterConnected: boolean;
        clientCount: bigint;
        exists: boolean;
    }>;
    getSyncState(sessionId: string): Promise<{
        clientCount: bigint;
        master: ClientSyncState;
    }>;
    joinSession(sessionId: string): Promise<ClientId>;
    updateSyncState(sessionId: string, url: string, position: Cursor, syncEnabled: boolean): Promise<void>;
}
