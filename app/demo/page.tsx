import { BasicComparison } from "@/components/comparison/basic-comparison";
import { sampleComparisonTitle, sampleVerifiedQuotations } from "@/src/lib/demo/sampleComparison";

export default function DemoPage() {
  return <BasicComparison comparisonId="demo" title={sampleComparisonTitle} quotations={sampleVerifiedQuotations} demo />;
}
