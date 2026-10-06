import type { LucideIcon } from 'lucide-react';
import { Database, GitCompareArrows, ShoppingBag, Files, ListChecks, Megaphone } from 'lucide-react';
export const categories = [
    { id: 'data', name: 'Data', description: 'Less cleanup. Better data.', icon: Database },
    { id: 'ecommerce', name: 'Ecommerce', description: 'Keep your product data in order.', icon: ShoppingBag },
    { id: 'documents', name: 'Documents', description: 'Make paperwork less work.', icon: Files },
    { id: 'marketing', name: 'Marketing', description: 'Small helpers for your next campaign.', icon: Megaphone },
] as const;
export type CategoryId = typeof categories[number]['id'];
export type Tool = {
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    category: CategoryId;
    status: 'available' | 'coming-soon' | 'beta' | 'new';
    featured?: boolean;
    icon: LucideIcon;
    privacy?: {
        mode: 'local' | 'planned-local';
        label: string;
    };
    steps: readonly string[];
    faqs: readonly {
        question: string;
        answer: string;
    }[];
};
const launchFaq = { question: 'Can I use this tool today?', answer: 'Not yet. This tool is coming soon. The CRM CSV Cleaner is available now.' };
export const tools: readonly Tool[] = [
    { slug: 'crm-csv-cleaner', name: 'CRM CSV Cleaner', shortDescription: 'Clean, review and deduplicate CRM contact exports directly in your browser.', description: 'Clean, review and deduplicate CRM contact exports directly in your browser.', category: 'data', status: 'available', featured: true, icon: Database, privacy: { mode: 'local', label: 'Your file stays on your device.' }, steps: ['Add your CSV.', 'Analyze data health and review safe fixes.', 'Review duplicates and download your cleaned CSV.'], faqs: [{ question: 'Can I clean a CSV today?', answer: 'Yes. Analyze your CSV, apply conservative email and name suggestions, review duplicate groups and download a cleaned copy. Your original file stays unchanged.' }, { question: 'Will my contacts be uploaded?', answer: 'No. Files are read and analyzed only in browser memory on your device. No CSV data is uploaded, saved or sent to external services.' }, { question: 'Which files are supported?', answer: 'Select one UTF-8 CSV file up to 10 MB, with a header row. Commas, semicolons, quoted values and Windows or Unix line endings are supported.' }] },
    { slug: 'csv-compare', name: 'CSV Compare', shortDescription: 'Compare two CSV files and quickly find added, removed or changed rows.', description: 'Understand what changed between two exports without inspecting every row by hand.', category: 'data', status: 'coming-soon', icon: GitCompareArrows, privacy: { mode: 'planned-local', label: 'Browser processing planned' }, steps: ['Select two CSV files.', 'Choose how rows should be matched.', 'Review and export the differences.'], faqs: [launchFaq] },
    { slug: 'supplier-csv-to-shopify', name: 'Supplier CSV to Shopify', shortDescription: 'Convert supplier product files into clean Shopify-ready CSV files.', description: 'Prepare supplier catalogs for Shopify with a focused field-mapping workflow.', category: 'ecommerce', status: 'coming-soon', icon: ShoppingBag, steps: ['Select a supplier product file.', 'Map columns to Shopify fields.', 'Export your Shopify-ready CSV.'], faqs: [launchFaq] },
    { slug: 'invoice-renamer', name: 'Invoice Renamer', shortDescription: 'Automatically organize and rename messy invoice files.', description: 'Give invoice files clear, consistent names so they are easier to find and organize.', category: 'documents', status: 'coming-soon', icon: Files, steps: ['Select your invoice files.', 'Review suggested file names.', 'Save the organized files.'], faqs: [launchFaq] },
    { slug: 'merchant-feed-checker', name: 'Merchant Feed Checker', shortDescription: 'Check product feeds for common Google Merchant Center issues before upload.', description: 'Spot common product-feed problems before you submit your catalog.', category: 'ecommerce', status: 'coming-soon', icon: ListChecks, steps: ['Select a product feed.', 'Review flagged fields and issues.', 'Use the report to improve your feed.'], faqs: [launchFaq] },
];
export function getTool(slug: string) { return tools.find(tool => tool.slug === slug); }
export function getCategory(id: CategoryId) { return categories.find(category => category.id === id)!; }
export function getRelatedTools(tool: Tool) { return tools.filter(item => item.slug !== tool.slug).sort((a, b) => Number(b.category === tool.category) - Number(a.category === tool.category)).slice(0, 3); }
