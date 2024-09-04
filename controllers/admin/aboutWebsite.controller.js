// controllers/about.controller.js
import AppError from '../../utils/error.utils.js';
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import About from '../../models/admin/aboutWebsite.model.js';

const getAboutData = async (req, res, next) => {
    try {
        const aboutData = await About.findOne({});
        res.status(200).json({
            success: true,
            aboutData,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

const createOrUpdateAbout = async (req, res, next) => {
    try {
        // Destructure data from request body, initializing team data with default values if not provided
        const {
            missionDescription1,
            missionDescription2,
            stories,
            team1,
            team2,
            team3,
        } = req.body;

        // Find existing about data or create a new instance
        let aboutData = await About.findOne({});
        console.log(team1)
        if (aboutData) {
            // Update existing record
            aboutData = await About.findByIdAndUpdate(
                aboutData._id,
                {
                    missionDescription1,
                    missionDescription2,
                    stories,
                },
                { new: true }
            );
        } else {
            // Create new record with default values for team images
            aboutData = new About({
                missionDescription1,
                missionDescription2,
                stories,
                team1: {
                    image: {
                        publicId: '',
                        secure_url: '',
                    },
                    ...team1,
                },
                team2: {
                    image: {
                        publicId: '',
                        secure_url: '',
                    },
                    ...team2,
                },
                team3: {
                    image: {
                        publicId: '',
                        secure_url: '',
                    },
                    ...team3,
                },
                missionImage: {
                    publicId: '',
                    secure_url: '',
                },
            });
            await aboutData.save();
        }

        // Handle mission image upload
        if (req.files && req.files.missionImage) {
            if (aboutData.missionImage.publicId) {
                await cloudinary.v2.uploader.destroy(aboutData.missionImage.publicId);
            }
            try {
                const result = await cloudinary.v2.uploader.upload(req.files.missionImage[0].path, {
                    folder: 'about',
                });
                if (result) {
                    aboutData.missionImage.publicId = result.public_id;
                    aboutData.missionImage.secure_url = result.secure_url;
                    await fs.rm(`uploads/${req.files.missionImage[0].filename}`);
                }
            } catch (err) {
                return next(new AppError('Mission image cannot be uploaded', 500));
            }
        }

        // Handle team image uploads
        const teamUpdates = ['team1', 'team2', 'team3'];

        for (const teamKey of teamUpdates) {
            const teamMemberFileKey = `${teamKey}[image]`;
            if (req.files && req.files[teamMemberFileKey]) {
                const teamMember = aboutData[teamKey] || { image: { publicId: '', secure_url: '' } };
                if (teamMember.image.publicId) {
                    await cloudinary.v2.uploader.destroy(teamMember.image.publicId);
                }
                try {
                    console.log(1)
                    const result = await cloudinary.v2.uploader.upload(req.files[teamMemberFileKey][0].path, {
                        folder: `about/${teamKey}`,
                    });
                    console.log(result)

                    if (result) {
                        console.log(1)

                        teamMember.image.publicId = result.public_id;
                        teamMember.image.secure_url = result.secure_url;
                        await fs.rm(`uploads/${req.files[teamMemberFileKey][0].filename}`);
                        console.log(1)

                    }
                } catch (err) {
                    return next(new AppError(`Team member ${teamKey} image cannot be uploaded`, 500));
                }
                aboutData[teamKey] = teamMember; // Update the aboutData object with the new team member image
            }
        }

        await aboutData.save();

        console.log(aboutData.team1.publicId)

        // Update the team with any new information provided
        aboutData.team1 = {
            name: team1.name, image: {
                publicId: aboutData.team1.image.publicId || '',
                secure_url: aboutData.team1.image.secure_url || '',
            },
            role: team1.role
        };
        aboutData.team2 = {
            name: team2.name, image: {
                publicId: aboutData.team2.image.publicId || '',
                secure_url: aboutData.team2.image.secure_url || '',
            },
            role: team2.role
        };
        aboutData.team3 = {
            name: team3.name, image: {
                publicId: aboutData.team3.image.publicId || '',
                secure_url: aboutData.team3.image.secure_url || '',
            },
            role: team3.role
        };

        await aboutData.save();

        res.status(200).json({
            success: true,
            aboutData,
        });
    } catch (error) {
        console.error(error);
        return next(new AppError('Server Error', 500));
    }
};


export {
    getAboutData,
    createOrUpdateAbout,
};
