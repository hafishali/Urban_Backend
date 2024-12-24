const Address = require('../../../Models/User/AddressModel');

// Add a new address
exports.addAddress = async (req, res) => {
  try {
    const {
      userId,
      name,
      number,
      address,
      landmark,
      pincode,
      city,
      state,
      addressType,
      defaultAddress,
    } = req.body;

    // If defaultAddress is true, unset defaultAddress for all other addresses of the user
    if (defaultAddress) {
      await Address.updateMany({ userId }, { defaultAddress: false });
    }

    const newAddress = new Address({
      userId,
      name,
      number,
      address,
      landmark,
      pincode,
      city,
      state,
      addressType,
      defaultAddress: !!defaultAddress, // Ensure it's a boolean
    });

    await newAddress.save();
    res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all addresses for a user
exports.getAddressesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await Address.find({ userId });

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ message: "No addresses found for this user" });
    }

    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an address by ID
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { defaultAddress, ...updatedData } = req.body;

    // Find the address to update
    const address = await Address.findById(id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If defaultAddress is true, unset defaultAddress for all other addresses of the user
    if (defaultAddress) {
      await Address.updateMany({ userId: address.userId, _id: { $ne: id } }, { defaultAddress: false });
    }

    // Update the address
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { ...updatedData, defaultAddress: !!defaultAddress }, // Ensure defaultAddress is a boolean
      { new: true }
    );

    res.status(200).json({ message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete an address by ID
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findByIdAndDelete(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
