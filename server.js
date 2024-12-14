require("dotenv").config()
const express = require("express")
const cors = require("cors")
const passport = require('passport')
const adminAuth = require('./Routes/Admin/Auth/AdminAuth')
const categoryRoutes = require('./Routes/Admin/Category/CategoryRoute')
const SubcategoryRoutes = require('./Routes/Admin/SubCategory/SubCategoryRoute')
const sliderRoutes = require('./Routes/Admin/Slider/sliderRoute')
const couponRoutes = require('./Routes/Admin/Coupon/couponRoute')
const productRoutes = require('./Routes/Admin/Product/productRoute')
const userCategoryRoutes = require('./Routes/User/Category/categoryRoute')
const userSubCategoryRoutes = require('./Routes/User/Subcategory/subCategoryRoute')
const userProductRoutes = require('./Routes/User/Product/productRoute')
const userSliderRoutes = require('./Routes/User/Slider/sliderRoute')
const userCartRoutes = require('./Routes/User/Cart/cartRoute')
const wishlistRoutes = require('./Routes/User/Wishlist/wishlistRoute')
const addressRoutes = require('./Routes/User/Address/addressRoute')
const userRoutes = require('./Routes/User/Auth/UserAuth')
const profileRoutes = require('./Routes/User/Profile/profileRoute')
const checkoutRoutes=require('./Routes/User/Checkout/checkoutRoute')
const userAdminRoutes=require('./Routes/Admin/Users/userRoute')
const orderRoutes = require('./Routes/User/Order/OrderRoute')
const reviewRoutes  = require('./Routes/User/Review/reviewRoute')
const adminOrderRoutes = require('./Routes/Admin/Order/orderRoute')
const deliveryFeeRoutes = require('./Routes/Admin/DeliveryFee/deliveryFeeRoute')


const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())
require('./DB/connection')
require('./config/passportConfigFacebook')
require('./config/passportConfigGoogle')
app.use(passport.initialize())

// admin Routes
app.use('/admin/auth',adminAuth)
app.use('/admin/category',categoryRoutes)
app.use('/admin/Subcategory',SubcategoryRoutes)
app.use('/admin/slider',sliderRoutes)
app.use('/admin/coupon',couponRoutes)
app.use('/admin/products',productRoutes)
app.use('/admin/users',userAdminRoutes)
app.use('/admin/orderlist', adminOrderRoutes)
app.use('/admin/delivery-fee',deliveryFeeRoutes)

// USER ROUTES
app.use('/user/category',userCategoryRoutes)
app.use('/user/subCategory',userSubCategoryRoutes)
app.use('/user/products',userProductRoutes)
app.use('/user/slider',userSliderRoutes)
app.use('/user/cart',userCartRoutes)
app.use('/user/wishlist',wishlistRoutes)
app.use('/user/address',addressRoutes)
app.use('/user/auth',userRoutes)
app.use('/user/profile',profileRoutes)
app.use('/user/checkout',checkoutRoutes)
app.use('/user/order',orderRoutes)
app.use('/user/review',reviewRoutes)


app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = 3000 || process.env.PORT

app.listen(PORT,()=>{
    console.log(`server started listening at PORT ${PORT}`);
})