export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface PropsTableProps {
  rows: PropRow[];
}

/** Compact props reference table — used in each preview page's "Import & Props" section. */
export function PropsTable({ rows }: Readonly<PropsTableProps>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Prop</th>
            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Type</th>
            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Default</th>
            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-brand-700 dark:text-brand-300">{row.name}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{row.type}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-400 dark:text-slate-500">{row.default ?? "—"}</td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
