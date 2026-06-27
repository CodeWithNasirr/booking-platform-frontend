// src/app/tenant-site/modules/order-checkout/steps/ConfirmationStep.js
"use client";

import Link from "next/link";
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
  const color = theme.primary_color || "#3B82F6";
  const displayAmount = totalAmount || selectedPackage?.price || service?.base_price || 0;

  return (
    <div className="mt-8 text-center space-y-6">
      {/* Success icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-4xl"
        style={{ backgroundColor: "#10B981" }}
      >
        ✓
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {resolveTranslated(
            { en: "Order Confirmed!", ar: "تم تأكيد الطلب!", ur: "آرڈر کی تصدیق!" },
            lang
          )}
        </h2>
        <p className="text-gray-600">
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
      <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
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
        <div className="flex justify-between pt-3 border-t">
          <span className="font-bold text-gray-900">
            {resolveTranslated({ en: "Total Paid", ar: "المبلغ المدفوع", ur: "کل ادائیگی" }, lang)}
          </span>
          <span className="font-bold" style={{ color }}>
            {formatCurrency(displayAmount, service?.currency)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {/* View Order — middleware handles tenant prefix on subdomains */}
        <Link
          href={tenantRoutes.myOrder(orderId)}
          className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: color }}
        >
          {resolveTranslated(
            { en: "View Order", ar: "عرض الطلب", ur: "آرڈر دیکھیں" },
            lang
          )}
        </Link>

        <Link
          href={tenantRoutes.home()}
          onClick={() => onReset?.()}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
        >
          {resolveTranslated(
            { en: "Back to Home", ar: "العودة للرئيسية", ur: "ہوم پر واپس" },
            lang
          )}
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, isRTL }) {
  return (
    <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}