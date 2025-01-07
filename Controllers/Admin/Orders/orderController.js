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
        const { orderId } = req.params; // Order ID
        const { status,TrackId } = req.body; // New status

        // Validate status
        const validStatuses = ['Pending', 'Processing', 'In-Transist', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Update the order's status
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status,TrackId},
            { new: true } // Return the updated document
        ).populate('userId', 'name') // Populate user name only
         .populate('addressId', 'address city state pincode') // Populate address details
         .populate('products.productId', 'title'); // Populate productId with title only

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order status updated successfully", order });
    } catch (err) {
        res.status(500).json({ message: "Error updating order status", error: err.message });
    }
};

// bulk edit on status
exports.bulkUpdateOrderStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body; 

        
        if (!Array.isArray(orderIds) || !orderIds.length) {
            return res.status(400).json({ message: "Invalid or empty orderIds array" });
        }

        const validStatuses = ['Pending', 'Processing', 'In-Transist', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message:"Invalid status value"});
        }

        // Update the status for each order in bulk
        const orders = await Order.updateMany(
            { _id: { $in: orderIds } },
            { status },
            { new: true } // Return updated documents
        ).populate('userId', 'name') // Populate user name only
         .populate('addressId', 'address city state pincode') // Populate address details
         .populate('products.productId', 'title'); // Populate productId with title only

        if (orders.nModified === 0) {
            return res.status(404).json({ message: "No orders found or status already updated for all selected orders" });
        }

        res.status(200).json({ message: `${orders.nModified} orders updated successfully`, orders });
    } catch (err) {
        res.status(500).json({ message: "Error updating order statuses", error: err.message });
    }
};





exports.filterOrder = async (req, res) => {
    try {
        const { startDate, endDate, categories, status } = req.query;

        // Build the query dynamically
        const query = {};

        // Validate and apply date filters if provided
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            // Check if the provided dates are valid
            if (startDate && isNaN(start)) {
                return res.status(400).json({ message: "Invalid startDate format" });
            }
            if (endDate && isNaN(end)) {
                return res.status(400).json({ message: "Invalid endDate format" });
            }

            query.createdAt = {};
            if (start) query.createdAt.$gte = start; // Greater than or equal to start date
            if (end) query.createdAt.$lte = end; // Less than or equal to end date
        }

        // Filter by order status
        if (status) {
            const validStatuses = ['Pending', 'Processing', 'In-Transist', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }
            query.status = status;
        }

        // Filter by multiple categories
        if (categories) {
            const categoryArray = Array.isArray(categories) ? categories : [categories]; // Ensure it's an array
            // Validate each category ID and create the filter condition
            const validCategories = categoryArray.filter(category => mongoose.Types.ObjectId.isValid(category));

            if (validCategories.length > 0) {
                query['products.productId.category'] = { $in: validCategories.map(id => new mongoose.Types.ObjectId(id)) }; // Filter with $in for multiple categories
            } else {
                return res.status(400).json({ message: "Invalid category ID(s)" });
            }
        }

        // Fetch orders with the required populated fields and applied filters
        const filteredOrders = await Order.find(query)
            .populate('userId', 'name phone') // Populate user details
            .populate('addressId', 'address city state pincode') // Populate address details
            .populate({
                path: 'products.productId', // Populate product details
                populate: { 
                    path: 'category', 
                    select: 'name' // Populate category and select its name
                }
            })
            .sort({ createdAt: -1 }); // Sort by creation date descending

        res.status(200).json(filteredOrders);
    } catch (err) {
        console.error("Error in filterOrder:", err);
        res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
};

