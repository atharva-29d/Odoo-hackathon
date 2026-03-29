export const expenseCategories = [
  "Travel",
  "Meals",
  "Accommodation",
  "Office Supplies",
  "Client Meeting",
  "Fuel",
  "Training",
  "Other"
];

export const currencyOptions = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY"];

export const approvalRoleOptions = [
  { label: "Manager", value: "manager" },
  { label: "Finance", value: "finance" },
  { label: "Director", value: "director" },
  { label: "CFO", value: "cfo" },
  { label: "Admin", value: "admin" }
];

export const approvalRuleOptions = [
  { label: "Hybrid", value: "hybrid" },
  { label: "Percentage", value: "percentage" },
  { label: "Specific Approver", value: "specific" }
];

export const defaultWorkflowSteps = [
  { levelKey: "manager", label: "Manager", approverRole: "manager" },
  { levelKey: "finance", label: "Finance", approverRole: "finance" },
  { levelKey: "director", label: "Director", approverRole: "director" }
];
