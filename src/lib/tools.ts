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
    seo?: {title:string;description:string;overview:string;useCases:readonly string[];relatedSlug:string;relatedPrompt:string};
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
    { slug: 'crm-csv-cleaner', name: 'CRM CSV Cleaner', shortDescription: 'Clean, review and deduplicate CRM contact exports directly in your browser.', description: 'Clean, review and deduplicate CRM contact exports directly in your browser.', category: 'data', status: 'available', featured: true, icon: Database, privacy: { mode: 'local', label: 'Your file stays on your device.' }, steps: ['Add your CSV.', 'Analyze data health and review safe fixes.', 'Review duplicates and download your cleaned CSV.'], seo: {"title":"CRM CSV Cleaner – Find & Review Duplicate Contacts | Toolgrain","description":"Clean CRM CSV exports, detect duplicate contacts, flag invalid emails and review data quality directly in your browser.","overview":"CRM CSV Cleaner detects duplicate groups, flags invalid email addresses and missing contact information, and helps you review formatting issues. Processing runs locally in your browser. Review suggested fixes and explicitly choose which duplicate records to keep before exporting.","useCases":["Clean CRM exports before import","Review lead lists","Check contact databases","Prepare CSVs for another CRM"],"relatedSlug":"csv-compare","relatedPrompt":"Need to compare two exports after cleaning your data?"}, faqs: [{"question":"Does Toolgrain upload my CSV?","answer":"For the CRM CSV Cleaner, file processing happens locally in the browser and CSV contents are not intentionally uploaded to Toolgrain."},{"question":"Does the tool remove duplicates automatically?","answer":"No. Duplicate groups are presented for review. Rows are excluded from the cleaned export only after you explicitly choose which record to keep."},{"question":"What CSV files are supported?","answer":"One UTF-8 CSV file up to 10 MB with a header row. Comma, semicolon and tab delimiters, quoted values and Windows or Unix line endings are supported."},{"question":"Can Toolgrain detect invalid email addresses?","answer":"Yes. Practical syntax checks run on recognized email columns. They do not verify mailboxes, deliverability or DNS records."}] },
    { slug: 'csv-compare', name: 'CSV Compare', shortDescription: 'Compare two CSV files and quickly find added, removed or changed rows.', description: 'Compare two CSV files and quickly find added, removed or changed rows.', category: 'data', status: 'available', icon: GitCompareArrows, privacy: { mode: 'local', label: 'Your files stay on your device.' }, steps: ['Add your old and new CSV.', 'Choose the column that identifies each row.', 'Review what changed.'], seo: {"title":"CSV Compare – Find Added, Removed & Changed Rows | Toolgrain","description":"Compare two CSV files and quickly find added, removed, changed and unchanged rows directly in your browser.","overview":"Compare an old and a new CSV by choosing a matching key column in each file. Review added, removed, changed and unchanged rows, and identify key conflicts. Shared non-key columns are compared by exact header name, and reports can be exported locally.","useCases":["Compare monthly exports","Detect CRM changes","Compare supplier data","Audit product feeds","Compare database exports"],"relatedSlug":"crm-csv-cleaner","relatedPrompt":"Need to clean a CSV before comparing it?"}, faqs: [{"question":"Does CSV Compare upload my files?","answer":"No. Both files are parsed and compared locally in your browser; CSV contents are not sent to Toolgrain’s application server."},{"question":"How does Toolgrain match rows?","answer":"Select one key column in each file. Matching is deterministic: key values are trimmed and otherwise compared exactly, including case."},{"question":"Can the files use different column orders?","answer":"Yes. Shared non-key columns are compared by exact header name, regardless of column order. Columns unique to a file are reported as schema changes."},{"question":"What happens when the key is duplicated?","answer":"Duplicate or missing keys are reported as key issues rather than matched automatically. A duplicated key in either file excludes every row with that key in both files."},{"question":"Which files are supported?","answer":"Two UTF-8 CSV files, each up to 10 MB, with header rows. The files may use different delimiters and key header names."}] },
    { slug: 'supplier-csv-to-shopify', name: 'Supplier CSV to Shopify', shortDescription: 'Convert supplier product files into clean Shopify-ready CSV files.', description: 'Prepare supplier catalogs for Shopify with a focused field-mapping workflow.', category: 'ecommerce', status: 'coming-soon', icon: ShoppingBag, steps: ['Select a supplier product file.', 'Map columns to Shopify fields.', 'Export your Shopify-ready CSV.'], faqs: [launchFaq] },
    { slug: 'invoice-renamer', name: 'Invoice Renamer', shortDescription: 'Automatically organize and rename messy invoice files.', description: 'Give invoice files clear, consistent names so they are easier to find and organize.', category: 'documents', status: 'coming-soon', icon: Files, steps: ['Select your invoice files.', 'Review suggested file names.', 'Save the organized files.'], faqs: [launchFaq] },
    { slug: 'merchant-feed-checker', name: 'Merchant Feed Checker', shortDescription: 'Check product feeds for common Google Merchant Center issues before upload.', description: 'Spot common product-feed problems before you submit your catalog.', category: 'ecommerce', status: 'coming-soon', icon: ListChecks, steps: ['Select a product feed.', 'Review flagged fields and issues.', 'Use the report to improve your feed.'], faqs: [launchFaq] },
];
export function getTool(slug: string) { return tools.find(tool => tool.slug === slug); }
export function getCategory(id: CategoryId) { return categories.find(category => category.id === id)!; }
export function getRelatedTools(tool: Tool) { return tools.filter(item => item.slug !== tool.slug).sort((a, b) => Number(b.category === tool.category) - Number(a.category === tool.category)).slice(0, 3); }
