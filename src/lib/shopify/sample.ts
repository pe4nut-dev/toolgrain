// Bundled fictional demonstration data; loaded as a File through the normal CSV pipeline.
// Keep identifiers as CSV strings, never JavaScript numeric literals.
export const supplierSampleCsv = `Supplier SKU,Product name,Description,Price,Stock quantity,Supplier category
00012345,Willow Desk Tray,Fictional oak-look tray for small desk items,18.90,24,Desk accessories
00012346,Meadow Linen Pouch,Fictional reusable pouch with a cotton cord,9.50,60,Travel accessories
123456789012345678901234567890,Orbit Cable Keeper,Fictional silicone organizer for desk cables,6.90,120,Desk accessories
00012348,Harbor Ceramic Cup,"Fictional ceramic cup, matte finish",14.90,35,Kitchen accessories
00012349,Fern Notebook,Fictional dotted notebook with a green cover,11.00,80,Stationery
00012350,,Fictional missing-name product for correction practice,22.00,16,Home accessories
00012351,Cloud Felt Coaster,Fictional soft coaster for a bedside table,4.50,90,Home accessories
00012352,Trail Bottle Sleeve,Fictional fabric sleeve for a reusable bottle,not-a-price,42,Travel accessories
00012353,Sprout Plant Marker,Fictional wooden marker for small pots,3.20,many,Garden accessories
00012354,Amber Storage Basket,Fictional woven basket for light household items,24.90,12,Home accessories
00012355,,Fictional second missing-name product for correction practice,7.90,55,Stationery
987654321098765432109876543210,Nova Pen Stand,Fictional compact stand for writing tools,12.50,28,Desk accessories
00012357,Pebble Soap Dish,Fictional textured dish for a bathroom shelf,,30,Bath accessories
00012358,Moss Gift Wrap,Fictional reusable cloth gift wrap,8.90,75,Gift accessories
`;

export function createSupplierSampleFile(): File {
  return new File([supplierSampleCsv], 'toolgrain-fictional-supplier-sample.csv', { type: 'text/csv;charset=utf-8' });
}
