import mongoose from "mongoose";

const employeeReferenceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true, // Ensures one document per employee
    },
    adminMessages: {
      type: Map,
      of: String, // key => value, value is the message
      default: {},
    },
  },
  { timestamps: true }
);


const employeeReferenceModel =
  mongoose.models.EmployeeReference ||
  mongoose.model("EmployeeReference", employeeReferenceSchema);

export default employeeReferenceModel;