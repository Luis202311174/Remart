// components/Layout.jsx
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      {/* pt-20 adds spacing below the fixed header (5rem) */}
      <main className="pt-20">{children}</main>
    </>
  );
}
