/** editor/preview/layout.js
 * Preview Layout
 * NO html / body here
 */

import "../../[domain]/styles.css";

export const metadata = {
  title: "Preview - Website Builder",
  robots: "noindex, nofollow",
};

export default function PreviewLayout({ children }) {
  return (
    <div className="min-h-screen w-full overflow-auto bg-white">
      {children}
    </div>
  );
}
