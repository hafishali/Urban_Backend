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

// filter order
exports.filterOrders = async (req, res) => {
  try {
    const { startDate, endDate, categoryIds, status } = req.query;

    // Function to convert "DD-MM-YYYY" to Date object
    const parseDate = (dateStr, endOfDay = false) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('-').map(Number);
      if (!day || !month || !year) return null;

      const date = new Date(year, month - 1, day);
      if (endOfDay) {
        date.setHours(23, 59, 59, 999);
      }
      return date;
    };

    // Debug incoming dates
    console.log('\n=== Date Filter Debug ===');
    console.log('Received startDate:', startDate);
    console.log('Received endDate:', endDate);

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.createdAt = {};

      if (startDate) {
        matchStage.createdAt.$gte = parseDate(startDate);
        console.log('Parsed startDate:', matchStage.createdAt.$gte);
      }

      if (endDate) {
        matchStage.createdAt.$lte = parseDate(endDate, true);
        console.log('Parsed endDate:', matchStage.createdAt.$lte);
      }

      console.log('Final date match criteria:', matchStage.createdAt);
    }

    if (status) {
      matchStage.status = status;
    }

    console.log('\nFinal match stage:', matchStage);

    const orders = await Order.aggregate([
      {
        $match: matchStage
      },
      // Populate userId
      {
        $lookup: {
          from: "users", // Collection name for users
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $addFields: {
          userId: {
            _id: { $arrayElemAt: ["$userDetails._id", 0] },
            name: { $arrayElemAt: ["$userDetails.name", 0] }
          }
        }
      },
      {
        $project: {
          "userDetails": 0 // Remove lookup array from response
        }
      },
      // Populate addressId
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "addressDetails"
        }
      },
      {
        $addFields: {
          addressId: { $arrayElemAt: ["$addressDetails", 0] }
        }
      },
      {
        $project: {
          "addressDetails": 0
        }
      },
      // Unwind products array
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true
        }
      },
      // Populate products.productId
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "products.productDetails"
        }
      },
      {
        $addFields: {
          "products.productId": { $arrayElemAt: ["$products.productDetails", 0] }
        }
      },
      {
        $project: {
          "products.productDetails": 0
        }
      },
      // Re-group products back into an array
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          addressId: { $first: "$addressId" },
          razorpayOrderId: { $first: "$razorpayOrderId" },
          totalPrice: { $first: "$totalPrice" },
          deliveryCharge: { $first: "$deliveryCharge" },
          paymentMethod: { $first: "$paymentMethod" },
          status: { $first: "$status" },
          discountedAmount: { $first: "$discountedAmount" },
          finalPayableAmount: { $first: "$finalPayableAmount" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          orderId: { $first: "$orderId" },
          products: { $push: "$products" }
        }
      }
    ]);

    console.log('\n=== Results Debug ===');
    console.log('Number of orders found:', orders.length);

    res.status(200).json(
      orders
     
    );

  } catch (error) {
    console.error('\n=== Error Debug ===');
    console.error('Error filtering orders:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      debug: { matchStage: matchStage }
    });
  }
};


  

