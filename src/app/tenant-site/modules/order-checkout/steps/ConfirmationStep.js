// src/app/tenant-site/modules/order-checkout/steps/ConfirmationStep.js
"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { useTenantSite } from "../../../[domain]/TenantClientWrapper";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { formatCurrency } from "@/lib/currency";

export default function ConfirmationStep({
  orderId,
  orderNumber,
  totalAmount,
  service,
  selectedPackage,
  deliveryDays,
  onReset,
  theme,
  lang,
  isRTL,
}) {
  const { domain } = useTenantSite();
  const title = resolveTranslated(service.title || service.name, lang);
  const displayAmount = totalAmount || selectedPackage?.price || service?.base_price || 0;

  return (
    <div className="mt-8 text-center space-y-6">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-success text-success-foreground">
        <Check className="w-8 h-8" strokeWidth={2.5} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {resolveTranslated({ en: "Order Confirmed!", ar: "تم تأكيد الطلب!", ur: "آرڈر کی تصدیق!" }, lang)}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {resolveTranslated(
            {
              en: "Your order has been placed. You'll receive a confirmation email shortly.",
              ar: "تم تقديم طلبك. ستتلقى رسالة تأكيد بالبريد الإلكتروني قريباً.",
              ur: "آپ کا آرڈر مکمل ہو گیا ہے۔ آپ کو جلد ہی تصدیقی ای میل موصول ہو گی۔",
            },
            lang
          )}
        </p>
      </div>

      {/* Order summary card */}
      <div className="bg-muted rounded-2xl border border-border p-5 max-w-md mx-auto text-start space-y-3">
        <Row
          label={resolveTranslated({ en: "Order", ar: "الطلب", ur: "آرڈر" }, lang)}
          value={orderNumber || orderId}
          isRTL={isRTL}
        />
        <Row
          label={resolveTranslated({ en: "Service", ar: "الخدمة", ur: "سروس" }, lang)}
          value={title}
          isRTL={isRTL}
        />
        <Row
          label={resolveTranslated({ en: "Expected Delivery", ar: "التسليم المتوقع", ur: "متوقع ڈیلیوری" }, lang)}
          value={`${deliveryDays} ${resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}`}
          isRTL={isRTL}
        />
        <div className="flex justify-between pt-3 border-t border-border">
          <span className="font-bold text-foreground">
            {resolveTranslated({ en: "Total Paid", ar: "المبلغ المدفوع", ur: "کل ادائیگی" }, lang)}
          </span>
          <span className="font-bold text-primary tabular-nums">
            {formatCurrency(displayAmount, service?.currency)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center max-w-md mx-auto">
        {/* View Order — middleware handles tenant prefix on subdomains */}
        <Link
          href={tenantRoutes.myOrder(orderId)}
          className="inline-flex items-center justify-center h-11 px-5 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition"
        >
          {resolveTranslated({ en: "View Order", ar: "عرض الطلب", ur: "آرڈر دیکھیں" }, lang)}
        </Link>

        <Link
          href={tenantRoutes.home()}
          onClick={() => onReset?.()}
          className="inline-flex items-center justify-center h-11 px-5 bg-muted border border-border text-foreground rounded-xl font-semibold hover:bg-muted/70 transition-colors"
        >
          {resolveTranslated({ en: "Back to Home", ar: "العودة للرئيسية", ur: "ہوم پر واپس" }, lang)}
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, isRTL }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-end">{value}</span>
    </div>
  );
}
