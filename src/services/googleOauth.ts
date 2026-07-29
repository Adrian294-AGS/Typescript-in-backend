import passport from "passport";
import { Strategy as GoogleStrategy} from "passport-google-oauth20";
import type { VerifyCallback } from "passport-google-oauth20";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env["GOOGLE_CLIENT_ID"] as string,
            clientSecret: process.env["GOOGLE_CLIENT_SECRET"] as string,
            callbackURL: process.env["GOOGLE_CALLBACK_URL"] as string,
        },
        async (
            accessToken: string,
            refreshToken: string,
            profile: any,
            done: VerifyCallback
        ): Promise<void> => {
            // Minimal verify callback: pass the profile through
            try {
                return done(null, profile);
            } catch (err) {
                return done(err as Error);
            }
        }
    )
);