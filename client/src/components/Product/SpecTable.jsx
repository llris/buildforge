export default function SpecTable({ specs }) {
  if (!specs || Object.keys(specs).length === 0) {
    return <div className="text-muted-foreground p-4">No specifications available.</div>;
  }

  // Format keys nicely, e.g. "maxMemorySpeed" -> "Max Memory Speed"
  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <tbody className="divide-y divide-border">
            {Object.entries(specs).map(([key, value], idx) => (
              <tr key={key} className={idx % 2 === 0 ? 'bg-muted/10' : 'bg-background'}>
                <th className="w-1/3 px-6 py-4 font-medium text-foreground whitespace-nowrap bg-muted/20">
                  {formatKey(key)}
                </th>
                <td className="px-6 py-4 text-muted-foreground">
                  {typeof value === 'boolean' 
                    ? (value ? 'Yes' : 'No')
                    : Array.isArray(value) 
                      ? value.join(', ')
                      : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
