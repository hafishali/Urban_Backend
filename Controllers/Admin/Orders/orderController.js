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
  
      // Build match stage for aggregation
      const matchStage = {};
  
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }
  
      if (status) {
        matchStage.status = status;
      }
  
      // Use aggregation pipeline with proper ObjectId handling
      const orders = await Order.aggregate([
        {
          $match: matchStage
        },
        // Unwind products array to properly handle the lookups
        {
          $unwind: {
            path: "$products",
            preserveNullAndEmptyArrays: true
          }
        },
        // Lookup and join with products
        {
          $lookup: {
            from: "products",
            let: { productId: "$products.productId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$productId"] }
                }
              }
            ],
            as: "products.productDetails"
          }
        },
        // Unwind product details
        {
          $unwind: {
            path: "$products.productDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        // Lookup categories for products
        {
          $lookup: {
            from: "categories",
            let: { categoryId: "$products.productDetails.category" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$categoryId"] }
                }
              }
            ],
            as: "products.productDetails.category"
          }
        },
        // Unwind category
        {
          $unwind: {
            path: "$products.productDetails.category",
            preserveNullAndEmptyArrays: true
          }
        },
        // Group back to original structure
        {
          $group: {
            _id: "$_id",
            userId: { $first: "$userId" },
            addressId: { $first: "$addressId" },
            products: {
              $push: {
                productId: "$products.productDetails",
                quantity: "$products.quantity",
                price: "$products.price"
              }
            },
            totalAmount: { $first: "$totalAmount" },
            status: { $first: "$status" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            coupen: { $first: "$coupen" }
          }
        },
        // Lookup user details
        {
          $lookup: {
            from: "users",
            let: { userId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$userId"] }
                }
              },
              {
                $project: {
                  name: 1,
                  email: 1
                }
              }
            ],
            as: "userDetails"
          }
        },
        // Lookup address details
        {
          $lookup: {
            from: "addresses",
            let: { addressId: "$addressId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$addressId"] }
                }
              },
              {
                $project: {
                  city: 1,
                  street: 1
                }
              }
            ],
            as: "addressDetails"
          }
        },
        // Lookup coupon details
        {
          $lookup: {
            from: "coupens",
            let: { coupenId: "$coupen" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$coupenId"] }
                }
              },
              {
                $project: {
                  code: 1,
                  discountedAmount: 1
                }
              }
            ],
            as: "coupenDetails"
          }
        },
        // Final field structure
        {
          $addFields: {
            userId: { $arrayElemAt: ["$userDetails", 0] },
            addressId: { $arrayElemAt: ["$addressDetails", 0] },
            coupen: { $arrayElemAt: ["$coupenDetails", 0] }
          }
        },
        // Cleanup temporary fields
        {
          $project: {
            userDetails: 0,
            addressDetails: 0,
            coupenDetails: 0
          }
        }
      ]);
  
      let filteredOrders = orders;
      let unmatchedCategories = [];
  
      // Handle category filtering if specified
      if (categoryIds) {
        const inputCategories = categoryIds.split(',').map(id => id.trim());
        
        const allOrderCategories = new Set();
        orders.forEach(order => {
          order.products.forEach(product => {
            if (product.productId?.category?._id) {
              allOrderCategories.add(product.productId.category._id.toString());
            }
          });
        });
  
        unmatchedCategories = inputCategories.filter(
          categoryId => !allOrderCategories.has(categoryId)
        );
  
        filteredOrders = orders.filter(order =>
          order.products.some(product =>
            product.productId?.category?._id &&
            inputCategories.includes(product.productId.category._id.toString())
          )
        );
      }
  
      res.status(200).json({
        filteredOrders,
        unmatchedCategories,
        totalOrders: filteredOrders.length
      });
  
    } catch (error) {
      console.error('Error filtering orders:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};
  

