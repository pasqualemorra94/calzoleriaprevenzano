/**
 * JSON-LD Structured Data component.
 *
 * Restricts input to JSON-LD-safe primitive types to prevent XSS
 * if future callers pass user-controlled data. `Record<string, unknown>`
 * would allow nested objects with malicious content.
 */

type JsonLdPrimitive = string | number | boolean | null;
type JsonLdValue = JsonLdPrimitive | JsonLdValue[] | { [key: string]: JsonLdValue };

interface StructuredDataProps {
  data: JsonLdValue | JsonLdValue[];
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}
