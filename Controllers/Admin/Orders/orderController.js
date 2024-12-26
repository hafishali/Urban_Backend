const mongoose = require('mongoose')
const Order = require('../../../Models/User/OrderModel');
const User = require('../../../Models/User/UserModel');
const Address = require('../../../Models/User/AddressModel');
const Product = require('../../../Models/Admin/ProductModel');


// Get all orders
exports.getAllOrder = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name') 
            .populate('addressId', 'address city state pincode')
            .populate('products.productId', 'title') 
            .sort({ createdAt: -1 });
        // Map the orders with necessary details
        // const orderList = orders.map(order => ({
        //         orderId: order.orderId, // 4-digit order ID
        //         customerName: order.userId.name, // Access populated name from userId
        //         address: `${order.addressId.address}, ${order.addressId.city}, ${order.addressId.state}, ${order.addressId.pincode}`,
        //         deliveryDate: new Date(order.createdAt).toLocaleDateString(), // Format delivery date
        //         products: order.products.map(product => ({
        //             productName: product.productId ? product.productId.title : 'N/A', // Ensure productId is valid and return title
        //             size: product.size,
        //         })),
        //         paymentMethod: order.paymentMethod,
        //         status: order.status, // Order status
        //         action: order.status,
        // }));
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
};
// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params; 
        const { status } = req.body; 
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true } 
        ).populate('userId', 'name') 
         .populate('addressId', 'address city state pincode') 
         .populate('products.productId', 'title'); 
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json({ message: "Order status updated successfully", order });
    } catch (err) {
        res.status(500).json({ message: "Error updating order status", error: err.message });
    }
};

exports.filterOrder = async (req, res) => {
    try {
        const { startDate, endDate, category, status } = req.query;

        // Build a dynamic filter object
        const filter = {};

        // Filter by order status
        if (status) {
            const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }
            filter.status = status;
        }

        // Filter by date range (createdAt)
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

// Filter by productId (_id) or category name
if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
        // Treat `category` as a product ID
        filter['products._id'] = new mongoose.Types.ObjectId(category);
        console.log("Filtering by productId:", filter['products._id']);
    } else {
        // Treat `category` as a category string (using regex)
        const matchingProducts = await Product.find({ category: { $regex: category, $options: 'i' } }).select('_id');
        const productIds = matchingProducts.map(product => product._id);
        filter['products._id'] = { $in: productIds };
        console.log("Filtering by category IDs:", productIds);
    }
}

        // Fetch the filtered orders
        const orders = await Order.find(filter)
            .populate('userId', 'name') // Populate user details
            .populate('addressId', 'address city state pincode') // Populate address details
            .populate('products.productId', 'title category') // Populate product details with category
            .sort({ createdAt: -1 }); // Sort by creation date descending

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
};
