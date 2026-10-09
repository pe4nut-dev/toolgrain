// Entirely fictional, bundled demonstration data. Values remain CSV strings.
export const crmSampleCsv = `first_name,last_name,company,email,phone,location,contact_id
Mara,Winter,Example Studio,mara.winter@example.com,00123456789,Berlin,000001
Mara,Winter,Example Studio,mara.winter@example.com,00123456789,Berlin,000001
Lena,Müller,Example Works,lena.mueller@example.org,004912345600,München,000003
lena,Mueller,Example Works,LENA.MUELLER@example.org,0049 123 45600,Muenchen,000004
Jonas,Feld,Example Supply,jonas.feld.example.com,004912345601,Hamburg,000005
Nora,Sommer,,nora.sommer@example.net,004912345602,Köln,000006
Finn,Berg,Example Market,finn.berg@example.com,004912345603,,000007
  Emma  ,Stein,Example Paper,emma.stein@example.org,004912345604,Bremen,000008
PAUL,ROTH,Example Home,PAUL.ROTH@example.net,0049 123 45605,Leipzig,000009
Mila,Grün,Example Garden,mila.gruen@example.com,004912345606,Essen,000010
Noah,Heide,Example Goods,noah.heide@example.org,004912345607,Dresden,000011
Ella,Bach,Example Books,ella.bach@example.net,004912345608,Bonn,000012
Leo,Wald,Example Shop,leo@@example.com,004912345609,Hannover,000013
Lina,Kern,Example Craft,,004912345610,Münster,000014
Ben,Frost,Example Design,ben.frost@example.org,,Potsdam,000015
Ida,Blume,"Example, Atelier",ida.blume@example.net,004912345612,Aachen,123456789012345678901234567890
Oskar,Tal,Example Textiles,oskar.tal@example.com,004912345613,Kiel,000017
Clara,Licht,Example Office,clara.licht@example.org,004912345614,Mainz,000018
Theo,Sand,Example Wood,theo.sand@example.net,004912345615,Ulm,000019
Alma,Regen,Example Art,alma.regen@example.com,004912345616,Trier,000020`;

const catalogHeader = 'sku,product_name,category,price,stock,status';
const products = Array.from({ length: 18 }, (_, index) => [
  index === 2 ? '123456789012345678901234567890' : String(index + 1).padStart(8, '0'),
  index === 3 ? '"Fictional notebook, lined"' : 'Fictional product ' + (index + 1),
  ['Office', 'Home', 'Garden'][index % 3], '12.90', '24', 'active',
]);
export const compareOriginalSampleCsv = [catalogHeader, ...products.map(row => row.join(','))].join('\n');
export const compareUpdatedSampleCsv = [catalogHeader, ...products.slice(1).reverse().map(row => {
  const updated = [...row];
  if (row[0] === '00000002') updated[3] = '14.90';
  if (row[0] === '123456789012345678901234567890') updated[4] = '18';
  if (row[0] === '00000004') updated[1] = 'Fictional notebook revised';
  return updated.join(',');
}), '00000019,Fictional new product,Home,19.90,12,active'].join('\n');

export function createCrmSampleFile() { return new File([crmSampleCsv], 'toolgrain-fictional-contacts.csv', { type: 'text/csv' }); }
export function createCompareSampleFiles() {
  return { old: new File([compareOriginalSampleCsv], 'toolgrain-fictional-original.csv', { type: 'text/csv' }), new: new File([compareUpdatedSampleCsv], 'toolgrain-fictional-updated.csv', { type: 'text/csv' }) };
}
