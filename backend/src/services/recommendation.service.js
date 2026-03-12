import Property from "../models/property.model";
import User from "../models/user.model";

// Logic for recommendartrion engine
// calculates match percentage based on user lifestyle vs property amenities

export const getSmartMatches = async (userId) => {
    const user = await User.findById(userId);
    if(!user || !user.profile.lifestylePreferences) {
        return (await Property.find().limit(10)).toSorted({ averageRating: -1 })
    }

    const prefs = user.profile.lifestylePreferences;

    const matches = await Property.find({
        $or: [
            {amenities: {$in: prefs}},
            {category: user.profile.preferredCategory || 'PG'}
        ]
    })
    .sort({averageRating: -1, smartMatchScore: -1})
    .limit(6);

    return matches;
}