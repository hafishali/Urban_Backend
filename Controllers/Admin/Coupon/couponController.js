const Coupon = require('../../../Models/Admin/CouponModel')

// create coupon
exports.createCoupon = async (req, res) => {
    const { title, code, category, startDate, endDate, discountType, discountValue, status } = req.body;

    // ensure startdate<endate
    if(new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: "Start date should be less than end date"});
    }
    try {
        const newCoupon = new Coupon({
            title,
            code,
            category,
            startDate,
            endDate,
            discountType,
            discountValue,
            status
        });
        await newCoupon.save();
        res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
    } catch (err) {
        res.status(500).json({ message: "Error creating coupon", error: err.message });
    }
}

// get all coupons
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('category','name');
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
    const { title, code, category, startDate, endDate, discountType, discountValue, status } = req.body;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: "Start date must be before end date." });
    }

    try {
        // console.log("Updating coupon with ID:", id);
        // console.log("Update data:", req.body);
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            { title, code, category, startDate, endDate, discountType, discountValue, status },
            { new: true } 
        );

        if(!updatedCoupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.status(200).json({message: "coupon updated successfully", coupon: updatedCoupon});

    } catch (err) {
        res.status(500).json({ message: "Error updating coupon", error:err.message})
    }
}

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