const Admin=require('../../../Models/Admin/AdminModel')

exports.getAdminProfile = async (req, res) => {
    try {
      if (!req.user || !req.user.adminId) {
        return res.status(401).json({ message: "Unauthorized. User information missing in token." });
      }
      const admin_Id = req.user.adminId;   
      const admin = await Admin.findById(admin_Id).select('-password');   
      if (!admin) {
        return res.status(404).json({ message: "Admin not found." });
      }
  
      res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  