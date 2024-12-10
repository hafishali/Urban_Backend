const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../Models/User/UserModel'); // Assuming you have a User model
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID, // Facebook App ID
    clientSecret: process.env.FACEBOOK_APP_SECRET, // Facebook App Secret
    callbackURL: process.env.FACEBOOK_CALLBACK_URL, // Callback URL you will provide
    profileFields: ['id', 'displayName', 'emails'] // Fields to retrieve from Facebook
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the user already exists
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
            // If not, create a new user in your database
            user = await User.create({
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : '',
                facebookId: profile.id,
            });
        }
        // If the user exists or was just created, return the user
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));
// Serialize and deserialize user for session handling
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});