interface AuthenticatedUser {
    UID: number,
    username: string
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser
        }
    }
}