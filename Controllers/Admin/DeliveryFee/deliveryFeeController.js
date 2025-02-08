const DeliveryFee = require("../../../Models/Admin/DeliveryFeeModel");

// Add a new delivery fee
exports.addDeliveryFee = async (req, res) => {
  try {
    const { quantity, deliveryFee } = req.body;

    // Check if quantity already exists
    const existingFee = await DeliveryFee.findOne({ quantity });
    if (existingFee) {
      return res.status(400).json({ message: "Delivery fee for this quantity already exists." });
    }

    const newDeliveryFee = new DeliveryFee({
      quantity,
      deliveryFee,
    });

    await newDeliveryFee.save();
    res.status(201).json({ message: "Delivery fee added successfully.", data: newDeliveryFee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all delivery fees
exports.getDeliveryFees = async (req, res) => {
  try {
    const fees = await DeliveryFee.find().sort({createdAt:-1})
    res.status(200).json({ message: "Delivery fees fetched successfully.", data: fees });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a delivery fee
exports.updateDeliveryFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, deliveryFee } = req.body;

    const updatedFee = await DeliveryFee.findByIdAndUpdate(
      id,
      { quantity, deliveryFee },
      { new: true, runValidators: true }
    );

    if (!updatedFee) {
      return res.status(404).json({ message: "Delivery fee not found." });
    }

    res.status(200).json({ message: "Delivery fee updated successfully.", data: updatedFee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a delivery fee
exports.deleteDeliveryFee = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFee = await DeliveryFee.findByIdAndDelete(id);
    if (!deletedFee) {
      return res.status(404).json({ message: "Delivery fee not found." });
    }

    res.status(200).json({ message: "Delivery fee deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// search delivery fee

