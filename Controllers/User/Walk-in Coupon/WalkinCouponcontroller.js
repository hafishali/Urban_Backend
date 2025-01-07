const Coupon=require('../../../Models/User/WalkinCoupen')

// create walkin coupen
exports.createCoupen = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Check for existing coupon
        const existingCoupon = await Coupon.findOne({ userId: userId });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Walk-in coupon already created for this user' });
        }

        // Generate a unique coupon code
        const couponCode = `WALK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

        // Create and save the new coupon
        const newCoupon = new Coupon({
            code: couponCode,
            userId: userId,
        });
        await newCoupon.save();

        return res.status(201).json({
            message: 'Walk-in Coupon Created Successfully',
            coupon: newCoupon,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// get walkin Coupen
exports.getCoupenbyId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate if userId is provided
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find coupon by userId
        const viewCoupen = await Coupon.findOne({ userId });
        if (!viewCoupen) {
            return res.status(404).json({ message: 'No walk-in coupon found for this user' });
        }

        return res.status(200).json({
            message: 'Coupon found',
            coupon: viewCoupen,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};



