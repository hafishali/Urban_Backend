const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"]
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: [true, "Product ID is required"]
      },
      quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity cannot be less than 1"]
      },
      price: {
        type: Number,
        required: [true, "Price is required"]
      },
      color: {
        type: String,
        required: [true, "Color is required"]
      },
      size: {
        type: String,
        required: [true, "Size is required"]
      },

    }
  ],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  discountedTotal: {
    type: Number,
    default: 0
  },
  coupenAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,

  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});




// Method to apply a coupon and reduce totalPrice
// cartSchema.methods.applyCoupon = async function (coupon) {
//   if (!coupon) {
//     throw new Error('Coupon is required to apply a discount.');
//   }

//   const currentDate = new Date();

//   // Check if the coupon is valid
//   if (coupon.status !== 'active' || currentDate < coupon.startDate || currentDate > coupon.endDate) {
//     throw new Error('Invalid or expired coupon.');
//   }

//   // Apply discount to totalPrice
//   if (coupon.discountType === 'percentage') {
//     this.totalPrice -= (this.totalPrice * coupon.discountValue) / 100;
//   } else if (coupon.discountType === 'amount') {
//     this.totalPrice -= coupon.discountValue;
//   }

//   // Ensure totalPrice is not less than 0
//   if (this.totalPrice < 0) {
//     this.totalPrice = 0;
//   }

//   // Mark the coupon as applied
//   this.coupon = coupon._id;

//   return this.totalPrice;
// };

// Pre-save hook to calculate total price
cartSchema.pre('save', async function (next) {
  // If there are no items in the cart, reset all calculated fields to default values
  if (!this.items || this.items.length === 0) {
    this.totalPrice = 0;
    this.discountedTotal = 0;
    this.coupenAmount = 0;
    this.discountType = null;
    this.coupon = null;
    return next(); // Skip further processing for an empty cart
  }

  // Recalculate total price if items are modified
  if (this.isModified('items')) {
    this.totalPrice = this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    this.discountedTotal = this.totalPrice;
  }

  // Handle coupon validation
  if (this.coupon) {
    try {
      // Fetch the coupon
      const coupon = await mongoose.model('Coupon').findById(this.coupon);
      if (!coupon) {
        // Reset discount-related fields if coupon is invalid
        this.coupon = null;
        this.discountedTotal = this.totalPrice;
        this.coupenAmount = 0;
        this.discountType = null;
      } else {
        // Fetch product categories from the cart
        const cartCategories = await mongoose
          .model('Products')
          .find({ _id: { $in: this.items.map((item) => item.productId) } })
          .select('category')
          .lean();

        const cartCategoryIds = cartCategories.map((prod) => prod.category.toString());
        const couponCategoryIds = coupon.category.map((cat) => cat.toString());

        // Check if any cart category matches the coupon categories
        const hasMatchingCategory = cartCategoryIds.some((catId) =>
          couponCategoryIds.includes(catId)
        );

        if (hasMatchingCategory) {
          // Apply discount if there's a matching category
          let discount = 0;
          if (coupon.discountType === 'percentage') {
            discount = (this.totalPrice * coupon.discountValue) / 100;
          } else if (coupon.discountType === 'amount') {
            discount = coupon.discountValue;
          }

          // Ensure discount does not exceed totalPrice
          discount = Math.min(discount, this.totalPrice);

          // Update discountedTotal and discount-related fields
          this.discountedTotal = this.totalPrice - discount;
          this.coupenAmount = coupon.discountValue;
          this.discountType = coupon.discountType;
        } else {
          // Remove coupon if no categories match
          this.coupon = null;
          this.discountedTotal = this.totalPrice;
          this.coupenAmount = 0;
          this.discountType = null;
        }
      }
    } catch (error) {
      // Log or handle error as necessary
      console.error("Error validating coupon:", error.message);
    }
  }

  next();
});


module.exports = mongoose.model('Cart', cartSchema);
