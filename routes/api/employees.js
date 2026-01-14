const express = require("express");
const router = express.Router();
const EmployeeController = require("../../controllers/employeeController");

// Tüm çalışanları getir
router.get("/", EmployeeController.getAllEmployees);

// Pozisyon listesi
router.get("/positions/list", EmployeeController.getPositions);

// İstatistikler (ID rotasından önce gelmeli)
router.get("/logs/today", EmployeeController.getTodayLogs);
router.get("/stats/active", EmployeeController.getActiveEmployees);
router.get("/stats/late", EmployeeController.getLateStats);
router.get("/stats/total-hours", EmployeeController.getTotalHours);

// Vardiyalar
router.get("/shifts/list", EmployeeController.getShiftTemplates);
router.get("/:id/shifts", EmployeeController.getEmployeeShifts);
router.post("/:id/shifts", EmployeeController.assignShift);
router.delete("/:id/shifts/:shiftAssignmentId", EmployeeController.deleteShiftAssignment);

// İzinler
router.get("/:id/leave", EmployeeController.getEmployeeLeave);
router.post("/:id/leave", EmployeeController.createEmployeeLeave);

// Tek çalışan getir
router.get("/:id", EmployeeController.getEmployeeById);

// Çalışan İşlemleri
router.post("/", EmployeeController.createEmployee);
router.put("/:id", EmployeeController.updateEmployee);
router.delete("/:id", EmployeeController.deleteEmployee);

// Log İşlemleri
router.post("/:id/log", EmployeeController.createLog);
router.put("/logs/:logId", EmployeeController.updateLog);

module.exports = router;
