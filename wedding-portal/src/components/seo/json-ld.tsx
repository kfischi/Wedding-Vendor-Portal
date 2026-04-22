import type { AnySchema } from "@/lib/seo/types";

interface JsonLdProps {
  data: AnySchema | AnySchema[];
}

/**
 * Renders one or more JSON-LD blocks.
 *
 * Array form emits a single script tag containing a JSON array — supported
 * by Google for multiple schemas on the same page. The `<` escape prevents
 * </script> injection via user-supplied strings (vendor descriptions etc.).
 */
export function JsonLd({ data }: JsonLdProps) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
