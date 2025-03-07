const Invoice = require('../../../Models/Admin/InvoiceModel');
const User = require('../../../Models/User/UserModel');
const Address = require('../../../Models/User/AddressModel');
const Order = require('../../../Models/User/OrderModel')

// fetch all invoice
exports.getInvoices = async(req,res) => {
try {
    const invoice = await Invoice.find()
    .populate('userId','name phone')
    .populate('products.productId','title')
    .populate('address','address city state')
    .sort({createdAt: -1, _id: -1})

    res.status(200).json(invoice);
} catch (err){
    res.status(500).json({message: err.message});
}
}

// Create a new invoice
// exports.createInvoice = async (req, res) => {
//     try {
//       const {orderId} = req.params; // The order ID from the URL
  
//       // Fetch the order details
//       const order = await Order.findById(orderId)
//       .populate('userId', 'name phone')
//       .populate('addressId', 'address city state')
//       .populate('products.productId', 'title');
//       if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//       }
  
//        // Check if the necessary fields are present in the order
//     if (!order.userId || !order.addressId || !order.products || order.products.length === 0) {
//         return res.status(400).json({ message: 'Missing necessary fields in the order' });
//       }

//       // Generate the invoice from the order details
//       const invoice = new Invoice({
//         paymentId: `PAY-${order.orderId}`, // Use order ID or generate a new payment ID
//         userId: order.userId._id,
//         customerName: order.userId.name,
//         customerMobile: order.userId.phone,
//         address: order.addressId,
//         products: order.products.map(product => {
//             // Check and ensure productId is valid before using it
//             if (!product.productId) {
//               throw new Error(`Missing productId in product ${product._id}`);
//             }
//             return {
//               productId: product.productId._id,  // Should be populated properly
//               size: product.size,
//               price: product.price, 
//               quantity: product.quantity
//             };
//           }),
//         totalAmount: order.totalPrice, 
//         status: order.status,
//       });
  
//       // Save the generated invoice
//       await invoice.save();
  
//       res.status(201).json({
//         message: 'Invoice created successfully',
//         invoice
//       }); 
//     } catch (error) {
//         if (error.code === 11000 && error.keyPattern && error.keyPattern.paymentId) {
//             // Handle duplicate key error for `paymentId`
//             return res.status(400).json({ message: 'Invoice already exists with this Payment ID' });
//           }
//       console.error(error);
//       res.status(500).json({ message: 'Failed to create invoice', error });
//     }
//   };

  // update invoice
  exports.updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updateInvoice = await Invoice.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
        .populate('userId', 'name phone') 
        .populate('address', 'address city state')
        .populate('products.productId', 'title');
  
      if (!updateInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }  
      res.status(200).json({ 
        message: 'Invoice updated successfully',
        invoice: updateInvoice
      });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update invoice', error: err.message });
      }
  }

  // delete invoice
  exports.deleteInvoice = async (req, res) => {
    try {
      const { id } = req.params; // Invoice ID
  
      const deletedInvoice = await Invoice.findByIdAndDelete(id);
      if (!deletedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
  
      res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete invoice', error: err.message });
    }
  };
  

  

// Search and fetch invoices
exports.searchInvoices = async (req, res) => {
  try {
    const { search, status, paymentId } = req.query;

    // Build a dynamic filter object
    const filter = {};

    // Search by customer name or customer mobile using the same parameter
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } }, // Case-insensitive name search
        { customerMobile: { $regex: search, $options: 'i' } } // Case-insensitive mobile search
      ];
    }

    // Search by invoice status
    if (status) {
      filter.status = status;
    }

    // Search by paymentId
    if (paymentId) {
      filter.paymentId = { $regex: paymentId, $options: 'i' };
    }

    // Fetch invoices based on the filter
    const invoices = await Invoice.find(filter)
      .populate('userId', 'name phone') // Populate user details
      .populate('products.productId', 'title') // Populate product details
      .populate('address', 'address city state') // Populate address
      .sort({ createdAt: -1 }); // Sort by creation date descending

    res.status(200).json({
      message: 'Invoices fetched successfully',
      invoices,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch invoices', error: err.message });
  }
};



// filter invoice
exports.filterInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate, dateType } = req.query;

    // Build a dynamic filter object for filtering
    const filter = {};

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Choose the date field to filter (createdAt or updatedAt)
    const dateField = dateType === 'updated' ? 'updatedAt' : 'createdAt';

    // Handle date range filtering
    if (startDate || endDate) {
      filter[dateField] = {}; // Initialize the date field filter

      const parseDate = (dateString) => {
        const [day, month, year] = dateString.split('-');
        return new Date(`${year}-${month}-${day}`);
      };

      // Validate and parse startDate
      if (startDate) {
        const parsedStartDate = parseDate(startDate);
        if (!isNaN(parsedStartDate)) {
          filter[dateField].$gte = new Date(parsedStartDate.setHours(0, 0, 0, 0));
        }
      }

      // Validate and parse endDate
      if (endDate) {
        const parsedEndDate = parseDate(endDate);
        if (!isNaN(parsedEndDate)) {
          filter[dateField].$lte = new Date(parsedEndDate.setHours(23, 59, 59, 999));
        }
      }

      // Remove the date field filter if it remains empty
      if (Object.keys(filter[dateField]).length === 0) {
        delete filter[dateField];
      }
    }

    // Log the filter object for debugging
    console.log('Filter Object:', filter);

    // Fetch invoices based on the filter
    const invoices = await Invoice.find(filter)
      .populate('userId', 'name phone')
      .populate('products.productId', 'title')
      .populate('address', 'address city state');

    res.status(200).json({
      message: 'Filtered invoices fetched successfully',
      invoices,
    });
  } catch (err) {
    console.error('Error filtering invoices:', err);
    res.status(500).json({ message: 'Failed to filter invoices', error: err.message });
  }
};




  