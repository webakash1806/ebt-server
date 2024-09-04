import { model, Schema } from 'mongoose'


const PlaceSchema = new Schema({
    title: { type: String },
    shortDescription: { type: String },
    images: [{
        fileName: String,
        fileUrl: String
    }],
    location: {
        state: {
            type: String
        },
        city: {
            type: String
        },
        country: {
            type: String
        }
    },
    keyHighlights: [
        { type: String }
    ],
    // localCuisine: [
    //     {
    //         dishName: { type: String },
    //         description: { type: String },
    //         image: { type: String },
    //     },
    // ],
    festivalsEvents: [
        {
            eventName: { type: String },
            eventDescription: { type: String },
            date: { type: String },
        },
    ],
    mapFrame: { type: String },
}, { timestamps: true });

const Place = model('Place', PlaceSchema);

export default Place;
