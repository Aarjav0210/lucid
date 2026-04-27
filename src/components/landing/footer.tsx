import { Brand } from "./brand";
import { footerColumns } from "./data";

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Brand href="/" />
            <p className="footer-brand-text">
              The complete security layer for biosynthesis.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.heading} className="footer-col">
              <div className="footer-col-head">{col.heading}</div>
              {col.links.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>© {year} Lucid Bio</div>
        </div>
      </div>
    </footer>
  );
}
