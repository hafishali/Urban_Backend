// const Order = require('../../../Models/User/OrderModel');
// const User = require('../../../Models/User/UserModel');
// const Address = require('../../../Models/User/AddressModel');
// const Product = require('../../../Models/Admin/ProductModel');

// // Get all orders
// exports.getAllOrder = async (req, res) => {
//     try {
//         const orders = await Order.find()
//             .populate('userId', 'name') // Populate user name only
//             .populate('addressId', 'address city state pincode') // Populate address details
//             .populate('products.productId', 'title') // Populate productId with title only
//             .sort({ createdAt: -1 });

//         // Map the orders with necessary details
//         // const orderList = orders.map(order => ({
            

            
//         //         orderId: order.orderId, // 4-digit order ID
//         //         customerName: order.userId.name, // Access populated name from userId
//         //         address: `${order.addressId.address}, ${order.addressId.city}, ${order.addressId.state}, ${order.addressId.pincode}`,
//         //         deliveryDate: new Date(order.createdAt).toLocaleDateString(), // Format delivery date
//         //         products: order.products.map(product => ({
//         //             productName: product.productId ? product.productId.title : 'N/A', // Ensure productId is valid and return title
//         //             size: product.size,
//         //         })),
//         //         paymentMethod: order.paymentMethod,
//         //         status: order.status, // Order status
//         //         action: order.status,
            
//         // }));

//         res.status(200).json(orders);
//     } catch (err) {
//         res.status(500).json({ message: "Error fetching orders", error: err.message });
//     }
// };

// // Update order status
// exports.updateOrderStatus = async (req, res) => {
//     try {
//         const { orderId } = req.params; // Order ID
//         const { status,TrackId } = req.body; // New status

//         // Validate status
//         const validStatuses = ['Pending', 'Processing', 'In-Transist', 'Delivered', 'Cancelled'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ message: "Invalid status value" });
//         }

//         // Update the order's status
//         const order = await Order.findByIdAndUpdate(
//             orderId,
//             { status,TrackId},
//             { new: true } // Return the updated document
//         ).populate('userId', 'name') // Populate user name only
//          .populate('addressId', 'address city state pincode') // Populate address details
//          .populate('products.productId', 'title'); // Populate productId with title only

//         if (!order) {
//             return res.status(404).json({ message: "Order not found" });
//         }

//         res.status(200).json({ message: "Order status updated successfully", order });
//     } catch (err) {
//         res.status(500).json({ message: "Error updating order status", error: err.message });
//     }
// };

// // bulk edit on status
// exports.bulkUpdateOrderStatus = async (req, res) => {
//     try {
//         const { orderIds, status } = req.body; 

        
//         if (!Array.isArray(orderIds) || !orderIds.length) {
//             return res.status(400).json({ message: "Invalid or empty orderIds array" });
//         }

//         const validStatuses = ['Pending', 'Processing', 'In-Transist', 'Delivered', 'Cancelled'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ message:"Invalid status value"});
//         }

//         // Update the status for each order in bulk
//         const orders = await Order.updateMany(
//             { _id: { $in: orderIds } },
//             { status },
//             { new: true } // Return updated documents
//         ).populate('userId', 'name') // Populate user name only
//          .populate('addressId', 'address city state pincode') // Populate address details
//          .populate('products.productId', 'title'); // Populate productId with title only

//         if (orders.nModified === 0) {
//             return res.status(404).json({ message: "No orders found or status already updated for all selected orders" });
//         }

//         res.status(200).json({ message: `${orders.nModified} orders updated successfully`, orders });
//     } catch (err) {
//         res.status(500).json({ message: "Error updating order statuses", error: err.message });
//     }
// };

// // filter order
// exports.filterOrders = async (req, res) => {
//     console.log('sadf')
//     try {
//       const { startDate, endDate, categoryIds, status } = req.query;
  
//       // Initialize the query object
//       const query = {};
  
//       // Filter by created date (if startDate or endDate is provided)
//       if (startDate || endDate) {
//         query.createdAt = {};
//         if (startDate) query.createdAt.$gte = new Date(startDate); // Greater than or equal to startDate
//         if (endDate) query.createdAt.$lte = new Date(endDate); // Less than or equal to endDate
//       }
  
//       // Filter by order status
//       if (status) {
//         query.status = status;
//       }
  
//       // Prepare input categories for comparison
//       const inputCategories = categoryIds ? categoryIds.split(',').map(id => id.trim()) : [];
  
//       // Query orders with filters
//       const orders = await Order.find(query)
//         .populate('userId', 'name email') // Populate user details
//         .populate('addressId', 'city street') // Populate address details
//         .populate({
//           path: 'products.productId', // Populate product details
//           select: 'name category',
//           populate: { path: 'category', select: 'name _id' }, // Populate category details
//         })
//         .populate('coupen', 'code discountedAmount') // Populate coupon details
//         .exec();
  
//       // Collect all categories from orders
//       const allOrderCategories = [];
//       orders.forEach(order => {
//         order.products.forEach(product => {
//           if (product.productId && product.productId.category) {
//             const categoryId = product.productId.category._id.toString(); // Convert ObjectId to string
//             if (!allOrderCategories.includes(categoryId)) {
//               allOrderCategories.push(categoryId); // Add unique category IDs
//             }
//           }
//         });
//       });
  
//       // Compare input categories with categories in orders
//       console.log('Input Categories:', inputCategories);
//       console.log('All Order Categories:', allOrderCategories);
  
//       const unmatchedCategories = inputCategories.filter(
//         categoryId => !allOrderCategories.includes(categoryId)
//       );
//       console.log('Unmatched Categories:', unmatchedCategories);
  
//       // Filter out orders with no matching products if `categoryIds` was provided
//       const filteredOrders = categoryIds
//         ? orders.filter(order =>
//             order.products.some(
//               product =>
//                 product.productId &&
//                 product.productId.category &&
//                 inputCategories.includes(product.productId.category._id.toString())
//             )
//           )
//         : orders;
  
//       res.status(200).json({ filteredOrders, unmatchedCategories });
//     } catch (error) {
//       console.error('Error filtering orders:', error);
//       res.status(500).json({ message: 'Server error', error: error.message });
//     }
//   };
  
  
  

