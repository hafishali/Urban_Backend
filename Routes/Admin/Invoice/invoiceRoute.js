const express = require('express');
const router = express.Router();
const invoiceController = require('../../../Controllers/Admin/Invoice/Invoice')

// get invoice
router.get('/get',invoiceController.getInvoices);

// create invoice
router.post('/create/:orderId', invoiceController.createInvoice);

// update
router.patch('/update/:id', invoiceController.updateInvoice);

// delete
router.delete('/delete/:id', invoiceController.deleteInvoice);


// Fetch invoices with search
router.get('/search', invoiceController.searchInvoices);

// Filter route
router.get('/filter', invoiceController.filterInvoices);


module.exports = router;