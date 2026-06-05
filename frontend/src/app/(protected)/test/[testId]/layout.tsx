/**
 * Test route layout — renders children with no additional chrome.
 * Each child page manages its own header and layout.
 * Auth protection is handled by the parent (protected) layout.
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
