
import EmployeeReference from "../models/adminMessage.model.js";
import LinkProcess from '../models/star.model.js';
import Employee from "../models/employee.model.js";
import jwt from "jsonwebtoken"

export const linkProcessing = async (req, res) => {
  const { hash, id, ip } = req.body;

  console.log(req.body)

  if (!hash || !id || !ip) {
    return res
      .status(400)
      .json({ success: false, message: "hash, id and ipAddress are required" });
  }

  try {
    // ==== GLOBAL HASH CHECK ====
    const duplicateGlobal = await LinkProcess.findOne({
      "references.hashes": hash,
    });

    if (duplicateGlobal) {
      return res.json({ success: false, message: "Duplicate device hash globally" });
    }

    // ==== FIND OR CREATE USER BUCKET ====
    let doc = await LinkProcess.findOne({ userId: id });

    if (!doc) {
      doc = await LinkProcess.create({
        userId: id,
        references: [{ ipAddress: ip, amount: 1, hashes: [hash] }],
      });
    } else {
      // ==== IP ENTRY CHECK ====
      let ipEntry = doc.references.find((ref) => ref.ipAddress === ip);
      if (ipEntry) {
        ipEntry.amount += 1;
        ipEntry.hashes.push(hash);
      } else {
        doc.references.push({ ipAddress: ip, amount: 1, hashes: [hash] });
      }
      await doc.save();
    }

    // ==== INCREMENT STAR POINTS ====
    await Employee.findByIdAndUpdate(id, { $inc: { starPoints: 3 } });

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("linkProcessing error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



export const getEmployeesByStarPoints = async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ starPoints: -1 });
    return res.json({ success: true, data: employees });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch employees" });
  }
};





export const attachLinkToAllEmployees = async (req, res) => {
  try {
    const { link, linkName } = req.body;
    if (!link || !linkName) {
      return res.status(400).json({ success: false, message: "Link and linkName are required" });
    }

    // Grab all employee IDs
    const employees = await Employee.find({}, "_id");
    if (!employees.length) {
      return res.status(404).json({ success: false, message: "No employees found" });
    }

    // Prepare bulk operations
    const bulkOps = employees.map(emp => {
      // Ensure the link ends with / before adding the employee ID
      const fullLink = link.endsWith("/") ? `${link}${emp._id}` : `${link}/${emp._id}`;
      return {
        updateOne: {
          filter: { employee: emp._id },
          update: { $set: { [`adminMessages.${linkName}`]: fullLink } }, // key => value
          upsert: true,
        },
      };
    });

    await EmployeeReference.bulkWrite(bulkOps);

    return res.json({ success: true, message: "Link added to all employees" });
  } catch (err) {
    console.error("attachLinkToAllEmployees error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllEmployeeReferences = async (req, res) => {
  try {
    const token = req.cookies.employee_token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // make sure JWT_SECRET is set
      console.log(decoded);
      
    } catch (err) {
      console.log(decoded);

      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = decoded.id; // adjust if your token payload uses a different key

    const data = await EmployeeReference.find({ employee: userId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getAllEmployeeReferences error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch employee references" });
  }
};


export const deleteEmployeeReferenceEntry = async (req, res) => {
  try {
    const token = req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const { linkName } = req.body;
    if (!linkName) {
      return res.status(400).json({
        success: false,
        message: "linkName is required",
      });
    }

    const result = await EmployeeReference.updateMany(
      {}, // ⚠️ ALL documents
      { $unset: { [`adminMessages.${linkName}`]: "" } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No references found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Entry deleted from all employees",
    });
  } catch (err) {
    console.error("deleteEmployeeReferenceEntry error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete entry",
    });
  }
};

