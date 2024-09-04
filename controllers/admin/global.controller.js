import GlobalSetting from "../../models/admin/global.model.js";
import AppError from '../../utils/error.utils.js'
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

const getGlobalSettingsData = async (req, res, next) => {
    try {
        const globalSettingsData = await GlobalSetting.findOne({})

        res.status(200).json({
            success: true,
            globalSettingsData
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const createGlobalSettings = async (req, res, next) => {
    try {
        const {
            name, url, address, phone1, phone2, email1, email2, title, linkedin, facebook, instagram, googleMap, seoTitle, author, keywords, description
        } = req.body;

        let websiteDetails = await GlobalSetting.findOne({});

        if (websiteDetails) {
            // Update existing record
            websiteDetails = await GlobalSetting.findByIdAndUpdate(websiteDetails._id, {
                name, title, url, address, phone1, phone2, email1, email2, linkedin, facebook, instagram, googleMap, seoTitle, author, keywords, description
            }, { new: true });
        } else {
            // Create new record
            websiteDetails = new GlobalSetting({
                name,
                url,
                address,
                phone1,
                phone2,
                email1,
                email2,
                title,
                logo: {
                    publicId: '',
                    secure_url: ''
                },
                icon: {
                    publicId: '',
                    secure_url: ''
                },
                linkedin,
                facebook,
                instagram,
                googleMap,
                seoTitle,
                author,
                keywords,
                description
            });
            await websiteDetails.save();
        }

        // Handle logo upload
        if (req.files && req.files.logo) {
            if (websiteDetails.logo.publicId) {
                await cloudinary.v2.uploader.destroy(websiteDetails.logo.publicId);
            }
            try {
                const result = await cloudinary.v2.uploader.upload(req.files.logo[0].path, {
                    folder: 'lms',
                });
                if (result) {
                    websiteDetails.logo.publicId = result.public_id;
                    websiteDetails.logo.secure_url = result.secure_url;
                    console.log(req.files.logo[0].filename)
                    fs.rm(`uploads/${req.files.logo[0].filename}`);

                }
            } catch (err) {
                return next(new AppError('Logo file cannot be uploaded', 500));
            }
        }

        // Handle icon upload
        if (req.files && req.files.icon) {
            if (websiteDetails.icon.publicId) {
                await cloudinary.v2.uploader.destroy(websiteDetails.icon.publicId);
            }
            try {
                console.log(2)

                const result = await cloudinary.v2.uploader.upload(req.files.icon[0].path, {
                    folder: 'lms',
                });
                console.log(2)

                if (result) {
                    websiteDetails.icon.publicId = result.public_id;
                    websiteDetails.icon.secure_url = result.secure_url;
                    console.log(2)

                    fs.rm(`uploads/${req.files.icon[0].filename}`);
                    console.log(2)

                }
            } catch (err) {
                return next(new AppError('Icon file cannot be uploaded', 500));
            }
        }

        await websiteDetails.save();

        res.status(200).json({
            success: true,
            websiteDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};



export {
    createGlobalSettings,
    getGlobalSettingsData,
}
