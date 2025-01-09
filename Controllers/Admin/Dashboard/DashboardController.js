
const Order = require('../../../Models/User/OrderModel');
const orders =require('../../../Models/User/OrderModel')
const users=require('../../../Models/User/UserModel')

// count for orders,users,total revenue,recent orders
exports.getStats = async (req, res) => {
    try {
      
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
  
    
      const totalOrders = await orders.countDocuments();
  
      
      const totalUsers = await users.countDocuments();
  
      
      const revenueData = await orders.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
      ]);
      const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
  
      const recentOrders = await orders.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 1)), 
            },
          },
        },
        {
          $group: {
            _id: null,
            recentOrderCount: { $sum: 1 }, 
          },
        },
      ]);
  
      res.status(200).json({
        totalOrders,
        totalUsers,
        totalRevenue,
        recentOrders,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching stats', error: error.message });
      console.log(error)
    }
  };


// graph api by filter(year,start and end month,place)
  exports.getMonthlyRevenue = async (req, res) => {
    try {
        const { 
            place,       
            startMonth, 
            endMonth, 
            year,Orderstatus       
        } = req.query;
  
        
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        const startMonthParsed = startMonth ? parseInt(startMonth) : 1;
        const endMonthParsed = endMonth ? parseInt(endMonth) : 12;
  
        
        if (startMonthParsed < 1 || startMonthParsed > 12 || 
            endMonthParsed < 1 || endMonthParsed > 12 || 
            startMonthParsed > endMonthParsed) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid month range' 
            });
        }
  
      
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
  
        
        const matchStage = {
            status:Orderstatus?Orderstatus:'Delivered', 
            createdAt: {
                $gte: new Date(currentYear, startMonthParsed - 1, 1),
                $lt: new Date(currentYear, endMonthParsed, 1)
            }
        };
  
        // Define the aggregation pipeline
        const pipeline = [
            // Join with the Address collection
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'addressId',
                    foreignField: '_id',
                    as: 'addressDetails',
                },
            },
            { $unwind: '$addressDetails' }, // Flatten address details
            
            // Dynamic place filter
            ...(place ? [{
                $match: {
                    $or: [
                        { 'addressDetails.state': place },
                        { 'addressDetails.city': place }
                    ]
                }
            }] : []),
            
            // Base match stage
            { $match: matchStage },
            
            // Group by month and calculate total revenue
            {
                $group: {
                    _id: { 
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$totalPrice' },
                    orderCount: { $sum: 1 }
                },
            },
            { $sort: { '_id.month': 1 } }, // Sort by month
            // Project to get more readable format
            {
                $project: {
                    _id: 0,
                    month: '$_id.month',
                    monthName: { $arrayElemAt: [monthNames, { $subtract: ['$_id.month', 1] }] },
                    totalRevenue: 1,
                    orderCount: 1
                }
            }
        ];
  
        // Execute the aggregation
        const monthlyRevenue = await orders.aggregate(pipeline);
  
        // Prepare the response with all months in the specified range
        const filteredData = Array.from({ length: endMonthParsed - startMonthParsed + 1 }, (_, index) => ({
            month: startMonthParsed + index,
            monthName: monthNames[startMonthParsed + index - 1],
            totalRevenue: 0,
            orderCount: 0
        }));
  
        // Populate the revenue data for the filtered months
        monthlyRevenue.forEach(item => {
            const existingMonthIndex = filteredData.findIndex(m => m.month === item.month);
            if (existingMonthIndex !== -1) {
                filteredData[existingMonthIndex].totalRevenue = item.totalRevenue;
                filteredData[existingMonthIndex].orderCount = item.orderCount;
            }
        });
  
        res.status(200).json({ 
            success: true, 
            data: filteredData,
            metadata: {
                year: currentYear,
                startMonth: startMonthParsed,
                endMonth: endMonthParsed,
                totalRevenueInPeriod: filteredData.reduce((sum, month) => sum + month.totalRevenue, 0),
                totalOrdersInPeriod: filteredData.reduce((sum, month) => sum + month.orderCount, 0)
            }
        });
    } catch (error) {
        console.error('Error in getMonthlyRevenue:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching data', 
            error: error.message 
        });
    }
};

// recent orders by filter(month)
exports.getRecentOrders = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Prepare date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let queryConditions = {};

    if (month && year) {
      const yearValue = parseInt(year);
      const monthIndex = parseInt(month) - 1;

      queryConditions.createdAt = {
        $gte: new Date(yearValue, monthIndex, 1),
        $lt: new Date(yearValue, monthIndex + 1, 1),
      };
    } else if (month) {
      const currentYear = now.getFullYear();
      const monthIndex = parseInt(month) - 1;

      queryConditions.createdAt = {
        $gte: new Date(currentYear, monthIndex, 1),
        $lt: new Date(currentYear, monthIndex + 1, 1),
      };
    } else if (year) {
      const yearValue = parseInt(year);

      queryConditions.createdAt = {
        $gte: new Date(yearValue, 0, 1),
        $lt: new Date(yearValue + 1, 0, 1),
      };
    } else {
      queryConditions.createdAt = { $gte: oneWeekAgo, $lte: now };
    }

    console.log("Query Conditions:", queryConditions);

    const orders = await Order.find(queryConditions)
      .populate({ path: "userId", select: "name email phone" })
      .populate({ path: "addressId", select: "name number address city state pincode" })
      .populate({ path: "products.productId", select: "" })
      .sort({ createdAt: -1 });

    console.log("Fetched Orders:", orders);

    res.status(200).json({
      success: true,
      total: orders.length,
      data: orders,
      metadata: {
        fetchedAt: new Date(),
        filterApplied: {
          ...(month && { month: parseInt(month) }),
          ...(year && { year: parseInt(year) }),
          ...(month || year
            ? null
            : { recentOrdersFromDate: oneWeekAgo, toDate: now }),
        },
      },
    });
  } catch (error) {
    console.error("Error in getRecentOrders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recent orders",
      error: error.message,
    });
  }
};





  



