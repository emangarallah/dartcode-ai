import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EmiCode — افهم المسألة، أتقن الحل', description: 'مدربك الذكي لحل وشرح مسائل LeetCode وProblem Solving بلغة Dart ولغات أخرى.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
