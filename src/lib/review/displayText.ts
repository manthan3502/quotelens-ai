// Presentation labels only; calculation and stored status values stay unchanged.
const labels: Record<string, string> = {
  draft: "Add quotations",
  extracting: "Reading quotations",
  review: "Ready to review",
  completed: "Ready to compare",
  "Lowest comparable calculated cost": "Lowest Total Cost",
  "Fastest stated delivery": "Fastest Delivery",
  "Longest stated warranty": "Longest Warranty",
  "Tax information incomplete": "Check the tax rate or amount",
  "Total mismatch detected": "The calculated total differs from the quotation",
  "Payment terms require review": "Check the payment terms",
  "Calculation incomplete": "More information is needed to calculate the total",
  "Currency differs across quotations": "These quotations use different currencies",
};

export function displayText(value: string) {
  return labels[value] ?? value;
}

export function reviewFieldLabel(path: string) {
  const lineField = /^lineItems\.(\d+)\.(.+)$/.exec(path);
  if (lineField) {
    const field = lineField[2] === "quantity" ? "quantity"
      : lineField[2] === "unitPrice" ? "unit price"
        : lineField[2] === "unitPrice.currency" ? "unit price currency"
          : lineField[2];
    return `Item ${Number(lineField[1]) + 1} ${field}`;
  }
  const labels: Record<string, string> = {
    currency: "Quotation currency",
    tax: "Tax rate or amount",
    "lineItems.taxPercent": "Tax rate for every line item, or a quotation-level tax rate or amount",
    shipping: "Shipping amount",
    installation: "Installation amount",
  };
  return labels[path] ?? path
    .replace(/\.(\d+)/g, (_, index: string) => ` ${Number(index) + 1}`)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\./g, " ")
    .replace(/^vendor /, "Vendor ");
}

