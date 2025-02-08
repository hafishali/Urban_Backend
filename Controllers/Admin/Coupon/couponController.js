const Coupon = require('../../../Models/Admin/CouponModel')
const mongoose = require('mongoose');
const cron = require('node-cron');


// create coupon
exports.createCoupon = async (req, res) => {
    const { title, code, category, startDate, endDate, discountType, discountValue, status } = req.body;

    // Ensure startDate < endDate
    if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: "Start date should be less than end date" });
    }

    try {
        const objectIdCategories = category.map((id) => {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId: ${id}`);
            }
            return new mongoose.Types.ObjectId(id);
        });

        const newCoupon = new Coupon({
            title,
            code,
            category: objectIdCategories, 
            startDate,
            endDate,
            discountType,
            discountValue,
            status,
        });

        await newCoupon.save();
        res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
    } catch (err) {
        res.status(500).json({ message: "Error creating coupon", error: err.message });
    }
};


// get all coupons
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('category','name').sort({createdAt:-1})
        res.status(200).json( coupons );
    } catch (err) {
        res.status(500).json({message:"Error fetching coupons", error: err.message})
    }
};

// get a coupon by id
exports.getCouponById = async (req, res) => {
    const { id } = req.params;

    try {
        const coupon = await Coupon.findById(id).populate('category','name');
        if(!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.status(200).json(coupon);
    } catch (err) {
        res.status(500).json({ message: "Error fetching coupon", error: err.message})
    }
};

// update a coupon
exports.updateCoupon = async (req, res) => {
    const { id } = req.params;
    const { title, code, startDate, endDate, discountType, discountValue, status, addCategories, removeCategories } = req.body;

    try {
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        // Validate date logic if startDate and endDate are updated
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: "Start date should be less than end date" });
        }

        const updateFields = {};

        // Update fields if provided
        if (title) updateFields.title = title;
        if (code) updateFields.code = code;
        if (startDate) updateFields.startDate = startDate;
        if (endDate) updateFields.endDate = endDate;
        if (discountType) updateFields.discountType = discountType;
        if (discountValue !== undefined) updateFields.discountValue = discountValue;
        if (status) updateFields.status = status;

        // Handle adding categories
        if (addCategories && Array.isArray(addCategories)) {
            const validAddCategories = addCategories.filter((id) =>
                mongoose.Types.ObjectId.isValid(id)
            );
            if (validAddCategories.length > 0) {
                const existingCategories = new Set(coupon.category.map((catId) => catId.toString()));
                const duplicates = validAddCategories.filter((id) => existingCategories.has(id));
                if (duplicates.length > 0) {
                    return res.status(400).json({ message: `Duplicate categories found: ${duplicates.join(', ')}` });
                }
                coupon.category = [...new Set([...coupon.category, ...validAddCategories])];
            }
        }

        // Handle removing categories
        if (removeCategories && Array.isArray(removeCategories)) {
            const validRemoveCategories = removeCategories.filter((id) =>
                mongoose.Types.ObjectId.isValid(id)
            );
            if (validRemoveCategories.length > 0) {
                const existingCategories = new Set(coupon.category.map((catId) => catId.toString()));
                const nonExisting = validRemoveCategories.filter((id) => !existingCategories.has(id));
                if (nonExisting.length > 0) {
                    return res.status(400).json({ message: `Categories not found: ${nonExisting.join(', ')}` });
                }
                coupon.category = coupon.category.filter(
                    (catId) => !validRemoveCategories.includes(catId.toString())
                );
            }
        }

        // Apply other updates
        Object.assign(coupon, updateFields);

        // Save the updated coupon
        const updatedCoupon = await coupon.save();

        res.status(200).json({
            message: "Coupon updated successfully.",
            coupon: updatedCoupon,
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating coupon", error: err.message });
    }
};



// delete a coupon
exports.deleteCoupon = async (req, res) => {
    const { id } = req.params;

    try {
        const deleteCoupon = await Coupon.findByIdAndDelete(id);
        if(!deleteCoupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        res.status(200).json({message: "coupon deleted successfully", coupon:deleteCoupon})
    } catch (err) {
        res.status(500).json({message: "Error deleting coupon", error: err.message})
    }
}

// search coupon
exports.searchCoupon = async (req, res) => {
    const { title, code, category } = req.query;

    try {
        const query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }
        if (code) {
            query.code = { $regex: code, $options: 'i' };
        }
        if (category) {
            query.category = category
    }

    const coupons = await Coupon.find(query).populate('category', 'name description');

    res.status(200).json({
        message: "Coupons found",
        coupons,
    });
} catch (err) {
    res.status(500).json({ message: "Error searching coupons", error: err.message })
}
};

const updateCouponStatus = async () => {
    try {
        // Get current date
        const currentDate = new Date();

        // Find all coupons that have expired
        const expiredCoupons = await Coupon.find({
            endDate: { $lt: currentDate },
            status: 'active'  // Only update active coupons that have expired
        });

        // Update the status of expired coupons to 'expired'
        await Promise.all(
            expiredCoupons.map(async (coupon) => {
                coupon.status = 'expired';
                await coupon.save();
            })
        );

        console.log(`Updated ${expiredCoupons.length} expired coupons.`);
    } catch (err) {
        console.error("Error updating coupon statuses:", err);
    }
};

// Schedule the task to run every midnight IST (5:30 AM UTC)
cron.schedule('0 0 5-23 * *', updateCouponStatus);  