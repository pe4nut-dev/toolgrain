import type { ToolTourStep } from '@/components/guides/tool-tour';

// Authentic local CSV Compare captures using only the bundled fictional catalogs.
export const csvCompareTourSteps = [
  { id: 'upload', title: 'Load two CSV files', description: "Start with your original and updated catalog, or try Toolgrain's sample files.", image: { src: '/guides/csv-compare/01-upload.webp', alt: 'CSV Compare with Original and Updated upload panels and the Try with sample files button.', width: 1160, height: 720 } },
  { id: 'matching-key', title: 'Choose your matching key', description: 'Select SKU in both files so reordered rows are matched correctly.', image: { src: '/guides/csv-compare/02-matching-key.webp', alt: 'Fictional catalogs loaded with sku selected in both Old file key and New file key dropdowns.', width: 1160, height: 720 } },
  { id: 'review', title: 'Review the differences', description: 'Explore added, removed and changed products. See exactly which values changed.', image: { src: '/guides/csv-compare/03-review.webp', alt: 'Sample comparison result filters and an expanded product row with the price change from 12.90 to 14.90 highlighted.', width: 1160, height: 720 } },
  { id: 'export', title: 'Export your results', description: 'Download the available comparison results for further review.', image: { src: '/guides/csv-compare/04-export.webp', alt: 'CSV Compare export area with downloads for added rows, removed rows and changed fields; key issues download is disabled because there are none.', width: 1160, height: 720 } },
] as const satisfies readonly [ToolTourStep, ...ToolTourStep[]];
