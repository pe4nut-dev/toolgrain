export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return new Intl.NumberFormat('en', { maximumFractionDigits: index === 0 ? 0 : 1 }).format(bytes / 1024 ** index) + ' ' + units[index];
}
export type FileSelectionRules = {
  acceptedTypes: readonly string[];
  multiple?: boolean;
  maxFileSize: number;
  fileTypeError?: string;
};
// File metadata only. The selection layer never reads or transmits file contents.
export function validateFiles(files: readonly File[], rules: FileSelectionRules): string | null {
  if (!files.length) return null;
  if (!rules.multiple && files.length > 1) return 'Please choose one file at a time. No files were added.';
  for (const file of files) {
    const matches = rules.acceptedTypes.some(type => {
      const accepted = type.toLowerCase();
      if (accepted.startsWith('.')) return file.name.toLowerCase().endsWith(accepted);
      if (accepted.endsWith('/*')) return file.type.toLowerCase().startsWith(accepted.slice(0, -1));
      return file.type.toLowerCase() === accepted;
    });
    if (rules.acceptedTypes.length && !matches) return rules.fileTypeError ?? 'Unsupported file type. Allowed types: ' + rules.acceptedTypes.join(', ') + '.';
    if (file.size > rules.maxFileSize) return 'File is too large. Maximum size is ' + formatFileSize(rules.maxFileSize) + '.';
  }
  return null;
}
