const mongoose = require('mongoose')
const Order = require('../../../Models/User/OrderModel');
const User = require('../../../Models/User/UserModel');
const Address = require('../../../Models/User/AddressModel');
const Product = require('../../../Models/Admin/ProductModel');
const { sendEmail } = require('../../../config/mailGun');
const Invoice=require('../../../Models/Admin/InvoiceModel')



// email body
const sendOrderStatusEmail = async (order) => {
  try {
      const userEmail = order.userId.email;
      let subject = "Order Status Update - URBAAN COLLECTIONS";
      let text = "";

      if (order.status === "In-Transist" && order.TrackId) {
          text = `Your order #${order.orderId} has been dispatched. You can track it using this link: ${order.TrackId}.`;
      } else if (order.status === "Delivered") {
          text = `Your order #${order.orderId} has been successfully delivered. We hope you love your purchase! Let us know your feedback.`;
      }

      if (text) {
          await sendEmail(userEmail, subject, text);
      }
  } catch (error) {
      console.error("Error sending email:", error.message);
  }
};



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
      const { status, TrackId } = req.body;

      // Validate status
      const validStatuses = ['Pending', 'Processing', 'In-Transist', 'Delivered', 'invoice_generated', 'Cancelled'];
      if (status && !validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
      }

      // Update the order
      const order = await Order.findByIdAndUpdate(
          orderId,
          { status, TrackId },
          { new: true }
      )
      .populate('userId', 'name email')
      .populate('addressId', 'address city state pincode')
      .populate('products.productId', 'title');

      if (!order) {
          return res.status(404).json({ message: "Order not found" });
      }

      // Send email based on order status
      if ((order.status === "In-Transist" && order.TrackId) || order.status === "Delivered") {
          await sendOrderStatusEmail(order);
      } else if (order.status === "In-Transist" && !order.TrackId) {
          return res.status(400).json({ message: "This order doesn't have a tracking ID" });
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

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Invalid or empty orderIds array" });
    }

    const validStatuses = ['Pending', 'Processing', 'In-Transist', 'invoice_generated', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Fetch orders & their invoices before updating
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('userId', 'name email')
      .populate('products.productId', 'title');

    let invalidOrders = [];
    let validOrders = [];
    let emailOrders = [];
    let invoicesToUpdate = [];
    let skippedEmails = [];

    for (const order of orders) {
      if (status === 'In-Transist' && !order.TrackId) {
        invalidOrders.push(order);
      } else {
        validOrders.push(order);
        
        // Fetch corresponding invoice
        const invoice = await Invoice.findOne({ order_id: order._id });

        if (invoice) {
          let shouldSendEmail = false;
          
          if (status === 'In-Transist') {
            if (!invoice.dispatchMail) {
              shouldSendEmail = true;
              invoicesToUpdate.push({ invoiceId: invoice._id, field: 'dispatchMail' });
            } else {
              skippedEmails.push(order._id); // Log orders where mail is already sent
            }
          } 
          
          if (status === 'Delivered') {
            if (!invoice.deliveryMail) {
              shouldSendEmail = true;
              invoicesToUpdate.push({ invoiceId: invoice._id, field: 'deliveryMail' });
            } else {
              skippedEmails.push(order._id);
            }
          }

          if (shouldSendEmail) emailOrders.push(order);
        }
      }
    }

    // If no valid orders or eligible emails, return an error
    if (validOrders.length === 0 && emailOrders.length === 0) {
      return res.status(400).json({
        message: "No valid orders found for updating.",
        skippedOrders: invalidOrders.map(order => ({
          _id: order._id,
          order_id: order.orderId,
          userId: order.userId,
          products: order.products,
          status: order.status,
          TrackId: order.TrackId
        }))
      });
    }

    // Update only valid orders
    if (validOrders.length > 0) {
      await Order.updateMany(
        { _id: { $in: validOrders.map(order => order._id) } },
        { $set: { status } }
      );
    }

    // Send emails only for eligible orders
    if (emailOrders.length > 0) {
      const emailPromises = emailOrders.map(order => sendOrderStatusEmail(order));
      await Promise.all(emailPromises);

      // Update invoices after sending emails
      for (const update of invoicesToUpdate) {
        await Invoice.findByIdAndUpdate(update.invoiceId, { $set: { [update.field]: true } });
      }
    }

    // Fetch updated orders for response
    const validOrderDetails = await Order.find({ _id: { $in: validOrders.map(order => order._id) } })
      .populate('userId', 'name email')
      .populate('products.productId', 'title');

    res.status(200).json({
      message: `Updated ${validOrders.length} orders successfully.`,
      ...(invalidOrders.length > 0 && {
        warning: `${invalidOrders.length} orders were skipped due to missing TrackId.`,
        skippedOrders: invalidOrders.map(order => ({
          _id: order._id,
          order_id: order.orderId,
          userId: order.userId,
          products: order.products,
          status: order.status,
          TrackId: order.TrackId
        }))
      }),
      ...(skippedEmails.length > 0 && {
        skippedEmails: `Skipped ${skippedEmails.length} orders as emails were already sent.`,
        skippedEmailOrders: skippedEmails
      }),
      updatedOrders: validOrderDetails
    });

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
          from: "users",
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
          "userDetails": 0
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
      // **🔹 Add Sorting Stage Here**
      {
        $sort: { createdAt: -1 } // Sort in descending order (latest first)
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
      },
      {
        $sort: { createdAt: -1 } // **Sort Again after Grouping**
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




