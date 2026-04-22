import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PricingPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/vendors/${slug}#pricing`);
}
