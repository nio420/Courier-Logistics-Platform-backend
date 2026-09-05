import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import config from "../config";

passport.use(
	"google",
	new GoogleStrategy(
		{
			clientID: config.google_client_id as string,
			clientSecret: config.google_client_secret as string,
			callbackURL: config.google_callback_url as string,
		},
		async (
			_accessToken: string,
			_refreshToken: string,
			profile: Profile,
			done,
		) => {
			try {
				done(null, profile);
			} catch (error) {
				done(error, false);
			}
		},
	),
);

export default passport;
