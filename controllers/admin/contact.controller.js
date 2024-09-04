import ContactSetting from "../../models/admin/contactWebsite.model.js";
import AppError from '../../utils/error.utils.js'

const getContactSettingsData = async (req, res, next) => {
    try {
        const contactDetails = await ContactSetting.findOne({})

        res.status(200).json({
            success: true,
            contactDetails
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const createContactSettings = async (req, res, next) => {
    try {
        const {
            facebook,
            twitter,
            instagram,
            linkedin,
            phone1,
            phone2,
            whatsapp,
            email1,
            email2,
            googleMapIframe,
            serviceTime
        } = req.body;

        let contactDetails = await ContactSetting.findOne({});

        if (contactDetails) {
            // Update existing record
            contactDetails = await ContactSetting.findByIdAndUpdate(contactDetails._id, {
                facebook,
                twitter,
                instagram,
                linkedin,
                phone1,
                phone2,
                whatsapp,
                email1,
                email2,
                googleMapIframe,
                serviceTime
            }, { new: true });
        } else {
            // Create new record
            contactDetails = new ContactSetting({
                facebook,
                twitter,
                instagram,
                linkedin,
                phone1,
                phone2,
                whatsapp,
                email1,
                email2,
                googleMapIframe,
                serviceTime
            });
            await contactDetails.save();
        }

        await contactDetails.save();

        res.status(200).json({
            success: true,
            contactDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};



export {
    createContactSettings,
    getContactSettingsData,
}
