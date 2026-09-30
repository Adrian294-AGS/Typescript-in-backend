declare global {
    namespace Express {
        interface User {
            UID: string;
            username: string;
            role?: string;
        }
    }
}

export {};
