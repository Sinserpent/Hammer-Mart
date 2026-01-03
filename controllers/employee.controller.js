import employeeModel from "../models/employee.model.js";


export const getEmployeeData = async (req, res) => { 
  try {
    const { employeeId } = req;
    const employee = await employeeModel.findById(employeeId);
    if (!employee)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    return res.status(200).json({
      success: true,
      message: "Employee data fetched successfully",
      promoterData: {
        _id: employee._id,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
      },
    }
    
);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
