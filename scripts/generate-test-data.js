const XLSX = require('xlsx');
const path = require('path');

const data = [
    {
        "VIN": "WB1234567890ABCDE",
        "Model Code": "21EJ",
        "Model": "BMW 740d xDrive",
        "Color Code": "475",
        "Color": "Black Sapphire",
        "Upholstery Code": "VCFU",
        "Upholstery": "Leather Merino Smoke White",
        "Status": 112, // Should be skipped (< 150)
        "Order Status Desc": "Order Scheduled",
        "Processing Type": "SH",
        "List Price": 550000,
        "Options": "337 ( 1G6 ) 420"
    },
    {
        "VIN": "WBX99887766554433",
        "Model Code": "11AA",
        "Model": "BMW 320i",
        "Color Code": "300",
        "Color": "Alpine White",
        "Upholstery Code": "KGNL",
        "Order Status Code": 150, // Should be kept
        "Processing Type": "SH",
        "List Price": 200000,
        "Price": 180000,
        "Options": "710 420"
    },
    {
        "VIN": "WBX55555555555555",
        "Model Code": "X5M",
        "Processing Type": "DE", // Should be hidden (Internal)
        "Status": 193,
        "List Price": 800000,
        "Options": "337"
    },
    {
        "VIN": "WBX11111111111111",
        "Model Code": "X1",
        "Processing Type": "ST",
        "Status": 182,
        "List Price": 150000
    }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Stock");

const outputPath = path.resolve(__dirname, '../test_stock.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Generated test file at: ${outputPath}`);
