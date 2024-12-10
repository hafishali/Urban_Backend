const Address = require('../../../Models/User/AddressModel');

// Add a new address
exports.addAddress = async (req, res) => {
  try {
    const { userId, name, number, address, landmark, pincode, city, state, addressType } = req.body;

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
    const updatedData = req.body;

    const address = await Address.findByIdAndUpdate(id, updatedData, { new: true });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address updated successfully", address });
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
