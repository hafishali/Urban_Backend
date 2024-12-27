const express = require('express');
const router = express.Router();
const invoiceController = require('../../../Controllers/Admin/Invoice/Invoice')
const jwtVerify = require('../../../Middlewares/jwtMiddleware')


// get invoice
router.get('/get', jwtVerify(['admin']),invoiceController.getInvoices);

// create invoice
// router.post('/create/:orderId', invoiceController.createInvoice);

// update
router.patch('/update/:id', jwtVerify(['admin']), invoiceController.updateInvoice);

// delete
router.delete('/delete/:id',  jwtVerify(['admin']),invoiceController.deleteInvoice);


// Fetch invoices with search
router.get('/search', /*  jwtVerify(['admin']) ,*/invoiceController.searchInvoices);

// Filter route
router.get('/filter', invoiceController.filterInvoices);


module.exports = router;