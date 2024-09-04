import Place from '../models/place.model.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
import AppError from '../utils/error.utils.js';

// Add a new place
const addPlace = async (req, res, next) => {
    try {
        console.log(1)
        const { title, shortDescription, keyHighlights, state, city, country, festivalsEvents, mapFrame } = req.body;
        console.log(req.body)




        const files = req.files;
        const uploadedFiles = [];

        if (mapFrame) {

            if (!files || Object.keys(files).length === 0) {
                return next(new AppError('No files uploaded', 400));
            }
        }

        for (const file of Object.values(files)) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'lms'
            });

            const fileNameWithExtension = file.originalname;
            const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.');

            uploadedFiles.push({ fileName: fileName, fileUrl: result.secure_url });

            fs.rmSync(`uploads/${fileNameWithExtension}`);
        }

        const newPlace = new Place({
            title,
            shortDescription,
            images: uploadedFiles,
            keyHighlights: JSON.parse(keyHighlights),
            festivalsEvents: JSON.parse(festivalsEvents),
            mapFrame,
            location: {
                state,
                country,
                city
            }
        });

        await newPlace.save();
        res.status(201).json({ success: true, message: 'Place added successfully', place: newPlace });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const updatePlace = async (req, res, next) => {
    try {
        const placeId = req.params.id;
        const { title, shortDescription, keyHighlights, festivalsEvents, mapFrame } = req.body;
        const files = req.files;
        const uploadedFiles = [];

        // Fetch the existing place
        const existingPlace = await Place.findById(placeId);
        if (!existingPlace) {
            return next(new AppError('Place not found', 404));
        }

        // Delete existing images from Cloudinary
        for (const image of existingPlace.images) {
            await cloudinary.uploader.destroy(image.fileName);
        }

        // Clear existing images from the database
        existingPlace.images = [];

        // Upload new files to Cloudinary
        if (files && Object.keys(files).length > 0) {
            for (const file of Object.values(files)) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'places'
                });

                const fileNameWithExtension = file.originalname;
                const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.');

                uploadedFiles.push({ fileName: fileName, fileUrl: result.secure_url });

                fs.rmSync(`uploads/${fileNameWithExtension}`);
            }
        }

        // Update the place with new data
        const updatedPlace = await Place.findByIdAndUpdate(
            placeId,
            {
                title,
                shortDescription,
                images: uploadedFiles,
                keyHighlights,
                festivalsEvents,
                mapFrame
            },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Place updated successfully', place: updatedPlace });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

// Delete a place
const deletePlace = async (req, res, next) => {
    try {
        const placeId = req.params.id;

        // Fetch the place to get the images
        const place = await Place.findById(placeId);
        if (!place) {
            return next(new AppError('Place not found', 404));
        }

        // Delete images from Cloudinary
        for (const image of place.images) {
            await cloudinary.uploader.destroy(image.fileName);
        }

        // Delete the place from the database
        await Place.findByIdAndDelete(placeId);

        res.status(200).json({ success: true, message: 'Place and associated images deleted successfully' });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


// Get all places
const getAllPlaces = async (req, res, next) => {
    try {
        const places = await Place.find();
        res.status(200).json({ success: true, places });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

// Get detailed place data by ID
const getPlaceById = async (req, res, next) => {
    try {
        const placeId = req.params.id;
        const place = await Place.findById(placeId);
        if (!place) {
            return next(new AppError('Place not found', 404));
        }
        res.status(200).json({ success: true, place });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

export { addPlace, updatePlace, deletePlace, getAllPlaces, getPlaceById };
