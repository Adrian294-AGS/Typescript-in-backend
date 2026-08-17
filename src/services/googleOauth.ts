import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import { createUserOauth, findUserOauth, updateOauthRefreshToken } from "../model/userModel.js";

const GOOGLE_PROVIDER = "google";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env["GOOGLE_CLIENT_ID"] as string,
            clientSecret: process.env["GOOGLE_CLIENT_SECRET"] as string,
            callbackURL: process.env["GOOGLE_CALLBACK_URL"] as string,
        },
        async (
            _accessToken: string,
            refreshToken: string | undefined,
            profile: Profile,
            done: VerifyCallback
        ): Promise<void> => {
            try {
                const existingUser = await findUserOauth(profile.id, GOOGLE_PROVIDER);

                if (existingUser) {
                    if (refreshToken) {
                        await updateOauthRefreshToken(GOOGLE_PROVIDER, profile.id, refreshToken);
                    }
                    return done(null, existingUser);
                }

                const email = profile.emails?.[0]?.value ?? null;
                const username = profile.displayName ?? email ?? profile.id;

                await createUserOauth({
                    username,
                    email,
                    provider: GOOGLE_PROVIDER,
                    providerUserId: profile.id,
                    refreshToken: refreshToken ?? null,
                });

                const newUser = await findUserOauth(profile.id, GOOGLE_PROVIDER);
                return done(null, newUser ?? undefined);
            } catch (err) {
                return done(err as Error);
            }
        }
    )
);
