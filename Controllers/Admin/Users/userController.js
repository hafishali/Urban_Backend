const User = require('../../../Models/User/UserModel');
const Address = require('../../../Models/User/AddressModel'); // Import Address model

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        // Find user details
        const user = await User.findById(req.user.userId); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find all addresses associated with the user
        const addresses = await Address.find({ userId: req.user.userId });

        res.status(200).json({
            user: {
                id: user._id, // Include the user ID
                name: user.name,
                phone: user.phone,
                email: user.email,
                dob: user.dob,
                gender: user.gender,
                address: user.address,
                city: user.city,
                district: user.district,
                state: user.state,
                pincode: user.pincode,
                addresses: addresses, // Include all addresses
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users
        const users = await User.find();

        // Fetch associated addresses for each user
        const usersWithAddresses = await Promise.all(
            users.map(async (user) => {
                const addresses = await Address.find({ userId: user._id });
                return {
                    id: user._id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    dob: user.dob,
                    gender: user.gender,
                    address: user.address,
                    city: user.city,
                    district: user.district,
                    state: user.state,
                    pincode: user.pincode,
                    addresses: addresses,
                };
            })
        );

        res.status(200).json({ users: usersWithAddresses });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


// Update user profile
exports.updateProfile = async (req, res) => {
    const { name, email, dob, gender, address, city, district, state, pincode } = req.body;

    try {
        const user = await User.findById(req.user.userId); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.dob = dob || user.dob;
        user.gender = gender || user.gender;
        user.address = address || user.address;
        user.city = city || user.city;
        user.district = district || user.district;
        user.state = state || user.state;
        user.pincode = pincode || user.pincode;

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id, // Include the user ID
                name: user.name,
                email: user.email,
                dob: user.dob,
                gender: user.gender,
                address: user.address,
                city: user.city,
                district: user.district,
                state: user.state,
                pincode: user.pincode,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


// Suspend a User
exports.suspendUser = async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.status = 'suspended';
      await user.save();
      res.status(200).json({ message: 'User suspended successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  // active a User
exports.activeUser = async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.status = 'active';
      await user.save();
      res.status(200).json({ message: 'User actived successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  // delete a user
  exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      await user.deleteOne();
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  // search user
  exports.searchUsers = async (req, res) => {
    const { name, phone, email } = req.query;
    try {
        let query = {};
        if(name){
            query.name = { $regex: name, $options: 'i' };
        }
        if (phone) {
            query.phone = { $regex: phone, $options: 'i' };
        }
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }
        const users = await User.find(query).select('-password');
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Failed to search users', error: err.message });
    }
  }