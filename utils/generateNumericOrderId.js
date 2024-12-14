const Counter = require('../Models/User/CounterModel');
async function generateNumericOrderId() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'orderId' }, // Specify the counter name
    { $inc: { seq: 1 } }, // Increment the sequence by 1
    { new: true, upsert: true } // Create the counter document if it doesn't exist
  );
  return counter.seq; // Return the updated sequence number
}
module.exports = generateNumericOrderId;