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





exports.filterOrders = async (req, res) => {
    try {
      const { startDate, endDate, categoryIds, status } = req.query;
  
      // Prepare input categories
      const inputCategories = categoryIds ? categoryIds.split(',').map(id => id.trim()) : [];
  
      // Build the aggregation pipeline
      const pipeline = [];
  
      // Match filters (startDate, endDate, status)
      const match = {};
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }
      if (status) match.status = status;
  
      if (Object.keys(match).length) {
        pipeline.push({ $match: match });
      }
  
      // Lookup products and categories
      pipeline.push(
        {
          $lookup: {
            from: 'products', // Collection name for products
            localField: 'products.productId',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        {
          $lookup: {
            from: 'categories', // Collection name for categories
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        }
      );
  
      // Optionally filter by categories if categoryIds are provided
      if (inputCategories.length) {
        pipeline.push({
          $match: {
            'categoryDetails._id': { $in: inputCategories.map(id => new mongoose.Types.ObjectId(id)) },
          },
        });
      }
  
      // Optionally project only the necessary fields
      pipeline.push({
        $project: {
          orderId: 1,
          userId: 1,
          addressId: 1,
          products: 1,
          totalPrice: 1,
          status: 1,
          categoryDetails: 1,
        },
      });
  
      // Execute the pipeline
      const orders = await Order.aggregate(pipeline);
  
      // Extract unmatched categories (if necessary)
      const allOrderCategories = [
        ...new Set(
          orders.flatMap(order =>
            order.categoryDetails.map(category => category._id.toString())
          )
        ),
      ];
      const unmatchedCategories = inputCategories.filter(cat => !allOrderCategories.includes(cat));
  
      res.status(200).json({ orders, unmatchedCategories });
    } catch (error) {
      console.error('Error filtering orders:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  
  

