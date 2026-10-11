import type { ToolTourStep } from '@/components/guides/tool-tour';

// Authentic local captures of the bundled 14-product sample. Blocking errors
// were corrected through the real inline editor before the export capture.
export const shopifyTourSteps = [
  { id: 'upload', title: 'Load your supplier CSV', description: 'Upload your supplier file or explore 14 fictional sample products without preparing your own data.', image: { src: '/guides/supplier-csv-to-shopify/01-upload.webp', alt: 'Shopify Converter with the fictional supplier sample loaded, showing 14 products ready to map.', width: 1160, height: 720 } },
  { id: 'mapping', title: 'Map product columns', description: 'Match supplier fields to supported Shopify product fields and review suggested mappings.', image: { src: '/guides/supplier-csv-to-shopify/02-mapping.webp', alt: 'Suggested mappings for Title, Description, Type, SKU, Price and Inventory quantity in the Shopify Converter.', width: 1160, height: 720 } },
  { id: 'validation', title: 'Review and fix issues', description: 'Find missing product information and invalid values, then correct issues directly in the preview.', image: { src: '/guides/supplier-csv-to-shopify/03-validation.webp', alt: 'Four sample errors with the missing Title cell open in the inline editor, including Save, Cancel and Issue details controls.', width: 1160, height: 720 } },
  { id: 'export', title: 'Export your Shopify CSV', description: 'Download your corrected Shopify-compatible CSV and review it before importing into Shopify.', image: { src: '/guides/supplier-csv-to-shopify/04-export.webp', alt: 'Corrected sample with 14 products, zero errors and zero warnings, the empty error filter, and Download Shopify CSV enabled.', width: 1160, height: 720 } },
] as const satisfies readonly [ToolTourStep, ...ToolTourStep[]];
