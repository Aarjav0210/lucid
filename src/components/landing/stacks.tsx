"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { Reveal } from "./reveal";
import { Toast } from "./toast";
import { productGroups, type Product, type ProductGroup } from "./data";

/** Maps a product status to (badgeClass, badgeLabel). */
function statusBadge(status: Product["status"]): [string, string] {
  switch (status) {
    case "live":
      return ["live", "Live"];
    case "soon":
      return ["soon", "Soon"];
    case "exploring":
      // The "exploring" tier reuses the hollow-dot affordance of "soon".
      return ["soon", "Exploring"];
  }
}

interface ProductRowProps {
  product: Product;
  onComingSoon: () => void;
}

function ProductRow({ product, onComingSoon }: ProductRowProps) {
  const [tagClass, tagLabel] = statusBadge(product.status);
  const isLink = Boolean(product.href);
  const launchLabel = product.launchLabel;

  const inner = (
    <>
      <div className={`product-tag ${tagClass}`}>{tagLabel}</div>
      <div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-tagline">{product.tagline}</div>
      </div>
      <p className="product-desc">{product.description}</p>
      {launchLabel ? (
        <span className="product-launch">
          {launchLabel} <span className="arr">→</span>
        </span>
      ) : (
        // Empty grid cell keeps the 4-column layout aligned across rows.
        <span aria-hidden="true" />
      )}
    </>
  );

  if (isLink && product.href) {
    return (
      <Reveal as="article" className="product">
        <Link
          href={product.href}
          onClick={() =>
            track("product_click", { product: product.id, name: product.name })
          }
          style={{ display: "contents" }}
        >
          {inner}
        </Link>
      </Reveal>
    );
  }

  return (
    <Reveal
      as="article"
      className="product"
      onClick={() => {
        track("product_click", { product: product.id, name: product.name });
        onComingSoon();
      }}
    >
      {inner}
    </Reveal>
  );
}

interface GroupProps {
  group: ProductGroup;
  onComingSoon: () => void;
}

function Group({ group, onComingSoon }: GroupProps) {
  return (
    <div
      id={`stack-${group.id}`}
      className={`product-group${group.dim ? " dim" : ""}`}
    >
      <div className="product-group-head">
        <div className="product-group-tag">
          <span className="num">{group.number} ·</span> {group.label}
        </div>
        <div>
          <h3 className="product-group-title">
            {group.titlePrefix}
            <em>{group.titleEmphasis}</em>
            {group.titleSuffix}
          </h3>
          <p className="product-group-note">{group.note}</p>
        </div>
      </div>
      <div className="products-list">
        {group.products.map((p) => (
          <ProductRow key={p.id} product={p} onComingSoon={onComingSoon} />
        ))}
      </div>
    </div>
  );
}

export function Stacks() {
  const [toast, setToast] = useState(false);
  const showComingSoon = useCallback(() => setToast(true), []);
  const hideToast = useCallback(() => setToast(false), []);

  return (
    <section className="section" id="stacks">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">§ 02 — Stacks</div>
          <h2 className="section-title">
            Two surfaces. One <em>continuous</em> perimeter.
          </h2>
        </div>
        <div className="products">
          {productGroups.map((group) => (
            <Group key={group.id} group={group} onComingSoon={showComingSoon} />
          ))}
        </div>
      </div>
      <Toast visible={toast} onHide={hideToast} />
    </section>
  );
}
