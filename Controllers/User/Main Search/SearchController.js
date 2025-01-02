const Products = require("../../../Models/Admin/ProductModel");
const Category = require("../../../Models/Admin/CategoryModel");
const SubCategory= require("../../../Models/Admin/SubcategoyModel");

exports.MainSearch = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;``

  try {
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(query, "i");

    // Search for products
    const productsQuery = Products.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { "colors.color": searchRegex },
        { "features.netWeight": searchRegex },
        { "features.fit": searchRegex },
        { "features.sleevesType": searchRegex },
        { "features.Length": searchRegex },
        { "features.occasion": searchRegex },
        { "features.innerLining": searchRegex },
        {"manufacturerName":searchRegex},
        {"manufacturerBrand":searchRegex}

      ],
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate({
        path: "colors.sizes",
        select: "size stock",
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Search for categories
    const categoriesQuery = Category.find({ name: searchRegex });

    // Search for subcategories
    const subcategoriesQuery = SubCategory.find({ name: searchRegex });

    const [products, categories, subcategories] = await Promise.all([
      productsQuery,
      categoriesQuery,
      subcategoriesQuery,
    ]);

    // Combine results
    const combinedResults = {
      products,
      categories,
      subcategories,
      totalResults: products.length + categories.length + subcategories.length,
    };

    res.status(200).json({
      message: "Search results fetched successfully",
      ...combinedResults,
    });
  } catch (err) {
    console.error("Error fetching search results:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
